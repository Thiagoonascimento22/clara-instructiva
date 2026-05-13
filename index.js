require('dotenv').config();
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const { createClient } = require('@supabase/supabase-js');
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');

const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS manual
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GEMINI_API_KEY = process.env.CLAUDE_API_KEY;
const WABA_ID = process.env.WABA_ID;
const META_APP_ID = process.env.META_APP_ID;

const supabase = createClient(
  process.env.URL_SUPABASE,
  process.env.SUPABASE_SERVICE_KEY
);

const uploadProfilePic = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Apenas JPG ou PNG'));
  }
});

const SYSTEM_PROMPT_FALLBACK = `Você é a Clara, consultora de vendas da Escola Instructiva, escola técnica em eletrônica fundada pelo Prof. Celso Muniz. Tom amigável e direto. Mensagens curtas, máx 3 parágrafos. Máx 2 emojis. Não invente preços.`;

// ════════════════════════════════════════════════════════════════
// MULTI-NUMBER WHATSAPP — Resolução de credenciais por número
// Cada número tem seu próprio phone_number_id + access_token
// Cache em memória de 30s pra reduzir queries no webhook (alto tráfego)
// ════════════════════════════════════════════════════════════════
const wppCredsCache = new Map();
const WPP_CACHE_TTL_MS = 30000;

function getCredsFromEnv() {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return null;
  return { id: null, phone_number_id: PHONE_NUMBER_ID, access_token: WHATSAPP_TOKEN };
}

async function getCredsByPhoneNumberId(phoneNumberId) {
  if (!phoneNumberId) return null;
  const key = `pid:${phoneNumberId}`;
  const cached = wppCredsCache.get(key);
  if (cached && Date.now() - cached.at < WPP_CACHE_TTL_MS) return cached.creds;
  try {
    const { data } = await supabase
      .from('whatsapp_numbers')
      .select('id, phone_number_id, access_token, nome, whatsapp_business_id')
      .eq('phone_number_id', phoneNumberId)
      .eq('ativo', true)
      .maybeSingle();
    const creds = data ? { id: data.id, phone_number_id: data.phone_number_id, access_token: data.access_token, nome: data.nome, whatsapp_business_id: data.whatsapp_business_id } : null;
    wppCredsCache.set(key, { creds, at: Date.now() });
    return creds;
  } catch (e) {
    console.error('getCredsByPhoneNumberId erro:', e.message);
    return null;
  }
}

async function getCredsById(whatsappNumberId) {
  if (!whatsappNumberId) return null;
  const key = `id:${whatsappNumberId}`;
  const cached = wppCredsCache.get(key);
  if (cached && Date.now() - cached.at < WPP_CACHE_TTL_MS) return cached.creds;
  try {
    const { data } = await supabase
      .from('whatsapp_numbers')
      .select('id, phone_number_id, access_token, nome, whatsapp_business_id')
      .eq('id', whatsappNumberId)
      .eq('ativo', true)
      .maybeSingle();
    const creds = data ? { id: data.id, phone_number_id: data.phone_number_id, access_token: data.access_token, nome: data.nome, whatsapp_business_id: data.whatsapp_business_id } : null;
    wppCredsCache.set(key, { creds, at: Date.now() });
    return creds;
  } catch (e) {
    console.error('getCredsById erro:', e.message);
    return null;
  }
}

// Resolve credenciais a partir de uma conversa — usa o número que a conversa
// usa OU faz fallback pro env var (backward compat)
async function resolveCredsForConversa(conversaId) {
  if (conversaId) {
    try {
      const { data: conv } = await supabase
        .from('conversas')
        .select('whatsapp_number_id')
        .eq('id', conversaId)
        .maybeSingle();
      if (conv?.whatsapp_number_id) {
        const c = await getCredsById(conv.whatsapp_number_id);
        if (c) return c;
      }
    } catch (e) {
      console.error('resolveCredsForConversa erro:', e.message);
    }
  }
  return getCredsFromEnv();
}

// Invalida cache (chamar quando UI alterar/remover número)
function invalidarCacheWpp() { wppCredsCache.clear(); }

// ════════════════════════════════════════════════════════════════
// HELPERS WHATSAPP
// ════════════════════════════════════════════════════════════════
async function sendTypingIndicator(messageId, creds = null) {
  const c = creds || getCredsFromEnv();
  if (!c) return;
  const url = `https://graph.facebook.com/v22.0/${c.phone_number_id}/messages`;
  try {
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
        typing_indicator: { type: 'text' }
      },
      { headers: { Authorization: `Bearer ${c.access_token}` } }
    );
    console.log(`✓ Typing indicator enviado pra mensagem ${messageId}`);
  } catch (err) {
    console.error('Erro typing indicator:', err.response?.data?.error?.message || err.message);
  }
}

function calcularTempoDigitando(texto) {
  const len = (texto || '').length;
  if (len <= 80) return 4000;
  if (len <= 250) return 8000;
  return 14000;
}

async function sendWhatsAppMessage(to, message, creds = null) {
  const c = creds || getCredsFromEnv();
  if (!c) throw new Error('Sem credenciais WhatsApp configuradas');
  const url = `https://graph.facebook.com/v22.0/${c.phone_number_id}/messages`;
  try {
    const r = await axios.post(
      url,
      { messaging_product: 'whatsapp', to, type: 'text', text: { body: message } },
      { headers: { Authorization: `Bearer ${c.access_token}` } }
    );
    console.log(`Mensagem enviada para ${to} via número ${c.nome || c.phone_number_id}`);
    return r.data;
  } catch (err) {
    console.error('Erro WhatsApp - Status:', err.response?.status);
    console.error('Erro WhatsApp - Data:', JSON.stringify(err.response?.data));
    throw err;
  }
}

async function sendWhatsAppTemplate(to, templateName, language, variables = [], creds = null) {
  const c = creds || getCredsFromEnv();
  if (!c) return { ok: false, error: 'Sem credenciais WhatsApp configuradas' };
  const url = `https://graph.facebook.com/v22.0/${c.phone_number_id}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language || 'pt_BR' }
    }
  };
  if (variables && variables.length > 0) {
    body.template.components = [{
      type: 'body',
      parameters: variables.map(v => ({ type: 'text', text: String(v) }))
    }];
  }
  try {
    const r = await axios.post(url, body, {
      headers: { Authorization: `Bearer ${c.access_token}` }
    });
    return { ok: true, message_id: r.data.messages?.[0]?.id };
  } catch (err) {
    return {
      ok: false,
      error: err.response?.data?.error?.message || err.message,
      details: err.response?.data
    };
  }
}

async function getTemplateVariableCount(templateName, creds = null) {
  const wabaId = creds?.whatsapp_business_id || WABA_ID;
  const token = creds?.access_token || WHATSAPP_TOKEN;
  if (!wabaId) return 0;
  try {
    const url = `https://graph.facebook.com/v22.0/${wabaId}/message_templates?fields=name,components&limit=200`;
    const r = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    const tpl = (r.data.data || []).find(t => t.name === templateName);
    if (!tpl) return 0;
    const body = (tpl.components || []).find(c => c.type === 'BODY')?.text || '';
    const matches = body.match(/\{\{\d+\}\}/g) || [];
    return new Set(matches).size;
  } catch (err) {
    console.error('Erro ao buscar variáveis do template:', err.message);
    return 0;
  }
}

// ════════════════════════════════════════════════════════════════
// HELPERS LEADS / CONVERSAS / MENSAGENS
// ════════════════════════════════════════════════════════════════
function normalizePhone(phone) {
  if (!phone) return phone;
  let p = String(phone).replace(/\D/g, '');
  if (p.length === 10 || p.length === 11) p = '55' + p;
  if (p.length === 12) {
    const ddi = p.slice(0, 2);
    const ddd = p.slice(2, 4);
    const num = p.slice(4);
    p = ddi + ddd + '9' + num;
  }
  return p;
}

async function getOrCreateLead(phone, name = null) {
  const normalizedPhone = normalizePhone(phone);
  let { data: lead } = await supabase.from('leads').select('*').eq('phone', normalizedPhone).single();
  if (!lead) {
    const insertData = { phone: normalizedPhone };
    if (name) insertData.name = name;
    const { data: newLead } = await supabase.from('leads').insert(insertData).select().single();
    lead = newLead;
  } else if (name && (!lead.name || /^Lead \d+$/.test(lead.name))) {
    const { data: updated } = await supabase
      .from('leads')
      .update({ name })
      .eq('id', lead.id)
      .select()
      .single();
    if (updated) lead = updated;
    console.log(`Nome do lead ${normalizedPhone} atualizado: ${name}`);
  }
  return lead;
}

async function getOrCreateConversa(leadId, whatsappNumberId = null) {
  // Se whatsappNumberId foi passado, filtra também por ele → cada (lead × número) vira conversa isolada.
  // Sem isso, leads que já falaram com a empresa em OUTRO número receberiam contexto antigo.
  let query = supabase
    .from('conversas')
    .select('*')
    .eq('lead_id', leadId)
    .eq('status', 'aberta')
    .eq('arquivada', false);

  if (whatsappNumberId) {
    query = query.eq('whatsapp_number_id', whatsappNumberId);
  }

  const { data: conversas } = await query.order('updated_at', { ascending: false }).limit(1);

  if (conversas && conversas.length > 0) {
    return conversas[0];
  }

  // Não achou conversa nesse canal → cria nova (com whatsapp_number_id se foi passado)
  const insertData = { lead_id: leadId, channel: 'whatsapp', status: 'aberta', arquivada: false };
  if (whatsappNumberId) insertData.whatsapp_number_id = whatsappNumberId;

  const { data: nova } = await supabase
    .from('conversas')
    .insert(insertData)
    .select()
    .single();
  return nova;
}

async function salvarMensagem(conversaId, leadId, role, content) {
  await supabase.from('mensagens').insert({ conversa_id: conversaId, lead_id: leadId, role, content });
  await supabase.from('conversas').update({ updated_at: new Date() }).eq('id', conversaId);
}

async function buscarHistorico(conversaId, limite = 10) {
  const { data } = await supabase
    .from('mensagens')
    .select('role, content')
    .eq('conversa_id', conversaId)
    .order('created_at', { ascending: false })
    .limit(limite);
  return (data || []).reverse();
}

async function buscarAgenteAtivo(conversaId) {
  const { data: conversa } = await supabase
    .from('conversas')
    .select('campanha_id, agente_id_override, campanhas(agente_id)')
    .eq('id', conversaId)
    .single();

  // Prioridade 1: agente_id_override (usado em recuperação Hotmart)
  if (conversa?.agente_id_override) {
    const { data: agente } = await supabase
      .from('agentes')
      .select('*')
      .eq('id', conversa.agente_id_override)
      .single();
    if (agente) return agente;
  }

  // Prioridade 2: agente da campanha
  if (conversa?.campanhas?.agente_id) {
    const { data: agente } = await supabase
      .from('agentes')
      .select('*')
      .eq('id', conversa.campanhas.agente_id)
      .single();
    if (agente) return agente;
  }

  // Prioridade 3: agente padrão
  const { data: padrao } = await supabase
    .from('agentes')
    .select('*')
    .eq('is_default', true)
    .eq('ativo', true)
    .limit(1)
    .single();

  return padrao || null;
}

async function deveSobrescreverCampanha(conversaId) {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const { data: ultimaResposta } = await supabase
    .from('mensagens')
    .select('created_at')
    .eq('conversa_id', conversaId)
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!ultimaResposta) return true;
  const idade = Date.now() - new Date(ultimaResposta.created_at).getTime();
  return idade > SEVEN_DAYS_MS;
}

