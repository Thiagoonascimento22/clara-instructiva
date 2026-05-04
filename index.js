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
// HELPERS WHATSAPP
// ════════════════════════════════════════════════════════════════
async function sendTypingIndicator(messageId) {
  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;
  try {
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
        typing_indicator: { type: 'text' }
      },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
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

async function sendWhatsAppMessage(to, message) {
  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;
  try {
    const r = await axios.post(
      url,
      { messaging_product: 'whatsapp', to, type: 'text', text: { body: message } },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
    console.log(`Mensagem enviada para ${to}`);
    return r.data;
  } catch (err) {
    console.error('Erro WhatsApp - Status:', err.response?.status);
    console.error('Erro WhatsApp - Data:', JSON.stringify(err.response?.data));
    throw err;
  }
}

async function sendWhatsAppTemplate(to, templateName, language, variables = []) {
  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;
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
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
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

async function getTemplateVariableCount(templateName) {
  if (!WABA_ID) return 0;
  try {
    const url = `https://graph.facebook.com/v22.0/${WABA_ID}/message_templates?fields=name,components&limit=200`;
    const r = await axios.get(url, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
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

async function getOrCreateConversa(leadId) {
  const { data: conversas } = await supabase
    .from('conversas')
    .select('*')
    .eq('lead_id', leadId)
    .eq('status', 'aberta')
    .eq('arquivada', false)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (conversas && conversas.length > 0) {
    return conversas[0];
  }

  const { data: nova } = await supabase
    .from('conversas')
    .insert({ lead_id: leadId, channel: 'whatsapp', status: 'aberta', arquivada: false })
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
    .select('campanha_id, campanhas(agente_id)')
    .eq('id', conversaId)
    .single();

  if (conversa?.campanhas?.agente_id) {
    const { data: agente } = await supabase
      .from('agentes')
      .select('*')
      .eq('id', conversa.campanhas.agente_id)
      .single();
    if (agente) return agente;
  }

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

async function askClara(userMessage, historico = [], agente = null) {
  const promptBase = agente?.system_prompt || SYSTEM_PROMPT_FALLBACK;
  const baseConhecimento = agente?.base_conhecimento ? `\n\nBASE DE CONHECIMENTO:\n${agente.base_conhecimento}` : '';
  const historicoTexto = historico.map(m => `${m.role === 'user' ? 'Lead' : 'Clara'}: ${m.content}`).join('\n');
  const prompt = promptBase
    + baseConhecimento
    + (historicoTexto ? `\n\nHISTÓRICO:\n${historicoTexto}` : '')
    + `\n\nMensagem atual do lead: ${userMessage}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const r = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] });
  const reply = r.data.candidates[0].content.parts[0].text;

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
async function gerarMensagemFollowup(historico, agente) {
  const promptBase = agente?.system_prompt || SYSTEM_PROMPT_FALLBACK;
  const baseConhecimento = agente?.base_conhecimento ? `\n\nBASE DE CONHECIMENTO:\n${agente.base_conhecimento}` : '';
  const historicoTexto = historico.map(m => `${m.role === 'user' ? 'Lead' : 'Clara'}: ${m.content}`).join('\n');

  const prompt = promptBase + baseConhecimento + `

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

EXEMPLOS DE BONS FOLLOW-UPS:
- "Oi [nome], conseguiu pensar? 🤝 Posso te ajudar com alguma dúvida?"
- "[Nome], tudo bem? Lembrei aqui de você. Conseguiu dar uma olhada?"
- "Oi [nome], passando pra ver se ficou alguma dúvida 😊"

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
        const mensagem = await gerarMensagemFollowup(historico, agente);

        if (!mensagem) {
          console.error(`Conversa ${conv.id}: falhou em gerar mensagem`);
          continue;
        }

        // Envia
        const phone = conv.leads?.phone;
        if (!phone) continue;

        await sendWhatsAppMessage(phone, mensagem);
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
    if (recebidoEm && recebidoEm !== PHONE_NUMBER_ID) { console.log(`Ignorado: msg veio pro numero ${recebidoEm}`); return; }

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
      console.log(`Mensagem ${msgType} recebida de ${from} (${profileName})`);
      await processarMidiaRecebida(from, message, profileName);
      return;
    }

    if (!text) return;

    console.log(`Mensagem recebida de ${from} (${profileName}): ${text}`);

    // Buffer de 8s pra agrupar mensagens consecutivas (anti double-text robotizado)
    await bufferarMensagem(from, text, profileName, message.id);

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
async function processarMidiaRecebida(from, message, profileName) {
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
    const conversa = await getOrCreateConversa(lead.id);

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

async function bufferarMensagem(from, text, profileName, messageId) {
  const existing = messageBuffer.get(from);

  if (existing) {
    // Já tem buffer aberto pra esse número — adiciona msg e reseta timer
    clearTimeout(existing.timer);
    existing.messages.push(text);
    existing.lastMessageId = messageId;
    if (profileName && !existing.profileName) existing.profileName = profileName;
    existing.timer = setTimeout(() => processarBufferDoLead(from), BUFFER_DELAY_MS);
    console.log(`[BUFFER] +1 msg pra ${from} (total: ${existing.messages.length}) — reset timer 8s`);
  } else {
    // Primeira msg — cria buffer novo
    const entry = {
      messages: [text],
      profileName,
      lastMessageId: messageId,
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
    const { messages, profileName, lastMessageId } = entry;
    const textoCombinado = messages.join('\n');
    console.log(`[BUFFER] Processando ${messages.length} msg(s) de ${from}`);

    const lead = await getOrCreateLead(from, profileName);
    const conversa = await getOrCreateConversa(lead.id);

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

    if (lastMessageId) await sendTypingIndicator(lastMessageId);

    // Manda o texto COMBINADO pro Gemini — assim ela responde considerando todas as msgs juntas
    const reply = await askClara(textoCombinado, historico, agente);
    const tempoEspera = calcularTempoDigitando(reply);
    console.log(`[BUFFER] Aguardando ${tempoEspera}ms antes de responder`);
    await new Promise(r => setTimeout(r, tempoEspera));

    await salvarMensagem(conversa.id, lead.id, 'assistant', reply);
    await sendWhatsAppMessage(from, reply);
  } catch (err) {
    console.error('[BUFFER] Erro processando:', err.message);
  }
}

// ════════════════════════════════════════════════════════════════
// HOTMART
// ════════════════════════════════════════════════════════════════
app.post('/hotmart', async (req, res) => {
  res.sendStatus(200);
  try {
    const event = req.body.event;
    const data = req.body.data;
    const phone = data?.buyer?.phone;
    const name = data?.buyer?.name?.split(' ')[0] || 'aluno';
    const product = data?.product?.name || 'nosso curso';

    let message = '';
    if (event === 'PURCHASE_ABANDONED') message = `Oi ${name}! 😊 Vi que você se interessou pelo ${product}. Posso te ajudar?`;
    else if (event === 'PURCHASE_CANCELED') message = `Oi ${name}, sua matrícula no ${product} não foi concluída. Posso ajudar! 🎓`;
    else if (event === 'PURCHASE_BILLET_PRINTED') message = `Oi ${name}! Seu boleto do ${product} aguarda pagamento. 7 dias de garantia! 😊`;

    if (message && phone) {
      const lead = await getOrCreateLead(phone);
      const conversa = await getOrCreateConversa(lead.id);
      await salvarMensagem(conversa.id, lead.id, 'assistant', message);
      await sendWhatsAppMessage(phone, message);
    }
  } catch (err) {
    console.error('Erro Hotmart:', err.message);
  }
});

// ════════════════════════════════════════════════════════════════
// API DE TEMPLATES META
// ════════════════════════════════════════════════════════════════
app.get('/api/templates', async (req, res) => {
  try {
    if (!WABA_ID) return res.status(500).json({ ok: false, error: 'WABA_ID não configurado' });
    const url = `https://graph.facebook.com/v22.0/${WABA_ID}/message_templates?limit=100&fields=name,status,category,language,components,quality_score`;
    const r = await axios.get(url, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
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

    const varCount = await getTemplateVariableCount(campanha.template_name);
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

        const conversa = await getOrCreateConversa(lead.id);
        const podeSobrescrever = await deveSobrescreverCampanha(conversa.id);
        if (!conversa.campanha_id || podeSobrescrever) {
          await supabase
            .from('conversas')
            .update({ campanha_id: campanhaId })
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
          varsToSend
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

    await sendWhatsAppMessage(phone, mensagem);
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
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: mediaType,
    [mediaType]: { id: mediaId }
  };
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
      '-i', 'pipe:0',
      '-c:a', 'libopus',
      '-b:a', '64k',
      '-ar', '48000',
      '-ac', '1',
      '-application', 'voip',
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
      if (code !== 0) return reject(new Error('ffmpeg falhou: ' + stderr.slice(-500)));
      resolve(Buffer.concat(chunks));
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

    // Áudio: SEMPRE converte pra OGG/Opus (formato que vira msg de voz no WhatsApp)
    if (tipo === 'audio') {
      const sizeBefore = (buffer.length / 1024).toFixed(1);
      console.log(`🔄 Convertendo audio (${sizeBefore}KB, ${mimeType}) pra OGG/Opus...`);
      try {
        buffer = await convertToOggOpus(buffer);
        mimeType = 'audio/ogg';
        filename = filename.replace(/\.[^.]+$/, '') + '.ogg';
        const sizeAfter = (buffer.length / 1024).toFixed(1);
        console.log(`✅ Conversão OK: ${sizeBefore}KB → ${sizeAfter}KB`);
      } catch (convErr) {
        console.error('❌ Erro convertendo audio:', convErr.message);
        return res.status(500).json({ ok: false, error: 'Falha ao converter áudio: ' + convErr.message });
      }
    }

    console.log(`📎 Enviando ${tipo} (${(buffer.length/1024).toFixed(1)}KB, ${mimeType}) pra ${phone}`);

    // 1. Upload pra Meta
    const mediaId = await uploadMediaParaMeta(buffer, mimeType, filename);
    if (!mediaId) throw new Error('Meta não retornou media_id');
    console.log(`📦 Upload Meta OK, media_id: ${mediaId}`);

    // 2. Envia mensagem WhatsApp
    const sendResult = await enviarMediaWhatsApp(phone, tipo, mediaId, legenda);
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
      }
    } catch (e) {
      console.error('Erro cron interval:', e.message);
    }
  }, 60 * 1000);
  console.log('⏰ Cron ativo (campanhas agendadas + follow-ups + gastos diários)');
}
iniciarCronDiario();

app.listen(PORT, () => console.log(`Clara v3 rodando na porta ${PORT}`));