async function askClara(userMessage, historico = [], agente = null, nomeLead = null) {
  const promptBase = agente?.system_prompt || SYSTEM_PROMPT_FALLBACK;
  const baseConhecimento = agente?.base_conhecimento ? `\n\nBASE DE CONHECIMENTO:\n${agente.base_conhecimento}` : '';
  const historicoTexto = historico.map(m => `${m.role === 'user' ? 'Lead' : 'Clara'}: ${m.content}`).join('\n');

  // Normaliza nome real do lead — usa primeiro nome, ignora se vazio ou "Lead 123"
  const nomeFirst = nomeLead && nomeLead.trim() && !/^Lead \d+$/i.test(nomeLead.trim())
    ? nomeLead.trim().split(/\s+/)[0]
    : null;

  const regraNome = nomeFirst
    ? `\n\n═══ NOME REAL DO LEAD: ${nomeFirst} ═══\nVocê PODE usar esse nome real ao se dirigir ao lead (em momentos de conexão, sem exagerar). REGRA ABSOLUTA: NUNCA escreva placeholders como [nome], [Nome], [primeiro nome], [Lead Name], [Nome do Lead] ou QUALQUER texto entre colchetes. Se for usar nome, é o REAL acima. Se preferir não usar nome, simplesmente não use.`
    : `\n\n═══ NOME REAL DO LEAD: desconhecido ═══\nNão sabemos o nome real do lead ainda. REGRA ABSOLUTA: NUNCA escreva placeholders como [nome], [Nome], [primeiro nome], [Lead Name], [Nome do Lead] ou QUALQUER texto entre colchetes. Faça a mensagem SEM nome.`;

  const prompt = promptBase
    + baseConhecimento
    + regraNome
    + (historicoTexto ? `\n\nHISTÓRICO:\n${historicoTexto}` : '')
    + `\n\nMensagem atual do lead: ${userMessage}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const r = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] });
  let reply = r.data.candidates[0].content.parts[0].text;

  // FAIL-SAFE: se mesmo assim Gemini colocar placeholder, removemos antes de enviar pro lead
  reply = reply.replace(/\[\s*(primeiro\s*nome|nome\s*do\s*lead|lead\s*name|nome|name)\s*\]/gi, nomeFirst || '').replace(/\s+/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();

  const usage = r.data.usageMetadata || {};
  const inputTokens = usage.promptTokenCount || 0;
  const outputTokens = usage.candidatesTokenCount || 0;

  salvarGastoGemini(inputTokens, outputTokens).catch(e => 
    console.error('Erro ao salvar gasto Gemini:', e.message)
  );

  return reply;
}

async function salvarGastoGemini(inputTokens, outputTokens) {
  if (!inputTokens && !outputTokens) return;

  // Preços oficiais Gemini 2.5 Flash (texto): $0.30/M input, $2.50/M output
  const PRECO_INPUT_USD = 0.30 / 1_000_000;
  const PRECO_OUTPUT_USD = 2.50 / 1_000_000;
  const custoUSD = (inputTokens * PRECO_INPUT_USD) + (outputTokens * PRECO_OUTPUT_USD);
  if (custoUSD <= 0) return;

  const cotacao = await getCotacaoUSDBRL();
  const custoBRL = custoUSD * cotacao;
  const hoje = new Date().toISOString().slice(0, 10);
  const categoria = 'Tokens IA';

  const { data: existing } = await supabase
    .from('gastos')
    .select('id, valor')
    .eq('data', hoje)
    .eq('categoria', categoria)
    .eq('source', 'gemini_auto')
    .limit(1);

  if (existing && existing.length > 0) {
    const novoValor = parseFloat(existing[0].valor) + custoBRL;
    await supabase.from('gastos').update({ valor: novoValor }).eq('id', existing[0].id);
  } else {
    await supabase.from('gastos').insert({
      valor: custoBRL,
      descricao: `Gemini Flash - ${hoje}`,
      data: hoje,
      canal: 'gemini',
      categoria,
      source: 'gemini_auto'
    });
  }
}

// ════════════════════════════════════════════════════════════════
// FOLLOW-UP AUTOMÁTICO INTELIGENTE
// ════════════════════════════════════════════════════════════════
// Analisa se a conversa precisa de follow-up via Gemini
async function analisarPrecisaFollowup(historico) {
  if (!historico || historico.length === 0) return { precisa: false, motivo: 'Conversa vazia' };

  const historicoTexto = historico.map(m => `${m.role === 'user' ? 'Lead' : 'Clara'}: ${m.content}`).join('\n');

  const prompt = `Você é um analista de vendas. Analise a conversa abaixo e responda APENAS com um JSON válido (sem markdown, sem explicação extra).

CONVERSA:
${historicoTexto}

PERGUNTA: A última mensagem foi da Clara, e o lead não respondeu há mais de 2 horas. A Clara DEVE fazer follow-up?

REGRAS PARA precisa_followup = true:
- Lead parou no meio de uma qualificação importante
- Clara fez uma pergunta e lead não respondeu
- Clara mandou link de pagamento sem confirmação
- Clara apresentou oferta e lead sumiu
- Conversa ficou em aberto sem desfecho

REGRAS PARA precisa_followup = false:
- Lead disse claramente "vou comprar" ou "já comprei"
- Lead disse "vou pensar" ou "depois te falo" (já recebeu sinalização clara)
- Lead disse "não tenho interesse" ou "não vai dar"
- Conversa fechou naturalmente (lead agradeceu e despediu)
- Última msg da Clara foi uma despedida ou agradecimento
- Última msg da Clara já FOI um follow-up

RESPONDA APENAS NESSE FORMATO JSON:
{"precisa_followup": true/false, "motivo": "explicação curta em 1 frase"}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const r = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] }, { timeout: 30000 });
    const txt = r.data.candidates[0].content.parts[0].text.trim();

    // Registra o gasto desse token também (era um bug — não estava registrando)
    const usage = r.data.usageMetadata || {};
    salvarGastoGemini(usage.promptTokenCount || 0, usage.candidatesTokenCount || 0).catch(() => {});

    // Limpa markdown se vier
    const cleanTxt = txt.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanTxt);
    
    return { precisa: parsed.precisa_followup === true, motivo: parsed.motivo || '' };
  } catch (err) {
    console.error('Erro analisarPrecisaFollowup:', err.message);
    return { precisa: false, motivo: 'Erro na análise, não vai mandar follow-up por segurança' };
  }
}

// Gera mensagem de follow-up natural via Gemini
async function gerarMensagemFollowup(historico, agente, nomeLead) {
  const promptBase = agente?.system_prompt || SYSTEM_PROMPT_FALLBACK;
  const baseConhecimento = agente?.base_conhecimento ? `\n\nBASE DE CONHECIMENTO:\n${agente.base_conhecimento}` : '';
  const historicoTexto = historico.map(m => `${m.role === 'user' ? 'Lead' : 'Clara'}: ${m.content}`).join('\n');

  // Normaliza nome do lead: usa primeiro nome, ignora se vazio ou "Lead 123"
  const nomeFirst = nomeLead && nomeLead.trim() && !/^Lead \d+$/i.test(nomeLead.trim())
    ? nomeLead.trim().split(/\s+/)[0]
    : null;

  const nomeContexto = nomeFirst
    ? `\n\nNOME REAL DO LEAD: ${nomeFirst}\nVocê PODE usar esse nome real na mensagem se fizer sentido (mas sem exagerar). NUNCA escreva placeholders como [nome], [Nome], [Lead Name] ou [Nome do Lead] — sempre o nome REAL acima ou nenhum nome.`
    : `\n\nNOME DO LEAD: desconhecido\nFaça a mensagem SEM nome. NUNCA escreva placeholders como [nome], [Nome], [Lead Name] ou [Nome do Lead].`;

  const prompt = promptBase + baseConhecimento + nomeContexto + `

HISTÓRICO DA CONVERSA:
${historicoTexto}

CONTEXTO: O lead não respondeu há mais de 2 horas. Você precisa fazer um FOLLOW-UP curto e natural pra retomar a conversa.

REGRAS DO FOLLOW-UP:
- Mensagem CURTA, máximo 2 linhas
- Tom leve, descontraído, sem pressão
- NÃO repete tudo que já foi falado
- Foca em retomar a conversa de onde parou
- 1 emoji no máximo (🤝 ou 😊)
- Não usa "!!!" nem pontuação ansiosa
- Soa como amiga lembrando de algo, não como vendedor cobrando
- PROIBIDO ABSOLUTO: nunca, JAMAIS escreva [nome], [Nome], [Lead Name], [Nome do Lead] ou qualquer texto entre colchetes na mensagem. Use o nome REAL fornecido acima OU não use nome nenhum.

EXEMPLOS DE BONS FOLLOW-UPS (formato — adapte ao contexto):
- "Conseguiu pensar? 🤝 Posso te ajudar com alguma dúvida?"
- "Tudo bem? Lembrei aqui de você. Conseguiu dar uma olhada?"
- "Passando pra ver se ficou alguma dúvida 😊"

ESCREVA APENAS A MENSAGEM DE FOLLOW-UP, sem comentários adicionais:`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const r = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] }, { timeout: 30000 });
    const reply = r.data.candidates[0].content.parts[0].text.trim();

    const usage = r.data.usageMetadata || {};
    salvarGastoGemini(usage.promptTokenCount || 0, usage.candidatesTokenCount || 0).catch(() => {});

    return reply;
  } catch (err) {
    console.error('Erro gerarMensagemFollowup:', err.message);
    return null;
  }
}

// Processa follow-ups de todas as conversas elegíveis
// ════════════════════════════════════════════════════════════════
// PROCESSAR RECUPERAÇÃO DE CARRINHO ABANDONADO (HOTMART)
// ════════════════════════════════════════════════════════════════
// Roda no cron a cada 5 min. Faz 2 coisas:
// 1. Envia 1ª msg pra conversas onde followup_at já passou e etapa = 'recuperacao_inicial'
// 2. Envia follow-up 24h depois pra conversas que receberam 1ª msg e lead não respondeu
// 3. Encerra conversas que não tiveram resposta após 48h do follow-up
// ════════════════════════════════════════════════════════════════

async function processarRecuperacaoHotmart() {
  try {
    const agora = new Date().toISOString();
    const followupHoras = parseInt(process.env.HOTMART_FOLLOWUP_HORAS) || 24;

    // PARTE 1: Enviar 1ª mensagem (passou os 30 min)
    const { data: pendentes } = await supabase
      .from('conversas')
      .select('id, lead_id, agente_id_override, leads(phone, name), meta')
      .eq('tipo', 'recuperacao_carrinho')
      .eq('status', 'aberta')
      .eq('followup_etapa', 'recuperacao_inicial')
      .lt('followup_at', agora)
      .limit(10);

    if (pendentes && pendentes.length > 0) {
      console.log(`🛒 ${pendentes.length} recuperação(ões) a enviar 1ª msg`);

      for (const conv of pendentes) {
        try {
          const phone = conv.leads?.phone;
          const nome = conv.leads?.name || 'tudo bem';

          if (!phone) {
            console.log(`⏭️  Conversa ${conv.id}: sem telefone, pulando`);
            continue;
          }

          // Mensagem inicial de recuperação (texto fixo, NÃO usa template porque
          // assumimos que carrinho abandonado é dentro da janela de 24h da Meta)
          const mensagem = `Oi, ${nome}! 👋\nVi aqui que você quase fechou o curso de Inversores Solares do Prof. Celso, mas algo travou na hora de finalizar.\nAconteceu alguma coisa? Posso ajudar a resolver.`;

          // Resolve credenciais do número correto pra essa conversa
          const credsRec = await resolveCredsForConversa(conv.id);

          // Envia via WhatsApp
          const enviado = await sendWhatsAppMessage(phone, mensagem, credsRec);

          if (enviado) {
            // Salva como mensagem da assistant
            await salvarMensagem(conv.id, conv.lead_id, 'assistant', mensagem);

            // Marca como enviada e agenda follow-up pra 24h depois
            const followupEm = new Date(Date.now() + followupHoras * 60 * 60 * 1000);
            await supabase.from('conversas').update({
              followup_etapa: 'aguardando_resposta',
              followup_at: followupEm.toISOString(),
              recuperacao_inicial_enviada_em: new Date().toISOString()
            }).eq('id', conv.id);

            console.log(`✅ Recuperação 1ª msg enviada pra ${nome} (${phone})`);
          } else {
            console.error(`❌ Falha enviando recuperação pra ${phone}`);
          }

          await new Promise(r => setTimeout(r, 1500));
        } catch (e) {
          console.error(`Erro recuperação conversa ${conv.id}:`, e.message);
        }
      }
    }

    // PARTE 2: Enviar FOLLOW-UP (24h sem resposta)
    const { data: aguardando } = await supabase
      .from('conversas')
      .select('id, lead_id, leads(phone, name), recuperacao_inicial_enviada_em')
      .eq('tipo', 'recuperacao_carrinho')
      .eq('status', 'aberta')
      .eq('followup_etapa', 'aguardando_resposta')
      .lt('followup_at', agora)
      .limit(10);

    if (aguardando && aguardando.length > 0) {
      console.log(`🔄 ${aguardando.length} recuperação(ões) candidatas a follow-up`);

      for (const conv of aguardando) {
        try {
          // Verifica se o lead respondeu desde a 1ª msg
          const enviadaEm = conv.recuperacao_inicial_enviada_em;
          const { data: respostas } = await supabase
            .from('mensagens')
            .select('id')
            .eq('conversa_id', conv.id)
            .eq('role', 'user')
            .gt('created_at', enviadaEm)
            .limit(1);

          if (respostas && respostas.length > 0) {
            // Lead respondeu! Não manda follow-up automático
            // (a Clara já cuida da conversa daqui pra frente)
            await supabase.from('conversas').update({
              followup_etapa: 'em_atendimento'
            }).eq('id', conv.id);
            console.log(`✅ Lead ${conv.leads?.name} respondeu, removendo follow-up automático`);
            continue;
          }

          // Lead não respondeu → manda follow-up
          const phone = conv.leads?.phone;
          const nome = conv.leads?.name || '';
          if (!phone) continue;

          const followupMsg = `Oi, ${nome}! Apareci só pra saber se você ainda quer entrar no curso de Inversores Solares. Se sim, posso te ajudar a finalizar do jeito que encaixar melhor pra você 🤝`;

          const credsFup = await resolveCredsForConversa(conv.id);
          const enviado = await sendWhatsAppMessage(phone, followupMsg, credsFup);

          if (enviado) {
            await salvarMensagem(conv.id, conv.lead_id, 'assistant', followupMsg);

            // Agenda encerramento pra 48h depois
            const encerrarEm = new Date(Date.now() + 48 * 60 * 60 * 1000);
            await supabase.from('conversas').update({
              followup_etapa: 'aguardando_followup',
              followup_at: encerrarEm.toISOString(),
              followup_enviado_em: new Date().toISOString()
            }).eq('id', conv.id);

            console.log(`✅ Follow-up recuperação enviado pra ${nome}`);
          }

          await new Promise(r => setTimeout(r, 1500));
        } catch (e) {
          console.error(`Erro follow-up recuperação ${conv.id}:`, e.message);
        }
      }
    }

    // PARTE 3: Encerrar conversas sem resposta após 48h do follow-up
    const { data: encerrar } = await supabase
      .from('conversas')
      .select('id, leads(name)')
      .eq('tipo', 'recuperacao_carrinho')
      .eq('status', 'aberta')
      .eq('followup_etapa', 'aguardando_followup')
      .lt('followup_at', agora)
      .limit(20);

    if (encerrar && encerrar.length > 0) {
      console.log(`🔚 ${encerrar.length} recuperação(ões) sem resposta — encerrando`);
      for (const conv of encerrar) {
        await supabase.from('conversas').update({
          status: 'encerrada',
          followup_etapa: 'encerrada_sem_resposta',
          arquivada: true
        }).eq('id', conv.id);
        console.log(`🔚 Conversa de recuperação ${conv.id} (${conv.leads?.name}) encerrada — sem resposta`);
      }
    }

  } catch (err) {
    console.error('❌ Erro processarRecuperacaoHotmart:', err.message);
    console.error(err.stack);
  }
}

async function processarFollowups() {
  try {
    const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Busca conversas onde:
    // - Não tem follow-up enviado ainda
    // - IA está ativa
    // - Última atualização foi entre 2h e 24h atrás (janela de 24h da Meta)
    // - Não está arquivada
    // - Status aberta
    const { data: conversas, error } = await supabase
      .from('conversas')
      .select('id, lead_id, updated_at, leads(phone, name)')
      .is('followup_enviado_em', null)
      .eq('ia_active', true)
      .eq('status', 'aberta')
      .eq('arquivada', false)
      .lt('updated_at', duasHorasAtras)
      .gt('updated_at', vinteQuatroHorasAtras)
      .limit(20);

    if (error) {
      console.error('Erro ao buscar conversas pra follow-up:', error.message);
      return;
    }

    if (!conversas || conversas.length === 0) return;

    console.log(`🔍 ${conversas.length} conversa(s) candidata(s) a follow-up`);

    for (const conv of conversas) {
      try {
        const historico = await buscarHistorico(conv.id, 15);
        if (!historico.length) continue;

        // Última mensagem precisa ser da Clara (assistant), senão lead já respondeu
        const ultimaMsg = historico[historico.length - 1];
        if (ultimaMsg.role !== 'assistant') {
          console.log(`Conversa ${conv.id}: última msg foi do lead, não precisa follow-up`);
          continue;
        }

        // Pergunta pro Gemini se precisa follow-up
        const analise = await analisarPrecisaFollowup(historico);
        console.log(`Conversa ${conv.id}: precisa_followup=${analise.precisa} — ${analise.motivo}`);

        if (!analise.precisa) {
          // Marca como "decidiu não fazer follow-up" pra não reanalizar toda hora
          await supabase.from('conversas').update({ followup_enviado_em: new Date() }).eq('id', conv.id);
          continue;
        }

        // Gera mensagem
        const agente = await buscarAgenteAtivo(conv.id);
        const mensagem = await gerarMensagemFollowup(historico, agente, conv.leads?.name);

        if (!mensagem) {
          console.error(`Conversa ${conv.id}: falhou em gerar mensagem`);
          continue;
        }

        // Envia
        const phone = conv.leads?.phone;
        if (!phone) continue;

        const credsFollow = await resolveCredsForConversa(conv.id);
        await sendWhatsAppMessage(phone, mensagem, credsFollow);
        await salvarMensagem(conv.id, conv.lead_id, 'assistant', mensagem);
        await supabase.from('conversas').update({ followup_enviado_em: new Date() }).eq('id', conv.id);

        console.log(`✅ Follow-up enviado para ${phone}: "${mensagem.substring(0, 60)}..."`);

        // Aguarda 2 segundos entre follow-ups pra não sobrecarregar
        await new Promise(r => setTimeout(r, 2000));

      } catch (e) {
        console.error(`Erro processando follow-up da conversa ${conv.id}:`, e.message);
      }
    }
  } catch (err) {
    console.error('Erro processarFollowups:', err.message);
  }
}

// ════════════════════════════════════════════════════════════════
// WEBHOOKS WHATSAPP
// ════════════════════════════════════════════════════════════════
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const recebidoEm = value?.metadata?.phone_number_id;

    // === MULTI-NUMBER: identifica qual dos NOSSOS números recebeu a msg ===
    let whatsappNumberId = null; // UUID do registro em whatsapp_numbers (null = usa env var legado)
    if (recebidoEm) {
      const reg = await getCredsByPhoneNumberId(recebidoEm);
      if (reg) {
        whatsappNumberId = reg.id;
      } else if (recebidoEm !== PHONE_NUMBER_ID) {
        // Não tá cadastrado E não é o número do env var → ignora
        console.log(`Ignorado: msg veio pro número ${recebidoEm} (não cadastrado em whatsapp_numbers)`);
        return;
      }
      // Se chegou aqui sem reg mas igual ao env var → continua com whatsappNumberId=null (legacy)
    }

    if (value?.statuses?.length) {
      for (const st of value.statuses) {
        const msgId = st.id;
        const status = st.status;
        const updateData = {};
        if (status === 'delivered') { updateData.status = 'entregue'; updateData.entregue_em = new Date(); }
        else if (status === 'read') { updateData.status = 'lido'; }
        else if (status === 'failed') { updateData.status = 'erro'; updateData.erro_mensagem = JSON.stringify(st.errors); }

        if (Object.keys(updateData).length) {
          await supabase.from('campanha_envios').update(updateData).eq('whatsapp_message_id', msgId);
        }
      }
    }

    const message = value?.messages?.[0];
    if (!message) return;

    const from = message.from;
    const text = message.text?.body || '';
    const profileName = value?.contacts?.[0]?.profile?.name || null;
    const msgType = message.type; // 'text', 'audio', 'image', 'document', 'video'

    // Detecta mídia recebida do lead
    if (['audio','image','document','video'].includes(msgType)) {
      console.log(`Mensagem ${msgType} recebida de ${from} (${profileName}) via número ${recebidoEm}`);
      await processarMidiaRecebida(from, message, profileName, whatsappNumberId);
      return;
    }

    if (!text) return;

    console.log(`Mensagem recebida de ${from} (${profileName}) via ${recebidoEm}: ${text}`);

    // Buffer de 8s pra agrupar mensagens consecutivas (anti double-text robotizado)
    await bufferarMensagem(from, text, profileName, message.id, whatsappNumberId);

  } catch (err) {
    console.error('Erro webhook:', err.message);
  }
});

// ════════════════════════════════════════════════════════════════
// PROCESSAR MÍDIA RECEBIDA DO LEAD
// Quando lead manda áudio/imagem/documento, baixa da Meta e salva
// como mensagem com media_url. NÃO faz IA responder (pra Clara não
// tentar responder algo que não entendeu).
// ════════════════════════════════════════════════════════════════
async function processarMidiaRecebida(from, message, profileName, whatsappNumberId = null) {
  try {
    const msgType = message.type;
    const mediaObj = message[msgType];
    if (!mediaObj?.id) {
      console.warn(`Mídia ${msgType} sem ID, ignorando`);
      return;
    }

    // 1. Pega URL temporária do media na Meta
    const mediaInfoUrl = `https://graph.facebook.com/v22.0/${mediaObj.id}`;
    const infoResp = await axios.get(mediaInfoUrl, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
    });
    const mediaDownloadUrl = infoResp.data?.url;
    const mimeType = infoResp.data?.mime_type || mediaObj.mime_type || '';

    if (!mediaDownloadUrl) {
      console.warn(`Sem URL pra baixar mídia ${mediaObj.id}`);
      return;
    }

    // 2. Salva info no banco (sem baixar o arquivo - usuário não pediu storage)
    // O frontend vai fazer fetch direto via endpoint proxy quando precisar exibir
    const lead = await getOrCreateLead(from, profileName);
    const conversa = await getOrCreateConversa(lead.id, whatsappNumberId);

    const filename = mediaObj.filename || `${msgType}_${Date.now()}`;
    const caption = message[msgType]?.caption || '';
    const content = caption || `[${msgType === 'audio' ? '🎤 Áudio' : msgType === 'image' ? '🖼️ Imagem' : msgType === 'video' ? '🎥 Vídeo' : '📎 Documento'}]`;

    await supabase.from('mensagens').insert({
      conversa_id: conversa.id,
      lead_id: lead.id,
      role: 'user',
      content,
      media_type: msgType,
      media_url: mediaObj.id, // Guardamos o ID da Meta — frontend vai puxar via proxy
      media_filename: filename
    });
    await supabase.from('conversas').update({ updated_at: new Date() }).eq('id', conversa.id);

    // Reseta flag de follow-up se lead respondeu
    if (conversa.followup_enviado_em) {
      await supabase.from('conversas').update({ followup_enviado_em: null }).eq('id', conversa.id);
    }

    // Marca campanha como respondida
    await supabase
      .from('campanha_envios')
      .update({ status: 'respondido', respondido_em: new Date() })
      .eq('lead_id', lead.id)
      .in('status', ['enviado', 'entregue', 'lido']);

    console.log(`✅ Mídia ${msgType} salva (id Meta: ${mediaObj.id})`);
  } catch (err) {
    console.error('Erro processarMidiaRecebida:', err.response?.data || err.message);
  }
}

// ════════════════════════════════════════════════════════════════
// PROXY DE MÍDIA — frontend chama esta rota com o ID da Meta,
// nós baixamos e devolvemos o arquivo (a Meta exige token Bearer)
// ════════════════════════════════════════════════════════════════
app.get('/api/media/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    if (!mediaId) return res.status(400).send('Missing mediaId');

    // Pega URL temporária
    const infoResp = await axios.get(`https://graph.facebook.com/v22.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
    });
    const url = infoResp.data?.url;
    const mimeType = infoResp.data?.mime_type || 'application/octet-stream';
    if (!url) return res.status(404).send('Media URL not found');

    // Baixa o arquivo da Meta (precisa do bearer)
    const fileResp = await axios.get(url, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
      responseType: 'arraybuffer',
      timeout: 30000
    });

    res.set('Content-Type', mimeType);
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(Buffer.from(fileResp.data));
  } catch (err) {
    console.error('Erro proxy media:', err.response?.data || err.message);
    res.status(500).send('Erro ao buscar mídia');
  }
});

// ════════════════════════════════════════════════════════════════
// BUFFER ANTI DOUBLE-TEXT
// Quando lead manda 2+ mensagens em sequência, junta tudo e responde 1x só
// ════════════════════════════════════════════════════════════════
const messageBuffer = new Map(); // chave: phone | valor: { messages, profileName, timer, lastMessageId }
const BUFFER_DELAY_MS = 8000; // 8 segundos de espera

async function bufferarMensagem(from, text, profileName, messageId, whatsappNumberId = null) {
  const existing = messageBuffer.get(from);

  if (existing) {
    // Já tem buffer aberto pra esse número — adiciona msg e reseta timer
    clearTimeout(existing.timer);
    existing.messages.push(text);
    existing.lastMessageId = messageId;
    if (profileName && !existing.profileName) existing.profileName = profileName;
    if (whatsappNumberId && !existing.whatsappNumberId) existing.whatsappNumberId = whatsappNumberId;
    existing.timer = setTimeout(() => processarBufferDoLead(from), BUFFER_DELAY_MS);
    console.log(`[BUFFER] +1 msg pra ${from} (total: ${existing.messages.length}) — reset timer 8s`);
  } else {
    // Primeira msg — cria buffer novo
    const entry = {
      messages: [text],
      profileName,
      lastMessageId: messageId,
      whatsappNumberId,
      timer: setTimeout(() => processarBufferDoLead(from), BUFFER_DELAY_MS)
    };
    messageBuffer.set(from, entry);
    console.log(`[BUFFER] Aberto pra ${from} — esperando 8s`);
  }
}

async function processarBufferDoLead(from) {
  const entry = messageBuffer.get(from);
  if (!entry) return;
  messageBuffer.delete(from); // libera o buffer

  try {
    const { messages, profileName, lastMessageId, whatsappNumberId } = entry;
    const textoCombinado = messages.join('\n');
    console.log(`[BUFFER] Processando ${messages.length} msg(s) de ${from}`);

    const lead = await getOrCreateLead(from, profileName);
    const conversa = await getOrCreateConversa(lead.id, whatsappNumberId);

    // === MULTI-NUMBER: associa conversa ao número que recebeu (se ainda não tiver) ===
    if (whatsappNumberId && !conversa.whatsapp_number_id) {
      await supabase.from('conversas')
        .update({ whatsapp_number_id: whatsappNumberId })
        .eq('id', conversa.id);
      conversa.whatsapp_number_id = whatsappNumberId;
    }

    // Resolve credenciais pra enviar a resposta pelo MESMO número que recebeu
    const creds = whatsappNumberId
      ? (await getCredsById(whatsappNumberId)) || getCredsFromEnv()
      : await resolveCredsForConversa(conversa.id);

    await supabase
      .from('campanha_envios')
      .update({ status: 'respondido', respondido_em: new Date() })
      .eq('lead_id', lead.id)
      .in('status', ['enviado', 'entregue', 'lido']);

    // Salva cada mensagem original separadamente no banco (mantém histórico fiel)
    for (const msg of messages) {
      await salvarMensagem(conversa.id, lead.id, 'user', msg);
    }

    if (conversa.followup_enviado_em) {
      await supabase.from('conversas').update({ followup_enviado_em: null }).eq('id', conversa.id);
    }

    if (conversa.ia_active === false) {
      console.log(`Clara pausada na conversa ${conversa.id} — humano assumiu, não respondendo`);
      return;
    }

    const historico = await buscarHistorico(conversa.id);
    const agente = await buscarAgenteAtivo(conversa.id);

    if (lastMessageId) await sendTypingIndicator(lastMessageId, creds);

    // Manda o texto COMBINADO pro Gemini — assim ela responde considerando todas as msgs juntas
    const reply = await askClara(textoCombinado, historico, agente, lead?.name);
    const tempoEspera = calcularTempoDigitando(reply);
    console.log(`[BUFFER] Aguardando ${tempoEspera}ms antes de responder`);
    await new Promise(r => setTimeout(r, tempoEspera));

    await salvarMensagem(conversa.id, lead.id, 'assistant', reply);
    await sendWhatsAppMessage(from, reply, creds);
  } catch (err) {
    console.error('[BUFFER] Erro processando:', err.message);
  }
}

// ════════════════════════════════════════════════════════════════
// HOTMART
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// HOTMART WEBHOOK - RECUPERAÇÃO DE CARRINHO ABANDONADO
// ════════════════════════════════════════════════════════════════
//
// Configuração na Hotmart:
//   URL: https://clara-instructiva-production.up.railway.app/hotmart
//   Evento: PURCHASE_OUT_OF_SHOPPING_CART (carrinho abandonado)
//   Token: configurar no Railway como HOTMART_WEBHOOK_TOKEN
//
// Variáveis Railway necessárias:
//   HOTMART_WEBHOOK_TOKEN: token gerado pela Hotmart no painel
//   HOTMART_RECUPERACAO_AGENTE_ID: UUID do agente "Clara — Recuperação Inversores Solares"
//   HOTMART_DELAY_MINUTOS: delay antes da 1ª msg (padrão: 30)
//   HOTMART_FOLLOWUP_HORAS: horas pra follow-up (padrão: 24)
//
// Fluxo:
//   1. Hotmart manda webhook (carrinho abandonado)
//   2. Backend valida token, extrai dados (nome, phone, email)
//   3. Cria/encontra lead no Supabase
//   4. Cria conversa com tag "RECUPERAÇÃO HOTMART" e agente_id específico
//   5. Agenda 1ª msg pra 30 min depois (via cron de follow-ups)
//   6. Se não responder em 24h, agenda follow-up
//   7. Após 48h sem resposta, encerra
// ════════════════════════════════════════════════════════════════

app.post('/hotmart', async (req, res) => {
  // Responde 200 IMEDIATAMENTE pra Hotmart não dar timeout
  res.sendStatus(200);

  try {
    const body = req.body || {};
    const event = body.event;
    const data = body.data || {};

    // Log de debug pra inspecionar payload
    console.log(`📩 Hotmart webhook recebido: event=${event}`);

    // 1. VALIDA TOKEN (segurança)
    const tokenRecebido = req.headers['x-hotmart-hottok']
      || body.hottok
      || req.headers['hottok'];
    const tokenEsperado = process.env.HOTMART_WEBHOOK_TOKEN;

    if (tokenEsperado && tokenRecebido !== tokenEsperado) {
      console.error('❌ Hotmart: token inválido ou ausente');
      return;
    }

    // 2. SÓ PROCESSA CARRINHO ABANDONADO (por enquanto)
    // Hotmart usa diferentes nomes pra esse evento dependendo da versão da API:
    const eventosCarrinhoAbandonado = [
      'PURCHASE_OUT_OF_SHOPPING_CART',
      'PURCHASE_ABANDONED',
      'CART_ABANDONED'
    ];
    if (!eventosCarrinhoAbandonado.includes(event)) {
      console.log(`⏭️  Evento ${event} não tratado — só processamos carrinho abandonado`);
      return;
    }

    // 3. EXTRAI DADOS DO LEAD
    const buyer = data.buyer || {};
    const phone = buyer.phone || buyer.checkout_phone;
    const fullName = buyer.name || buyer.checkout_name || 'aluno';
    const firstName = fullName.split(' ')[0];
    const email = buyer.email || buyer.checkout_email;
    const product = data.product?.name || 'curso de Inversores Solares';

    if (!phone) {
      console.error('❌ Hotmart: telefone não encontrado no payload');
      return;
    }

    console.log(`🛒 Carrinho abandonado: ${firstName} (${phone}) - ${product}`);

    // 4. CRIA OU ATUALIZA LEAD
    const lead = await getOrCreateLead(phone, firstName);
    if (email && lead && !lead.email) {
      await supabase.from('leads').update({ email }).eq('id', lead.id);
    }

    // 5. VERIFICA SE JÁ EXISTE CONVERSA DE RECUPERAÇÃO ABERTA PRA ESSE LEAD
    // (evita disparar 2 mensagens se Hotmart mandar webhook duplicado)
    const { data: conversasExistentes } = await supabase
      .from('conversas')
      .select('id, created_at')
      .eq('lead_id', lead.id)
      .eq('status', 'aberta')
      .eq('tipo', 'recuperacao_carrinho')
      .limit(1);

    if (conversasExistentes && conversasExistentes.length > 0) {
      console.log(`⏭️  Já existe conversa de recuperação aberta pro lead ${firstName} — ignorando`);
      return;
    }

    // 6. CRIA NOVA CONVERSA DE RECUPERAÇÃO
    const delayMinutos = parseInt(process.env.RECUPERACAO_DELAY_MINUTOS || process.env.HOTMART_DELAY_MINUTOS) || 15;
    const enviarEm = new Date(Date.now() + delayMinutos * 60 * 1000);

    const agenteId = process.env.HOTMART_RECUPERACAO_AGENTE_ID || null;

    const { data: novaConversa, error: errConv } = await supabase
      .from('conversas')
      .insert({
        lead_id: lead.id,
        channel: 'whatsapp',
        status: 'aberta',
        arquivada: false,
        tipo: 'recuperacao_carrinho',
        agente_id_override: agenteId,
        ia_active: true,
        followup_at: enviarEm.toISOString(),
        followup_etapa: 'recuperacao_inicial',
        meta: {
          plataforma: 'hotmart',
          hotmart_event: event,
          produto: product,
          email: email,
          nome_completo: fullName,
          recebido_em: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (errConv) {
      console.error('❌ Erro criando conversa recuperação:', errConv.message);
      return;
    }

    console.log(`✅ Conversa recuperação criada (id ${novaConversa.id}). Mensagem agendada pra ${enviarEm.toLocaleString('pt-BR')}`);

  } catch (err) {
    console.error('❌ Erro Hotmart webhook:', err.message);
    console.error(err.stack);
  }
});

// Endpoint legado mantido por compatibilidade
app.post('/api/hotmart-webhook', (req, res) => {
  req.url = '/hotmart';
  app.handle(req, res);
});

// ════════════════════════════════════════════════════════════════
// GREENN
// ════════════════════════════════════════════════════════════════
// GREENN WEBHOOK - RECUPERAÇÃO DE CARRINHO ABANDONADO
// ════════════════════════════════════════════════════════════════
//
// Configuração na Greenn:
//   Produto > Conteúdos > Adicionar > Sistema Externo > Webhook
//   Evento: Checkout abandonado
//   URL: https://clara-instructiva-production.up.railway.app/greenn?token=XXX
//   (XXX = valor de GREENN_WEBHOOK_TOKEN)
//
// Variáveis Railway:
//   GREENN_WEBHOOK_TOKEN: token secreto pra autenticar (gerar string aleatória)
//   RECUPERACAO_AGENTE_ID (ou HOTMART_RECUPERACAO_AGENTE_ID): UUID do agente Clara
//   RECUPERACAO_DELAY_MINUTOS (ou HOTMART_DELAY_MINUTOS): default 15
//   HOTMART_FOLLOWUP_HORAS: horas pra follow-up (default: 24)
//
// Payload Greenn (event = "checkoutAbandoned"):
//   { type:"lead", event:"checkoutAbandoned",
//     lead:{ name, cellphone, email, step }, product:{ id, name, amount } }
//
// Step do checkout (lead.step):
//   1 = parou nos dados pessoais (lead frio)
//   2 = parou no endereço (médio)
//   3 = parou no pagamento (mais quente — quase comprou)
// ════════════════════════════════════════════════════════════════

app.post('/greenn', async (req, res) => {
  // Responde 200 imediatamente pra Greenn não dar timeout
  res.sendStatus(200);

  try {
    const body = req.body || {};
    const event = body.event;
    const type = body.type;

    console.log(`📩 Greenn webhook recebido: type=${type}, event=${event}`);

    // 1. VALIDA TOKEN (segurança)
    // Greenn não tem signature documentada — usamos token na query string
    const tokenRecebido = req.query.token || req.headers['x-greenn-token'];
    const tokenEsperado = process.env.GREENN_WEBHOOK_TOKEN;

    if (tokenEsperado && tokenRecebido !== tokenEsperado) {
      console.error('❌ Greenn: token inválido ou ausente');
      return;
    }

    // 2. SÓ PROCESSA CHECKOUT ABANDONADO
    if (event !== 'checkoutAbandoned' || type !== 'lead') {
      console.log(`⏭️  Evento ${type}/${event} não tratado — só processamos checkoutAbandoned`);
      return;
    }

    // 3. EXTRAI DADOS DO LEAD
    const leadData = body.lead || {};
    const phone = leadData.cellphone;
    const fullName = leadData.name || 'aluno';
    const firstName = fullName.split(' ')[0];
    const email = leadData.email;
    const step = leadData.step || null;
    const product = body.product?.name || 'curso de Inversores Solares';
    const productId = body.product?.id || null;
    const productAmount = body.product?.amount || null;

    if (!phone) {
      console.error('❌ Greenn: telefone (lead.cellphone) não encontrado no payload');
      return;
    }

    console.log(`🛒 Carrinho abandonado Greenn: ${firstName} (${phone}) - ${product} [step=${step}]`);

    // 4. CRIA OU ATUALIZA LEAD
    const lead = await getOrCreateLead(phone, firstName);
    if (email && lead && !lead.email) {
      await supabase.from('leads').update({ email }).eq('id', lead.id);
    }

    // 5. ANTI-DUPLICAÇÃO: já existe conversa de recuperação aberta pra esse lead?
    const { data: conversasExistentes } = await supabase
      .from('conversas')
      .select('id, created_at')
      .eq('lead_id', lead.id)
      .eq('status', 'aberta')
      .eq('tipo', 'recuperacao_carrinho')
      .limit(1);

    if (conversasExistentes && conversasExistentes.length > 0) {
      console.log(`⏭️  Já existe conversa de recuperação aberta pro lead ${firstName} — ignorando`);
      return;
    }

    // 6. CRIA NOVA CONVERSA DE RECUPERAÇÃO
    const delayMinutos = parseInt(process.env.RECUPERACAO_DELAY_MINUTOS || process.env.HOTMART_DELAY_MINUTOS) || 15;
    const enviarEm = new Date(Date.now() + delayMinutos * 60 * 1000);

    const agenteId = process.env.RECUPERACAO_AGENTE_ID
      || process.env.HOTMART_RECUPERACAO_AGENTE_ID
      || null;

    const { data: novaConversa, error: errConv } = await supabase
      .from('conversas')
      .insert({
        lead_id: lead.id,
        channel: 'whatsapp',
        status: 'aberta',
        arquivada: false,
        tipo: 'recuperacao_carrinho',
        agente_id_override: agenteId,
        ia_active: true,
        followup_at: enviarEm.toISOString(),
        followup_etapa: 'recuperacao_inicial',
        meta: {
          plataforma: 'greenn',
          greenn_event: event,
          step: step,
          produto: product,
          produto_id: productId,
          produto_valor: productAmount,
          email: email,
          nome_completo: fullName,
          recebido_em: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (errConv) {
      console.error('❌ Erro criando conversa recuperação Greenn:', errConv.message);
      return;
    }

    console.log(`✅ Conversa recuperação Greenn criada (id ${novaConversa.id}). Mensagem agendada pra ${enviarEm.toLocaleString('pt-BR')}`);

  } catch (err) {
    console.error('❌ Erro Greenn webhook:', err.message);
    console.error(err.stack);
  }
});

// ════════════════════════════════════════════════════════════════
// API DE WHATSAPP NUMBERS (multi-número)
// ════════════════════════════════════════════════════════════════
// Lista números cadastrados (NÃO retorna access_token na resposta — segurança)
app.get('/api/whatsapp-numbers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .select('id, nome, display_phone, phone_number_id, whatsapp_business_id, qualidade, tier, ativo, notas, created_at, updated_at, empresa_id')
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Cria novo número
// Função auxiliar: garante que a WABA existe no banco. 
// Se já existe, retorna o id. Se não, cria.
async function ensureWabaExists(whatsapp_business_id, access_token, empresa_id, apelidoSugerido) {
  if (!whatsapp_business_id) return null;
  try {
    // Procura WABA existente
    const { data: existente } = await supabase
      .from('wabas')
      .select('id')
      .eq('waba_id', whatsapp_business_id)
      .maybeSingle();
    if (existente?.id) return existente.id;

    // Não existe — cria uma nova
    const apelido = apelidoSugerido || `WABA ${String(whatsapp_business_id).slice(0, 8)}...`;
    const { data: nova, error } = await supabase
      .from('wabas')
      .insert({
        waba_id: whatsapp_business_id,
        apelido,
        access_token: access_token || '',
        empresa_id: empresa_id || null,
        status: 'active'
      })
      .select('id')
      .single();
    if (error) {
      console.error('ensureWabaExists erro ao criar WABA:', error.message);
      return null;
    }
    console.log(`✓ WABA criada automaticamente: ${apelido} (${whatsapp_business_id})`);

    // Auto-subscribe: registra o app aos eventos dessa WABA pra mensagens chegarem
    if (access_token) {
      try {
        const url = `https://graph.facebook.com/v22.0/${whatsapp_business_id}/subscribed_apps`;
        await axios.post(url, {}, { headers: { Authorization: `Bearer ${access_token}` } });
        console.log(`✓ App auto-subscribed à WABA ${whatsapp_business_id}`);
      } catch (subErr) {
        const msg = subErr.response?.data?.error?.message || subErr.message;
        console.error(`⚠ Auto-subscribe falhou pra WABA ${whatsapp_business_id}: ${msg}`);
        // Não bloqueia o cadastro — apenas avisa que o subscribe precisa ser feito depois
      }
    }
    return nova.id;
  } catch (e) {
    console.error('ensureWabaExists erro:', e.message);
    return null;
  }
}

// Função auxiliar: sincroniza a foto de perfil de um número WhatsApp Business da Meta.
// Pega a URL da foto via API da Meta e salva no banco (campo avatar_url).
async function syncFotoPerfil(whatsappNumberUuid) {
  try {
    const { data: numero } = await supabase
      .from('whatsapp_numbers')
      .select('id, phone_number_id, access_token, nome')
      .eq('id', whatsappNumberUuid)
      .maybeSingle();
    if (!numero?.phone_number_id || !numero?.access_token) {
      console.log(`⚠ syncFotoPerfil: número ${whatsappNumberUuid} sem phone_number_id ou token`);
      return null;
    }
    const url = `https://graph.facebook.com/v22.0/${numero.phone_number_id}/whatsapp_business_profile?fields=profile_picture_url`;
    const r = await axios.get(url, { headers: { Authorization: `Bearer ${numero.access_token}` } });
    const fotoUrl = r.data?.data?.[0]?.profile_picture_url || null;
    if (!fotoUrl) {
      console.log(`⚠ syncFotoPerfil: WhatsApp não tem foto de perfil pra ${numero.nome}`);
      return null;
    }
    await supabase
      .from('whatsapp_numbers')
      .update({ avatar_url: fotoUrl, avatar_synced_at: new Date() })
      .eq('id', whatsappNumberUuid);
    console.log(`✓ Foto de perfil sincronizada pra ${numero.nome}`);
    return fotoUrl;
  } catch (e) {
    const msg = e.response?.data?.error?.message || e.message;
    console.error(`⚠ syncFotoPerfil falhou pra ${whatsappNumberUuid}: ${msg}`);
    return null;
  }
}

app.post('/api/whatsapp-numbers', async (req, res) => {
  try {
    const { nome, display_phone, phone_number_id, access_token, whatsapp_business_id, qualidade, tier, notas, empresa_id } = req.body;
    if (!nome || !phone_number_id || !access_token) {
      return res.status(400).json({ ok: false, error: 'Campos obrigatórios: nome, phone_number_id, access_token' });
    }

    // Garante que a WABA existe (cria se não existir) e pega o id pra vincular
    const waba_id_fk = await ensureWabaExists(whatsapp_business_id, access_token, empresa_id, nome);

    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .insert({ nome, display_phone, phone_number_id, access_token, whatsapp_business_id, waba_id_fk, qualidade, tier, notas, empresa_id, ativo: true })
      .select('id, nome, display_phone, phone_number_id, whatsapp_business_id, waba_id_fk, qualidade, tier, ativo, notas')
      .single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    invalidarCacheWpp();
    // Sync foto de perfil em background (não bloqueia a resposta)
    if (data?.id) syncFotoPerfil(data.id).catch(e => console.error('sync foto bg:', e.message));
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Atualiza número (incluindo trocar token)
app.patch('/api/whatsapp-numbers/:id', async (req, res) => {
  try {
    const allowed = ['nome', 'display_phone', 'phone_number_id', 'access_token', 'whatsapp_business_id', 'qualidade', 'tier', 'ativo', 'notas'];
    const updateData = {};
    for (const k of allowed) if (req.body[k] !== undefined) updateData[k] = req.body[k];
    if (!Object.keys(updateData).length) return res.status(400).json({ ok: false, error: 'Nada pra atualizar' });

    // Se mudou o whatsapp_business_id, atualiza tb o vínculo waba_id_fk
    if (updateData.whatsapp_business_id !== undefined) {
      const { data: numAtual } = await supabase
        .from('whatsapp_numbers')
        .select('access_token, nome, empresa_id')
        .eq('id', req.params.id)
        .maybeSingle();
      const tokenPraWaba = updateData.access_token || numAtual?.access_token || '';
      const nomePraWaba = updateData.nome || numAtual?.nome;
      const empresaPraWaba = numAtual?.empresa_id;
      updateData.waba_id_fk = await ensureWabaExists(updateData.whatsapp_business_id, tokenPraWaba, empresaPraWaba, nomePraWaba);
    }

    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .update(updateData)
      .eq('id', req.params.id)
      .select('id, nome, display_phone, phone_number_id, whatsapp_business_id, waba_id_fk, qualidade, tier, ativo, notas')
      .single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    invalidarCacheWpp();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Soft delete (desativa)
app.delete('/api/whatsapp-numbers/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('whatsapp_numbers')
      .update({ ativo: false })
      .eq('id', req.params.id);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    invalidarCacheWpp();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Testa credenciais de um número (chama endpoint do WhatsApp Graph API)
app.post('/api/whatsapp-numbers/:id/test', async (req, res) => {
  try {
    const { data: num, error } = await supabase
      .from('whatsapp_numbers')
      .select('phone_number_id, access_token, nome')
      .eq('id', req.params.id)
      .single();
    if (error || !num) return res.status(404).json({ ok: false, error: 'Número não encontrado' });

    const url = `https://graph.facebook.com/v22.0/${num.phone_number_id}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier`;
    const r = await axios.get(url, { headers: { Authorization: `Bearer ${num.access_token}` } });
    res.json({ ok: true, data: r.data });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    res.status(400).json({ ok: false, error: msg });
  }
});

// Upload de foto de perfil pra um número WhatsApp Business específico.
// Aceita imagem multipart, envia pra Meta API e atualiza avatar_url no banco.
app.post('/api/whatsapp-numbers/:id/profile-picture', uploadProfilePic.single('image'), async (req, res) => {
  try {
    if (!META_APP_ID) return res.status(500).json({ ok: false, error: 'META_APP_ID não configurado no Railway' });
    if (!req.file) return res.status(400).json({ ok: false, error: 'Nenhuma imagem enviada' });

    const { data: numero } = await supabase
      .from('whatsapp_numbers')
      .select('id, phone_number_id, access_token, nome')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!numero) return res.status(404).json({ ok: false, error: 'Número não encontrado' });
    if (!numero.phone_number_id || !numero.access_token) {
      return res.status(400).json({ ok: false, error: 'Número sem credenciais (phone_number_id ou token)' });
    }

    const fileSize = req.file.size;
    const fileType = req.file.mimetype;
    const fileBuffer = req.file.buffer;
    console.log(`📷 Upload foto pra ${numero.nome}: ${(fileSize / 1024).toFixed(1)}KB`);

    // 1. Cria sessão de upload no app
    const sessionUrl = `https://graph.facebook.com/v22.0/${META_APP_ID}/uploads?file_length=${fileSize}&file_type=${encodeURIComponent(fileType)}&access_token=${numero.access_token}`;
    const sessionRes = await axios.post(sessionUrl);
    const uploadSessionId = sessionRes.data.id;
    if (!uploadSessionId) throw new Error('Falha ao criar sessão de upload');

    // 2. Faz upload do binário
    const uploadRes = await axios.post(
      `https://graph.facebook.com/v22.0/${uploadSessionId}`,
      fileBuffer,
      {
        headers: { 'Authorization': `OAuth ${numero.access_token}`, 'file_offset': 0, 'Content-Type': fileType },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    const fileHandle = uploadRes.data.h;
    if (!fileHandle) throw new Error('Falha ao receber handle do arquivo');

    // 3. Aplica como foto de perfil do número
    await axios.post(
      `https://graph.facebook.com/v22.0/${numero.phone_number_id}/whatsapp_business_profile`,
      { messaging_product: 'whatsapp', profile_picture_handle: fileHandle },
      { headers: { Authorization: `Bearer ${numero.access_token}`, 'Content-Type': 'application/json' } }
    );

    console.log(`✅ Foto de perfil atualizada pro número ${numero.nome}`);

    // 4. Resync foto no banco (espera 2s pra Meta processar)
    setTimeout(() => syncFotoPerfil(numero.id).catch(() => {}), 2000);

    res.json({ ok: true, message: `Foto atualizada pra ${numero.nome}` });
  } catch (err) {
    console.error('Erro upload foto:', err.response?.data || err.message);
    const msg = err.response?.data?.error?.message || err.message;
    res.status(500).json({ ok: false, error: msg });
  }
});

// Força resync da foto de perfil de um número específico (puxa da Meta de novo)
app.post('/api/whatsapp-numbers/:id/sync-foto', async (req, res) => {
  try {
    const fotoUrl = await syncFotoPerfil(req.params.id);
    if (!fotoUrl) {
      return res.status(404).json({ ok: false, error: 'Não foi possível obter a foto (verifique se o número tem foto cadastrada no WhatsApp Business e se as credenciais estão corretas)' });
    }
    res.json({ ok: true, avatar_url: fotoUrl });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Resync de todas as fotos de uma vez (útil pra atualizar tudo)
app.post('/api/whatsapp-numbers/sync-todas-fotos', async (req, res) => {
  try {
    const { data: numeros } = await supabase
      .from('whatsapp_numbers')
      .select('id, nome')
      .eq('ativo', true);
    const resultados = [];
    for (const n of (numeros || [])) {
      const url = await syncFotoPerfil(n.id);
      resultados.push({ nome: n.nome, ok: !!url, avatar_url: url });
    }
    res.json({ ok: true, total: resultados.length, resultados });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// API DE WABAs (WhatsApp Business Accounts)
// Lista as WABAs cadastradas com seus números agrupados.
// Usado pela tela de Canais do CRM.
// ════════════════════════════════════════════════════════════════

// Subscribe app aos eventos de uma WABA específica.
// Use uma vez por WABA recém-cadastrada — registra o app como ouvinte
// dos webhooks dela. Sem isso, mensagens recebidas naquela WABA não
// chegam ao Forge Sales.
// Uso: GET /api/wabas/subscribe-app?waba_id=26924247627200296
app.get('/api/wabas/subscribe-app', async (req, res) => {
  try {
    const wabaIdMeta = req.query.waba_id;
    if (!wabaIdMeta) {
      return res.status(400).json({ ok: false, error: 'Parâmetro ?waba_id=xxx é obrigatório' });
    }
    const { data: waba, error: errWaba } = await supabase
      .from('wabas')
      .select('id, waba_id, access_token, apelido')
      .eq('waba_id', wabaIdMeta)
      .maybeSingle();
    if (errWaba) return res.status(500).json({ ok: false, error: errWaba.message });
    if (!waba) return res.status(404).json({ ok: false, error: `WABA ${wabaIdMeta} não encontrada no banco. Cadastre primeiro.` });
    if (!waba.access_token) return res.status(400).json({ ok: false, error: 'WABA sem access_token cadastrado' });

    const url = `https://graph.facebook.com/v22.0/${waba.waba_id}/subscribed_apps`;
    const r = await axios.post(url, {}, { headers: { Authorization: `Bearer ${waba.access_token}` } });
    res.json({ ok: true, message: `✓ App registrado à WABA "${waba.apelido}" (${waba.waba_id}). Agora as mensagens devem chegar.`, data: r.data });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    res.status(500).json({ ok: false, error: msg });
  }
});

app.get('/api/wabas', async (req, res) => {
  try {
    // 1. Busca todas as WABAs ativas
    const { data: wabas, error: errWabas } = await supabase
      .from('wabas')
      .select('id, waba_id, business_id, apelido, status, ultima_sincronizacao, ultimo_erro, created_at, empresa_id')
      .eq('status', 'active')
      .order('created_at', { ascending: true });
    if (errWabas) return res.status(500).json({ ok: false, error: errWabas.message });

    // 2. Busca todos os números ativos vinculados a essas WABAs
    const { data: numeros, error: errNum } = await supabase
      .from('whatsapp_numbers')
      .select('id, waba_id_fk, nome, display_phone, phone_number_id, verified_name, avatar_url, avatar_synced_at, qualidade, tier, code_verification_status, daily_limit, ativo, notas, empresa_id')
      .eq('ativo', true)
      .order('created_at', { ascending: true });
    if (errNum) return res.status(500).json({ ok: false, error: errNum.message });

    // 3. Agrupa números por WABA
    const result = (wabas || []).map(w => ({
      id: w.id,
      waba_id: w.waba_id,
      business_id: w.business_id,
      apelido: w.apelido,
      status: w.status,
      ultima_sincronizacao: w.ultima_sincronizacao,
      ultimo_erro: w.ultimo_erro,
      empresa_id: w.empresa_id,
      created_at: w.created_at,
      numeros: (numeros || []).filter(n => n.waba_id_fk === w.id)
    }));

    // 4. Inclui números órfãos (sem WABA ligada) num grupo separado, pra visibilidade
    const orfaos = (numeros || []).filter(n => !n.waba_id_fk);
    res.json({ ok: true, data: result, orfaos });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// API DE TEMPLATES META
// ════════════════════════════════════════════════════════════════
app.get('/api/templates', async (req, res) => {
  try {
    // Multi-WABA: se whatsapp_number_id passado, usa WABA daquele número específico
    let wabaId = WABA_ID;
    let token = WHATSAPP_TOKEN;
    const numberId = req.query.whatsapp_number_id;
    if (numberId) {
      const creds = await getCredsById(numberId);
      if (creds?.whatsapp_business_id && creds?.access_token) {
        wabaId = creds.whatsapp_business_id;
        token = creds.access_token;
      }
    }
    if (!wabaId) return res.status(500).json({ ok: false, error: 'WABA_ID não configurado pra esse número (edite o número em Canais e adicione o WABA ID)' });
    const url = `https://graph.facebook.com/v22.0/${wabaId}/message_templates?limit=100&fields=name,status,category,language,components,quality_score`;
    const r = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    res.json({ ok: true, data: r.data.data || [] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.response?.data?.error?.message || err.message });
  }
});

app.post('/api/templates', async (req, res) => {
  try {
    if (!WABA_ID) return res.status(500).json({ ok: false, error: 'WABA_ID não configurado' });
    const { name, category, language, body, footer, header } = req.body;
    if (!name || !category || !language || !body) return res.status(400).json({ ok: false, error: 'Campos obrigatórios: name, category, language, body' });

    const components = [];
    if (header && header.trim()) components.push({ type: 'HEADER', format: 'TEXT', text: header.trim() });
    components.push({ type: 'BODY', text: body.trim() });
    if (footer && footer.trim()) components.push({ type: 'FOOTER', text: footer.trim() });

    const url = `https://graph.facebook.com/v22.0/${WABA_ID}/message_templates`;
    const r = await axios.post(url, {
      name: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      category: category.toUpperCase(),
      language,
      components
    }, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
    res.json({ ok: true, data: r.data });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.response?.data?.error?.message || err.message,
      details: err.response?.data?.error?.error_user_msg || null
    });
  }
});

app.delete('/api/templates/:name', async (req, res) => {
  try {
    if (!WABA_ID) return res.status(500).json({ ok: false, error: 'WABA_ID não configurado' });
    const url = `https://graph.facebook.com/v22.0/${WABA_ID}/message_templates?name=${encodeURIComponent(req.params.name)}`;
    const r = await axios.delete(url, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
    res.json({ ok: true, data: r.data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.response?.data?.error?.message || err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// API BUSINESS / WABA INFO
// ════════════════════════════════════════════════════════════════
app.get('/api/waba-info', async (req, res) => {
  try {
    if (!WABA_ID) return res.status(500).json({ ok: false, error: 'WABA_ID não configurado' });
    const url = `https://graph.facebook.com/v22.0/${WABA_ID}?fields=id,name,currency,timezone_id,message_template_namespace,owner_business_info`;
    const r = await axios.get(url, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
    res.json({ ok: true, data: r.data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.response?.data?.error?.message || err.message });
  }
});

app.get('/api/phone-numbers', async (req, res) => {
  try {
    if (!WABA_ID) return res.status(500).json({ ok: false, error: 'WABA_ID não configurado' });
    const url = `https://graph.facebook.com/v22.0/${WABA_ID}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,messaging_limit_tier,name_status`;
    const r = await axios.get(url, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
    res.json({ ok: true, data: r.data.data || [] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.response?.data?.error?.message || err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// FOTO DE PERFIL DO WHATSAPP BUSINESS
// ════════════════════════════════════════════════════════════════
app.get('/api/whatsapp/profile', async (req, res) => {
  try {
    if (!PHONE_NUMBER_ID) return res.status(500).json({ ok: false, error: 'PHONE_NUMBER_ID não configurado' });
    const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`;
    const r = await axios.get(url, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
    res.json({ ok: true, data: r.data?.data?.[0] || {} });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.response?.data?.error?.message || err.message });
  }
});

app.post('/api/whatsapp/profile-picture', uploadProfilePic.single('image'), async (req, res) => {
  try {
    if (!PHONE_NUMBER_ID) return res.status(500).json({ ok: false, error: 'PHONE_NUMBER_ID não configurado' });
    if (!META_APP_ID) return res.status(500).json({ ok: false, error: 'META_APP_ID não configurado no Railway' });
    if (!req.file) return res.status(400).json({ ok: false, error: 'Nenhuma imagem enviada' });

    const fileSize = req.file.size;
    const fileType = req.file.mimetype;
    const fileBuffer = req.file.buffer;

    console.log(`📷 Upload foto: ${(fileSize / 1024).toFixed(1)}KB, tipo ${fileType}`);

    const sessionUrl = `https://graph.facebook.com/v22.0/${META_APP_ID}/uploads?file_length=${fileSize}&file_type=${encodeURIComponent(fileType)}&access_token=${WHATSAPP_TOKEN}`;
    const sessionRes = await axios.post(sessionUrl);
    const uploadSessionId = sessionRes.data.id;

    if (!uploadSessionId) throw new Error('Falha ao criar sessão de upload');
    console.log(`✓ Sessão criada: ${uploadSessionId}`);

    const uploadRes = await axios.post(
      `https://graph.facebook.com/v22.0/${uploadSessionId}`,
      fileBuffer,
      {
        headers: {
          'Authorization': `OAuth ${WHATSAPP_TOKEN}`,
          'file_offset': 0,
          'Content-Type': fileType
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const fileHandle = uploadRes.data.h;
    if (!fileHandle) throw new Error('Falha ao receber handle do arquivo');

    const profileUrl = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/whatsapp_business_profile`;
    await axios.post(
      profileUrl,
      {
        messaging_product: 'whatsapp',
        profile_picture_handle: fileHandle
      },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } }
    );

    console.log(`✅ Foto de perfil atualizada com sucesso!`);
    res.json({ ok: true, message: 'Foto atualizada' });
  } catch (err) {
    console.error('Erro ao atualizar foto:', err.response?.data || err.message);
    const msg = err.response?.data?.error?.message || err.message;
    res.status(500).json({ ok: false, error: msg });
  }
});

// ════════════════════════════════════════════════════════════════
// FUNÇÃO INTERNA: dispara campanha
// ════════════════════════════════════════════════════════════════
async function dispararCampanhaInterno(campanhaId) {
  try {
    const { data: campanha } = await supabase.from('campanhas').select('*').eq('id', campanhaId).single();
    if (!campanha) return console.error('Campanha não encontrada');

    await supabase.from('campanhas').update({ status: 'disparando', iniciada_em: new Date() }).eq('id', campanhaId);

    // === MULTI-NUMBER: resolve qual número usar pra disparar ===
    const credsCampanha = campanha.whatsapp_number_id
      ? (await getCredsById(campanha.whatsapp_number_id)) || getCredsFromEnv()
      : getCredsFromEnv();
    if (!credsCampanha) {
      console.error(`Campanha ${campanhaId}: sem credenciais WhatsApp pra disparar`);
      await supabase.from('campanhas').update({ status: 'erro' }).eq('id', campanhaId);
      return;
    }
    console.log(`Campanha ${campanha.nome} disparará via número ${credsCampanha.nome || credsCampanha.phone_number_id}`);

    const varCount = await getTemplateVariableCount(campanha.template_name, credsCampanha);
    console.log(`Template ${campanha.template_name} tem ${varCount} variável(eis)`);

    const { data: envios } = await supabase
      .from('campanha_envios')
      .select('*')
      .eq('campanha_id', campanhaId)
      .eq('status', 'pendente');

    console.log(`Disparando campanha ${campanha.nome} para ${envios?.length || 0} leads`);

    let sucessos = 0, erros = 0;

    for (const envio of (envios || [])) {
      try {
        const lead = await getOrCreateLead(envio.phone, envio.nome);

        const conversa = await getOrCreateConversa(lead.id, credsCampanha?.id || null);
        const podeSobrescrever = await deveSobrescreverCampanha(conversa.id);
        if (!conversa.campanha_id || podeSobrescrever) {
          await supabase
            .from('conversas')
            .update({ campanha_id: campanhaId })
            .eq('id', conversa.id);
        }

        // === MULTI-NUMBER: associa essa conversa ao número da campanha ===
        if (credsCampanha.id && conversa.whatsapp_number_id !== credsCampanha.id) {
          await supabase.from('conversas')
            .update({ whatsapp_number_id: credsCampanha.id })
            .eq('id', conversa.id);
        }

        let varsToSend = [];
        if (varCount > 0) {
          const allVars = envio.variaveis || [];
          varsToSend = allVars.slice(0, varCount);
          while (varsToSend.length < varCount) {
            varsToSend.push(envio.nome || 'amigo');
          }
        }

        const r = await sendWhatsAppTemplate(
          envio.phone,
          campanha.template_name,
          campanha.template_language,
          varsToSend,
          credsCampanha
        );

        if (r.ok) {
          await supabase.from('campanha_envios').update({
            status: 'enviado',
            whatsapp_message_id: r.message_id,
            enviado_em: new Date(),
            lead_id: lead.id
          }).eq('id', envio.id);
          sucessos++;
        } else {
          await supabase.from('campanha_envios').update({
            status: 'erro',
            erro_mensagem: r.error
          }).eq('id', envio.id);
          erros++;
        }

        await new Promise(r => setTimeout(r, 1500));

      } catch (e) {
        console.error('Erro envio individual:', e.message);
        await supabase.from('campanha_envios').update({
          status: 'erro',
          erro_mensagem: e.message
        }).eq('id', envio.id);
        erros++;
      }
    }

    await supabase.from('campanhas').update({
      status: 'concluida',
      concluida_em: new Date(),
      enviados: sucessos
    }).eq('id', campanhaId);

    console.log(`Campanha ${campanha.nome} concluída: ${sucessos} enviados, ${erros} erros`);
  } catch (err) {
    console.error('Erro disparo campanha:', err.message);
    await supabase.from('campanhas').update({ status: 'erro' }).eq('id', campanhaId);
  }
}

// ════════════════════════════════════════════════════════════════
// API DE DISPARO DE CAMPANHA (manual)
// ════════════════════════════════════════════════════════════════
app.post('/api/campanhas/:id/disparar', async (req, res) => {
  const campanhaId = req.params.id;
  res.json({ ok: true, message: 'Disparo iniciado em segundo plano' });
  setImmediate(() => dispararCampanhaInterno(campanhaId));
});

// ════════════════════════════════════════════════════════════════
// CRON: dispara campanhas agendadas
// ════════════════════════════════════════════════════════════════
async function processarCampanhasAgendadas() {
  try {
    const agora = new Date().toISOString();
    const { data: campanhas } = await supabase
      .from('campanhas')
      .select('id, nome, agendada_para')
      .not('agendada_para', 'is', null)
      .eq('status', 'rascunho')
      .lte('agendada_para', agora);

    if (!campanhas || !campanhas.length) return;

    for (const c of campanhas) {
      console.log(`⏰ Disparando campanha agendada: ${c.nome} (agendada para ${c.agendada_para})`);
      await supabase.from('campanhas').update({ agendada_para: null }).eq('id', c.id);
      setImmediate(() => dispararCampanhaInterno(c.id));
    }
  } catch (err) {
    console.error('Erro processarCampanhasAgendadas:', err.message);
  }
}

// ════════════════════════════════════════════════════════════════
// API CONTROLE MANUAL DA CONVERSA
// ════════════════════════════════════════════════════════════════
app.post('/api/conversas/:id/pausar', async (req, res) => {
  try {
    const { error } = await supabase
      .from('conversas')
      .update({ ia_active: false, updated_at: new Date() })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true, ia_active: false });
  } catch (err) {
    console.error('Erro pausar conversa:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/conversas/:id/retomar', async (req, res) => {
  try {
    const { error } = await supabase
      .from('conversas')
      .update({ ia_active: true, updated_at: new Date() })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true, ia_active: true });
  } catch (err) {
    console.error('Erro retomar conversa:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/conversas/:id/enviar', async (req, res) => {
  try {
    const { mensagem } = req.body;
    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ ok: false, error: 'Mensagem vazia' });
    }

    const { data: conversa, error: errConv } = await supabase
      .from('conversas')
      .select('*, leads(phone)')
      .eq('id', req.params.id)
      .single();

    if (errConv || !conversa) {
      return res.status(404).json({ ok: false, error: 'Conversa não encontrada' });
    }

    const phone = conversa.leads?.phone;
    if (!phone) {
      return res.status(400).json({ ok: false, error: 'Lead sem telefone' });
    }

    const credsManual = await resolveCredsForConversa(conversa.id);
    await sendWhatsAppMessage(phone, mensagem, credsManual);
    await salvarMensagem(conversa.id, conversa.lead_id, 'assistant', mensagem);

    res.json({ ok: true });
  } catch (err) {
    console.error('Erro envio manual:', err.message);
    const metaError = err.response?.data?.error?.message;
    res.status(500).json({
      ok: false,
      error: metaError || err.message,
      hint: metaError ? 'Pode ser janela de 24h da Meta expirada' : null
    });
  }
});

app.post('/api/conversas/:id/marcar-lida', async (req, res) => {
  try {
    const { error } = await supabase
      .from('conversas')
      .update({ last_read_at: new Date() })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro marcar lida:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// ENVIO DE MÍDIA (áudio, imagem, documento)
// Frontend envia o arquivo via multipart/form-data
// Aqui: 1) faz upload pra Meta → pega media_id
//       2) envia mensagem WhatsApp com esse media_id
//       3) salva no banco
// ════════════════════════════════════════════════════════════════
const uploadMidia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 } // 16MB (limite da Meta pra áudio é 16MB, imagem 5MB, doc 100MB)
});

async function uploadMediaParaMeta(buffer, mimeType, filename) {
  // Endpoint: POST /PHONE_NUMBER_ID/media com multipart
  const FormData = require('form-data');
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', mimeType);
  form.append('file', buffer, { filename, contentType: mimeType });

  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/media`;
  const r = await axios.post(url, form, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      ...form.getHeaders()
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
  return r.data?.id;
}

async function enviarMediaWhatsApp(to, mediaType, mediaId, caption) {
  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

  // Normaliza número BR: alguns chips antigos não aceitam o "9" depois do DDD
  // Se chegou 5544976016467 (13 dígitos), também tenta 554476016467 (12 dígitos)
  let normalizedTo = String(to).replace(/\D/g, '');
  if (normalizedTo.length === 13 && normalizedTo.startsWith('55') && normalizedTo[4] === '9') {
    // Remove o 9 depois do DDD pra match com o wa_id que a Meta registra
    normalizedTo = normalizedTo.slice(0, 4) + normalizedTo.slice(5);
    console.log(`📱 Número normalizado: ${to} → ${normalizedTo}`);
  }

  const body = {
    messaging_product: 'whatsapp',
    to: normalizedTo,
    type: mediaType,
    [mediaType]: { id: mediaId }
  };

  // Áudio: marca como voice note (PTT) — faz aparecer com waveform no WhatsApp
  if (mediaType === 'audio') {
    body.audio.voice = true;
  }

  if (caption && (mediaType === 'image' || mediaType === 'video' || mediaType === 'document')) {
    body[mediaType].caption = caption;
  }
  const r = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
  });
  return r.data;
}

// ════════════════════════════════════════════════════════════════
// CONVERSÃO DE ÁUDIO PRA OGG/OPUS (formato nativo do WhatsApp PTT)
// Browser grava webm/opus por padrão; renomear o mimetype não basta
// porque o WhatsApp valida o conteúdo antes de exibir como msg de voz.
// Usa ffmpeg pra reembrulhar o stream opus em container OGG.
// ════════════════════════════════════════════════════════════════
function convertToOggOpus(inputBuffer) {
  return new Promise((resolve, reject) => {
    const args = [
      '-loglevel', 'error',
      '-i', 'pipe:0',
      '-vn',
      '-map_metadata', '-1',
      '-acodec', 'libopus',
      '-b:a', '64000',
      '-ar', '48000',
      '-ac', '1',
      '-application', 'voip',
      '-frame_duration', '60',
      '-f', 'ogg',
      'pipe:1'
    ];
    const proc = spawn(ffmpegPath, args);
    const chunks = [];
    let stderr = '';
    proc.stdout.on('data', c => chunks.push(c));
    proc.stderr.on('data', c => { stderr += c.toString(); });
    proc.on('error', reject);
    proc.on('close', code => {
      if (code !== 0) return reject(new Error('ffmpeg falhou (code ' + code + '): ' + stderr.slice(-500)));
      const out = Buffer.concat(chunks);
      if (out.length < 100) return reject(new Error('ffmpeg gerou arquivo vazio: ' + stderr.slice(-200)));
      resolve(out);
    });
    proc.stdin.write(inputBuffer);
    proc.stdin.end();
  });
}

app.post('/api/conversas/:id/enviar-midia', uploadMidia.single('arquivo'), async (req, res) => {
  try {
    const { tipo, legenda } = req.body; // tipo: 'audio'|'image'|'document'|'video'
    if (!req.file) return res.status(400).json({ ok: false, error: 'Nenhum arquivo enviado' });
    if (!['audio','image','document','video'].includes(tipo)) {
      return res.status(400).json({ ok: false, error: 'Tipo inválido (use audio, image, document ou video)' });
    }

    const { data: conversa, error: errConv } = await supabase
      .from('conversas')
      .select('*, leads(phone)')
      .eq('id', req.params.id)
      .single();

    if (errConv || !conversa) return res.status(404).json({ ok: false, error: 'Conversa não encontrada' });

    const phone = conversa.leads?.phone;
    if (!phone) return res.status(400).json({ ok: false, error: 'Lead sem telefone' });

    let buffer = req.file.buffer;
    let mimeType = req.file.mimetype;
    let filename = req.file.originalname || `${tipo}_${Date.now()}`;
    let metaTipo = tipo; // tipo enviado pra Meta (pode ser diferente do tipo lógico)

    // Áudio: envia como DOCUMENT pra Meta (envio como 'audio' não chega no destino nessa conta)
    // Mantém metadados de áudio no banco pra UI continuar mostrando player
    if (tipo === 'audio') {
      metaTipo = 'document';
      // Garante extensão de áudio reconhecível
      if (!/\.(ogg|opus|mp3|m4a|aac|amr|webm)$/i.test(filename)) {
        // Detecta pela mime
        const ext = mimeType.includes('webm') ? '.webm'
                  : mimeType.includes('ogg') ? '.ogg'
                  : mimeType.includes('mp4') || mimeType.includes('m4a') ? '.m4a'
                  : mimeType.includes('mpeg') ? '.mp3'
                  : '.ogg';
        filename = filename.replace(/\.[^.]+$/, '') + ext;
      }
      console.log(`🎤 Áudio será enviado como document: ${filename} (${mimeType})`);
    }

    console.log(`📎 Enviando ${metaTipo} (${(buffer.length/1024).toFixed(1)}KB, ${mimeType}) pra ${phone}`);

    // 1. Upload pra Meta
    const mediaId = await uploadMediaParaMeta(buffer, mimeType, filename);
    if (!mediaId) throw new Error('Meta não retornou media_id');
    console.log(`📦 Upload Meta OK, media_id: ${mediaId}`);

    // 2. Envia mensagem WhatsApp (passa metaTipo pro envio)
    const sendResult = await enviarMediaWhatsApp(phone, metaTipo, mediaId, legenda, filename);
    console.log(`✅ Meta confirmou envio: ${JSON.stringify(sendResult).slice(0, 300)}`);

    // 3. Verifica status da mensagem 5 segundos depois
    if (sendResult?.messages?.[0]?.id) {
      const wamid = sendResult.messages[0].id;
      setTimeout(async () => {
        try {
          const statusUrl = `https://graph.facebook.com/v22.0/${wamid}`;
          const statusResp = await axios.get(statusUrl, {
            headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
          });
          console.log(`📊 Status da msg ${wamid}:`, JSON.stringify(statusResp.data).slice(0, 300));
        } catch(e) {
          console.log(`⚠️ Status check falhou: ${e.response?.data?.error?.message || e.message}`);
        }
      }, 5000);
    }

    // 3. Salva no banco
    const content = legenda || `[${tipo === 'audio' ? '🎤 Áudio enviado' : tipo === 'image' ? '🖼️ Imagem enviada' : tipo === 'video' ? '🎥 Vídeo enviado' : '📎 Arquivo enviado'}]`;
    await supabase.from('mensagens').insert({
      conversa_id: conversa.id,
      lead_id: conversa.lead_id,
      role: 'assistant',
      content,
      media_type: tipo,
      media_url: mediaId,
      media_filename: filename
    });
    await supabase.from('conversas').update({ updated_at: new Date() }).eq('id', conversa.id);

    res.json({ ok: true, media_id: mediaId });
  } catch (err) {
    console.error('Erro enviar mídia:', err.response?.data || err.message);
    const metaError = err.response?.data?.error?.message;
    res.status(500).json({
      ok: false,
      error: metaError || err.message,
      hint: metaError ? 'Pode ser janela de 24h da Meta expirada ou formato não suportado' : null
    });
  }
});

app.post('/api/debug-audio', uploadMidia.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Nenhum arquivo');
    console.log(`🔬 DEBUG: convertendo ${(req.file.size/1024).toFixed(1)}KB ${req.file.mimetype}`);
    const out = await convertToOggOpus(req.file.buffer);
    console.log(`🔬 DEBUG: saiu ${(out.length/1024).toFixed(1)}KB`);
    res.set('Content-Type', 'audio/ogg');
    res.set('Content-Disposition', 'attachment; filename="debug.ogg"');
    res.send(out);
  } catch (e) {
    console.error('Erro debug-audio:', e.message);
    res.status(500).send('Erro: ' + e.message);
  }
});

// Endpoint pra forçar processamento de follow-ups (debug/manual)
app.post('/api/processar-followups', async (req, res) => {
  res.json({ ok: true, message: 'Processamento iniciado em background' });
  setImmediate(() => processarFollowups());
});

// ════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ════════════════════════════════════════════════════════════════
app.get('/', (req, res) => res.send('Clara da Escola Instructiva está online! 🤖 v3'));

const PORT = process.env.PORT || 3000;

// ════════════════════════════════════════════════════════════════
// META BUSINESS API — Sincronização de gastos
// ════════════════════════════════════════════════════════════════
async function getCotacaoUSDBRL() {
  try {
    const r = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL', { timeout: 10000 });
    const cotacao = parseFloat(r.data?.USDBRL?.bid);
    if (cotacao && cotacao > 0) return cotacao;
  } catch (e) {
    // silencia erro de rate limit
  }
  return 5.50;
}

async function sincronizarGastosMeta() {
  if (!WHATSAPP_TOKEN || !WABA_ID) return { success: false, error: 'Credenciais Meta não configuradas' };

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  const startTs = Math.floor(start.getTime() / 1000);
  const endTs = Math.floor(now.getTime() / 1000);
  const cotacao = await getCotacaoUSDBRL();

  try {
    const url = `https://graph.facebook.com/v21.0/${WABA_ID}/pricing_analytics`;
    const params = { start: startTs, end: endTs, granularity: 'DAILY', access_token: WHATSAPP_TOKEN };
    const response = await axios.get(url, { params, timeout: 30000 });
    const data = response.data?.data?.[0]?.data_points || [];

    if (!data.length) return await sincronizarConversationAnalytics(startTs, endTs, cotacao);

    let totalInserido = 0, totalAtualizado = 0;

    for (const point of data) {
      const dataDia = new Date((point.start || 0) * 1000).toISOString().slice(0, 10);
      const custoUSD = parseFloat(point.cost || 0);
      if (custoUSD <= 0) continue;
      const custoBRL = custoUSD * cotacao;
      const tipo = point.pricing_type || point.pricing_category || 'WhatsApp';
      const categoria = 'Meta WhatsApp';
      const descricao = `${tipo} - ${dataDia}`;

      const { data: existing } = await supabase
        .from('gastos')
        .select('id')
        .eq('data', dataDia)
        .eq('categoria', categoria)
        .eq('source', 'meta_api')
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase.from('gastos').update({ valor: custoBRL, descricao, canal: 'whatsapp' }).eq('id', existing[0].id);
        totalAtualizado++;
      } else {
        await supabase.from('gastos').insert({ valor: custoBRL, descricao, data: dataDia, canal: 'whatsapp', categoria, source: 'meta_api' });
        totalInserido++;
      }
    }
    return { success: true, inserted: totalInserido, updated: totalAtualizado, cotacao };
  } catch (err) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

async function sincronizarConversationAnalytics(startTs, endTs, cotacao) {
  try {
    const url = `https://graph.facebook.com/v21.0/${WABA_ID}`;
    const params = { fields: `conversation_analytics.start(${startTs}).end(${endTs}).granularity(DAILY).phone_numbers([])`, access_token: WHATSAPP_TOKEN };
    const response = await axios.get(url, { params, timeout: 30000 });
    const points = response.data?.conversation_analytics?.data?.[0]?.data_points || [];
    if (!points.length) return { success: true, inserted: 0, updated: 0 };

    let totalInserido = 0, totalAtualizado = 0;
    for (const point of points) {
      const dataDia = new Date((point.start || 0) * 1000).toISOString().slice(0, 10);
      const custoUSD = parseFloat(point.cost || 0);
      if (custoUSD <= 0) continue;
      const custoBRL = custoUSD * cotacao;
      const categoria = 'Meta WhatsApp';
      const descricao = `Conversas - ${dataDia}`;

      const { data: existing } = await supabase.from('gastos').select('id').eq('data', dataDia).eq('categoria', categoria).eq('source', 'meta_api').limit(1);

      if (existing && existing.length > 0) {
        await supabase.from('gastos').update({ valor: custoBRL, descricao, canal: 'whatsapp' }).eq('id', existing[0].id);
        totalAtualizado++;
      } else {
        await supabase.from('gastos').insert({ valor: custoBRL, descricao, data: dataDia, canal: 'whatsapp', categoria, source: 'meta_api' });
        totalInserido++;
      }
    }
    return { success: true, inserted: totalInserido, updated: totalAtualizado, cotacao };
  } catch (err) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

async function gerarGastosRecorrentes() {
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesAno = hoje.toISOString().slice(0, 7);

  const { data: recorrentes } = await supabase.from('gastos').select('*').eq('recorrente', true);
  if (!recorrentes || !recorrentes.length) return { generated: 0 };

  let geradosCount = 0;
  for (const r of recorrentes) {
    const diaRec = r.recorrencia_dia || 1;
    if (diaHoje !== diaRec) continue;
    const dataEsperada = `${mesAno}-${String(diaRec).padStart(2, '0')}`;
    const { data: existe } = await supabase.from('gastos').select('id').eq('data', dataEsperada).eq('descricao', r.descricao).eq('source', 'recorrente').limit(1);
    if (existe && existe.length > 0) continue;
    await supabase.from('gastos').insert({ valor: r.valor, descricao: r.descricao, data: dataEsperada, canal: r.canal, categoria: r.categoria || 'Outros', source: 'recorrente' });
    geradosCount++;
  }
  return { generated: geradosCount };
}

app.post('/api/sincronizar-gastos-meta', async (req, res) => {
  const result = await sincronizarGastosMeta();
  res.json(result);
});

app.post('/api/gerar-recorrentes', async (req, res) => {
  const result = await gerarGastosRecorrentes();
  res.json(result);
});

// ════════════════════════════════════════════════════════════════
// CRON: agendamento + follow-up + diário
// ════════════════════════════════════════════════════════════════
let followupContador = 0;

function iniciarCronDiario() {
  setInterval(async () => {
    try {
      const agora = new Date();
      // Cron diário 03:00 — sincroniza gastos
      if (agora.getHours() === 3 && agora.getMinutes() === 0) {
        console.log('⏰ Cron diário 03:00 disparado');
        await sincronizarGastosMeta();
        await gerarGastosRecorrentes();
      }
      // A cada minuto: verifica campanhas agendadas
      await processarCampanhasAgendadas();
      // A cada 5 minutos: verifica follow-ups pendentes
      followupContador++;
      if (followupContador >= 5) {
        followupContador = 0;
        await processarFollowups();
        await processarRecuperacaoHotmart();
      }
    } catch (e) {
      console.error('Erro cron interval:', e.message);
    }
  }, 60 * 1000);
  console.log('⏰ Cron ativo (campanhas agendadas + follow-ups + gastos diários)');
}
iniciarCronDiario();


// ════════════════════════════════════════════════════════════════
// CONVITE DE EQUIPE (envia email automaticamente)
// ════════════════════════════════════════════════════════════════
app.post('/api/equipe/convidar', async (req, res) => {
  try {
    const { nome, email, role, cargo, empresa_id } = req.body;

    if (!nome || !email || !empresa_id || !role) {
      return res.status(400).json({ ok: false, error: 'Faltam campos: nome, email, role, empresa_id' });
    }

    // 1. Convida no Supabase Auth (manda email com link de definir senha)
    const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email);

    if (inviteErr) {
      console.error('Erro inviteUserByEmail:', inviteErr);
      return res.status(400).json({ ok: false, error: inviteErr.message });
    }

    const auth_user_id = inviteData?.user?.id;
    if (!auth_user_id) {
      return res.status(500).json({ ok: false, error: 'Nao retornou auth_user_id' });
    }

    // 2. Cria registro em usuarios (sem senha - pessoa define ao clicar no email)
    const { error: usrErr } = await supabase
      .from('usuarios')
      .insert({
        nome,
        email,
        role,
        cargo: cargo || null,
        auth_user_id,
        ativo: true
      });

    if (usrErr) {
      console.error('Erro insert usuarios:', usrErr);
      return res.status(400).json({ ok: false, error: 'Erro ao criar registro de usuario: ' + usrErr.message });
    }

    // 3. Vincula em usuarios_empresa (chave do isolamento multi-tenant)
    const { error: vincErr } = await supabase
      .from('usuarios_empresa')
      .insert({ user_id: auth_user_id, empresa_id, papel: role });

    if (vincErr) {
      console.error('Erro insert usuarios_empresa:', vincErr);
      return res.status(400).json({ ok: false, error: 'Erro ao vincular a empresa: ' + vincErr.message });
    }

    console.log(`Convite enviado: ${email} -> empresa ${empresa_id}`);
    return res.json({ ok: true, message: 'Convite enviado com sucesso!', auth_user_id });
  } catch (e) {
    console.error('Erro /api/equipe/convidar:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// ════════════════════════════════════════════════════════════════
// REMOVER USUÁRIO COMPLETO (apaga das 3 tabelas)
// ════════════════════════════════════════════════════════════════
app.delete('/api/equipe/remover/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ ok: false, error: 'ID do usuario nao fornecido' });
    }

    // 1. Busca o auth_user_id na tabela usuarios
    const { data: usuario, error: getErr } = await supabase
      .from('usuarios')
      .select('auth_user_id, nome, email')
      .eq('id', userId)
      .single();

    if (getErr || !usuario) {
      return res.status(404).json({ ok: false, error: 'Usuario nao encontrado' });
    }

    const authId = usuario.auth_user_id;

    // 2. Remove vinculos com empresas (tabela usuarios_empresa) — multi-tenant
    if (authId) {
      const { error: vincErr } = await supabase
        .from('usuarios_empresa')
        .delete()
        .eq('user_id', authId);
      if (vincErr) {
        console.error('Aviso: erro remover usuarios_empresa:', vincErr);
        // Nao bloqueia — segue removendo
      }
    }

    // 3. Remove perfil da tabela usuarios
    const { error: profErr } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', userId);

    if (profErr) {
      console.error('Erro remover perfil usuarios:', profErr);
      return res.status(500).json({ ok: false, error: 'Falha ao remover perfil: ' + profErr.message });
    }

    // 4. Remove do auth.users (invalida login imediatamente)
    if (authId) {
      const { error: authErr } = await supabase.auth.admin.deleteUser(authId);
      if (authErr && !String(authErr.message || '').toLowerCase().includes('not found')) {
        console.error('Aviso: erro auth.admin.deleteUser:', authErr);
        // Perfil ja foi apagado — registra mas nao falha a request
      }
    }

    console.log(`Usuario removido: ${usuario.nome} <${usuario.email}>`);
    return res.json({ ok: true, message: 'Usuario removido com sucesso' });

  } catch (e) {
    console.error('Erro /api/equipe/remover:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// ════════════════════════════════════════════════════════════════
// PIPELINE — CLASSIFICADOR DE ESTÁGIO COM IA
// ════════════════════════════════════════════════════════════════

const PIPELINE_STAGES = [
  'sem_resposta',
  'em_conversa',
  'em_negociacao',
  'agendado',
  'aguardando_pagamento',
  'aprovado',
  'perdido'
];

const PIPELINE_PROMPT = `Você é um classificador de estágio de venda treinado a ENTENDER CONTEXTO completo de conversas em português antes de decidir.

⚠️ COMO PENSAR (siga esta ordem):
1. Leia a conversa INTEIRA do começo ao fim
2. Identifique: o lead respondeu? Clara apresentou preço? Houve compromisso de data? Houve pagamento?
3. Só depois decida — na DÚVIDA entre dois estágios, SEMPRE escolha o MAIS CONSERVADOR (anterior na sequência), nunca pule estágios.

REGRAS POR ESTÁGIO (rígidas — siga ao pé da letra):

🔘 sem_resposta
✅ Aplicar SE: o lead NÃO enviou nenhuma mensagem ainda. Só tem mensagens da Clara.
❌ NÃO aplicar SE: o lead respondeu QUALQUER coisa (mesmo "oi", emoji, ou só uma palavra).

🔘 em_conversa
✅ Aplicar SE: o lead respondeu E está fazendo perguntas gerais (sobre o curso, sobre o que faz, etc) MAS Clara AINDA NÃO mostrou preço, valor ou link concreto.
❌ NÃO aplicar SE: Clara já mencionou um valor R$ específico ou enviou link de pagamento.
📌 ARMADILHA: lead perguntar "quanto custa?" SOZINHO ainda é em_conversa. Só vira em_negociacao quando CLARA RESPONDER com o preço.

🔘 em_negociacao
✅ Aplicar SE: Clara explicitamente apresentou um VALOR R$ específico OU enviou link de pagamento, E o lead está negociando (pedindo desconto, comparando opções, levantando objeções de preço, pedindo parcelamento).
❌ NÃO aplicar SE: Clara ainda não apresentou número/valor concreto. Sem preço na mesa = em_conversa.
📌 ARMADILHA: precisa ter pelo menos um R$ valor aparecendo na conversa OU mensagem de Clara com link/condição de pagamento.

🔘 agendado
✅ Aplicar SE: o lead deu uma DATA FUTURA ESPECÍFICA pra pagar/fechar. Frases tipo "pago dia 15", "fecho na sexta", "recebo o salário e te falo terça", "semana que vem confirmo".
❌ NÃO aplicar SE: lead só disse "vou pensar", "depois te falo", "te aviso" sem data/dia/momento específico.
📌 ARMADILHA: precisa ter referência TEMPORAL EXPLÍCITA (dia da semana, data, evento futuro tipo "depois do meu pagamento").

🔘 aguardando_pagamento
✅ Aplicar SE: Clara ENVIOU link de pagamento E o lead disse que tá pagando AGORA ("fazendo o pix agora", "tô no checkout", "abri o link", "vou pagar agora").
❌ NÃO aplicar SE: lead só prometeu pagar no futuro (isso é agendado), ou Clara não mandou link ainda.
📌 ARMADILHA: tem que ser ação de pagamento ACONTECENDO NO PRESENTE, não compromisso futuro.

🔘 aprovado
✅ Aplicar SE: o lead JÁ pagou — confirmação explícita ("paguei", "comprei", "matriculei", "deu certo", "fiz o pix"), ou Clara confirmou matrícula.
❌ NÃO aplicar SE: lead só disse "vou pagar" — isso é agendado ou aguardando_pagamento.

🔘 perdido
✅ Aplicar SE: o lead recusou DEFINITIVAMENTE ("não tenho dinheiro", "desisto", "não quero mais", "não me liga", "perdi o interesse"), OU sumiu há mais de 7 dias após ter engajado anteriormente.
❌ NÃO aplicar SE: lead só ficou quieto 1-2 dias (pode tar pensando), ou só fez objeção sem desistir.
📌 ARMADILHA: silêncio curto NÃO é perdido. Precisa ter recusa explícita ou ausência prolongada.

⚠️ REGRA META: se você está dividido entre 2 estágios, escolha o ANTERIOR. Exemplo: na dúvida entre em_conversa e em_negociacao → escolhe em_conversa. Na dúvida entre agendado e aguardando_pagamento → escolhe agendado. Melhor pecar por conservador do que adiantar errado.

Conversa pra analisar:
{{CONVERSA}}

Responda APENAS um JSON válido neste formato exato, SEM texto antes, SEM texto depois, SEM blocos de código markdown (\`\`\`), SEM preâmbulo. Apenas o JSON cru:
{"stage":"slug_aqui","confidence":0.0_a_1.0,"reason":"motivo curto, máximo 8 palavras"}`;

// Classifica UMA conversa
async function classificarConversa(conversaId) {
  // 1. Busca conversa e checa se travou
  const { data: conv, error: convErr } = await supabase
    .from('conversas')
    .select('id, pipeline_travado, pipeline_stage')
    .eq('id', conversaId)
    .single();

  if (convErr || !conv) {
    return { ok: false, error: 'Conversa nao encontrada' };
  }

  if (conv.pipeline_travado) {
    return { 
      ok: true, 
      skipped: true, 
      reason: 'Estagio travado manualmente',
      stage: conv.pipeline_stage 
    };
  }

  // 2. Busca últimas 40 mensagens (mais recentes — onde tá o contexto atual)
  const { data: msgsRaw, error: msgErr } = await supabase
    .from('mensagens')
    .select('role, content, media_type, created_at')
    .eq('conversa_id', conversaId)
    .order('created_at', { ascending: false })
    .limit(40);

  if (msgErr) {
    return { ok: false, error: 'Erro ao buscar mensagens: ' + msgErr.message };
  }

  // Reverte pra ordem cronológica (mais antiga primeiro) pra prompt fazer sentido
  const msgs = (msgsRaw || []).reverse();

  if (!msgs || msgs.length === 0) {
    return { ok: false, error: 'Sem mensagens pra classificar' };
  }

  // Atalho: se só tem mensagens da Clara (assistant), é sem_resposta direto
  const hasUserMsg = msgs.some(m => m.role === 'user');
  if (!hasUserMsg) {
    await supabase
      .from('conversas')
      .update({
        pipeline_stage: 'sem_resposta',
        pipeline_atualizado_em: new Date().toISOString(),
        pipeline_motivo: 'Lead nunca respondeu',
        pipeline_confidence: 1.0
      })
      .eq('id', conversaId);
    return { ok: true, stage: 'sem_resposta', confidence: 1.0, reason: 'Lead nunca respondeu' };
  }

  // 3. Monta texto da conversa pro prompt
  const conversaTexto = msgs.map(m => {
    const quem = m.role === 'assistant' ? 'Clara' : 'Lead';
    const conteudo = m.content || (m.media_type ? `[${m.media_type}]` : '(vazio)');
    return `${quem}: ${conteudo}`;
  }).join('\n');

  const prompt = PIPELINE_PROMPT.replace('{{CONVERSA}}', conversaTexto);

  // 4. Chama Gemini
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          maxOutputTokens: 1024
        }
      })
    });

    if (!geminiRes.ok) {
      const errTxt = await geminiRes.text();
      return { ok: false, error: 'Gemini falhou: ' + errTxt.slice(0, 200) };
    }

    const geminiData = await geminiRes.json();
    // Gemini pode dividir a resposta em multiplos parts — junta tudo
    const responseText = (geminiData?.candidates?.[0]?.content?.parts || [])
      .map(p => p?.text || '')
      .join('') || '{}';

    let parsed;
    // Tenta extrair JSON com tolerância a markdown e preâmbulos do Gemini
    // Estratégia: 1) parse direto, 2) strip markdown, 3) regex pra encontrar {...},
    // 4) fallback: regex direto pelo stage (caso o reason tenha sido cortado)
    try {
      parsed = JSON.parse(responseText);
    } catch {
      let cleaned = responseText
        .replace(/^[\s\S]*?```(?:json)?\s*/i, '')
        .replace(/```[\s\S]*$/, '')
        .trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const m = responseText.match(/\{[\s\S]*\}/);
        if (m) {
          try { parsed = JSON.parse(m[0]); } catch {}
        }
      }
    }

    // Fallback final: se JSON quebrou no meio, tenta extrair só o stage via regex
    // (basta ter o stage pra classificar, reason é só metadata)
    if (!parsed || !parsed.stage) {
      const stageMatch = responseText.match(/"stage"\s*:\s*"([a-z_]+)"/i);
      if (stageMatch && PIPELINE_STAGES.includes(stageMatch[1])) {
        const confMatch = responseText.match(/"confidence"\s*:\s*([\d.]+)/);
        parsed = {
          stage: stageMatch[1],
          confidence: confMatch ? parseFloat(confMatch[1]) : 0.5,
          reason: 'classificado (resposta parcial)'
        };
        console.log('[pipeline] Recuperado de JSON truncado:', parsed.stage);
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      console.error('[pipeline] Resposta nao-JSON:', responseText.slice(0, 300));
      return { ok: false, error: 'Resposta invalida do Gemini' };
    }

    // 5. Valida o stage
    if (!PIPELINE_STAGES.includes(parsed.stage)) {
      console.error('[pipeline] Stage invalido retornado:', parsed.stage);
      return { ok: false, error: `Stage invalido retornado: ${parsed.stage}` };
    }

    // 5b. TRAVA DETERMINÍSTICA: se IA disse sem_resposta mas lead ENVIOU mensagens,
    // sobrescreve pra em_conversa (regra binária, não pode errar)
    if (parsed.stage === 'sem_resposta' && hasUserMsg) {
      console.log('[pipeline] Override: IA disse sem_resposta mas lead respondeu — virando em_conversa');
      parsed.stage = 'em_conversa';
      parsed.reason = 'lead respondeu (override automatico)';
      parsed.confidence = 0.6;
    }

    // 6. Atualiza no banco
    const { error: updErr } = await supabase
      .from('conversas')
      .update({
        pipeline_stage: parsed.stage,
        pipeline_atualizado_em: new Date().toISOString(),
        pipeline_motivo: (parsed.reason || '').slice(0, 200),
        pipeline_confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null
      })
      .eq('id', conversaId);

    if (updErr) {
      return { ok: false, error: 'Erro ao salvar: ' + updErr.message };
    }

    return {
      ok: true,
      stage: parsed.stage,
      confidence: parsed.confidence,
      reason: parsed.reason
    };

  } catch (e) {
    console.error('[pipeline] Erro inesperado:', e);
    return { ok: false, error: e.message };
  }
}

// Endpoint: classifica UMA conversa
app.post('/api/pipeline/classificar/:conversaId', async (req, res) => {
  const r = await classificarConversa(req.params.conversaId);
  if (!r.ok) return res.status(400).json(r);
  return res.json(r);
});

// Endpoint: reclassifica TODAS as conversas não-arquivadas
// Roda em batches de 5 em paralelo pra não estourar rate limit do Gemini
app.post('/api/pipeline/reclassificar-tudo', async (req, res) => {
  try {
    const { data: conversas, error } = await supabase
      .from('conversas')
      .select('id')
      .eq('arquivada', false)
      .eq('pipeline_travado', false);

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    if (!conversas || conversas.length === 0) {
      return res.json({ ok: true, total: 0, classificadas: 0, erros: 0 });
    }

    const total = conversas.length;
    let classificadas = 0;
    let erros = 0;

    // Processa em batches de 5 paralelos
    const BATCH_SIZE = 5;
    for (let i = 0; i < conversas.length; i += BATCH_SIZE) {
      const batch = conversas.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(c => classificarConversa(c.id))
      );
      results.forEach(r => {
        if (r.ok) classificadas++;
        else erros++;
      });
    }

    console.log(`[pipeline] Reclassificacao: ${classificadas}/${total} OK, ${erros} erros`);
    return res.json({ ok: true, total, classificadas, erros });

  } catch (e) {
    console.error('Erro /api/pipeline/reclassificar-tudo:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => console.log(`Clara v3 rodando na porta ${PORT}`));
