require('dotenv').config();
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const { createClient } = require('@supabase/supabase-js');

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

// Multer pra upload de foto de perfil (memória, max 5MB, só JPG/PNG)
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
  // Só adiciona componente body se tiver variáveis pra passar
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

// Helper: descobre quantas variáveis o template tem (consulta a Meta)
async function getTemplateVariableCount(templateName) {
  if (!WABA_ID) return 0;
  try {
    const url = `https://graph.facebook.com/v22.0/${WABA_ID}/message_templates?fields=name,components&limit=200`;
    const r = await axios.get(url, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } });
    const tpl = (r.data.data || []).find(t => t.name === templateName);
    if (!tpl) return 0;
    const body = (tpl.components || []).find(c => c.type === 'BODY')?.text || '';
    const matches = body.match(/\{\{\d+\}\}/g) || [];
    return new Set(matches).size; // variáveis únicas
  } catch (err) {
    console.error('Erro ao buscar variáveis do template:', err.message);
    return 0;
  }
}

// ════════════════════════════════════════════════════════════════
// HELPERS LEADS / CONVERSAS / MENSAGENS
// ════════════════════════════════════════════════════════════════
// Normaliza telefone BR pra formato único: 55 + DDD + 9 + número (13 dígitos)
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
    // Lead já existe mas sem nome OU com nome fake "Lead X" — atualiza com profile name real do WhatsApp
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
  await supabase.from('mensagens').insert({ conversa_id: conversaId, lead_id: leadId, role, content }); await supabase.from('conversas').update({ updated_at: new Date() }).eq('id', conversaId);
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

// ════════════════════════════════════════════════════════════════
// AGENTES — busca o agente certo pra responder
// ════════════════════════════════════════════════════════════════
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

  const PRECO_INPUT_USD = 0.075 / 1_000_000;
  const PRECO_OUTPUT_USD = 0.30 / 1_000_000;
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
    const value = changes?.value;     const recebidoEm = value?.metadata?.phone_number_id;     if (recebidoEm && recebidoEm !== PHONE_NUMBER_ID) { console.log(`Ignorado: msg veio pro numero ${recebidoEm}`); return; }

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
    if (!text) return;

    console.log(`Mensagem recebida de ${from} (${profileName}): ${text}`);

    const lead = await getOrCreateLead(from, profileName);
    const conversa = await getOrCreateConversa(lead.id);

    await supabase
      .from('campanha_envios')
      .update({ status: 'respondido', respondido_em: new Date() })
      .eq('lead_id', lead.id)
      .in('status', ['enviado', 'entregue', 'lido']);

    await salvarMensagem(conversa.id, lead.id, 'user', text);

    if (conversa.ia_active === false) {
      console.log(`Clara pausada na conversa ${conversa.id} — humano assumiu, não respondendo`);
      return;
    }

    const historico = await buscarHistorico(conversa.id);
    const agente = await buscarAgenteAtivo(conversa.id);

    const reply = await askClara(text, historico, agente);
    await salvarMensagem(conversa.id, lead.id, 'assistant', reply);
    await sendWhatsAppMessage(from, reply);
  } catch (err) {
    console.error('Erro webhook:', err.message);
  }
});

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
    console.log(`✓ Upload concluído, handle recebido`);

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
// API DE DISPARO DE CAMPANHA
// ════════════════════════════════════════════════════════════════
app.post('/api/campanhas/:id/disparar', async (req, res) => {
  const campanhaId = req.params.id;
  res.json({ ok: true, message: 'Disparo iniciado em segundo plano' });

  setImmediate(async () => {
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
            console.log(`Conversa ${conversa.id} vinculada à campanha ${campanha.nome}`);
          } else {
            console.log(`Conversa ${conversa.id} mantida na campanha anterior (ativa)`);
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
  });
});

// ════════════════════════════════════════════════════════════════
// API CONTROLE MANUAL DA CONVERSA (pausar/retomar Clara + envio manual + marcar lida)
// ════════════════════════════════════════════════════════════════

app.post('/api/conversas/:id/pausar', async (req, res) => {
  try {
    const { error } = await supabase
      .from('conversas')
      .update({ ia_active: false, updated_at: new Date() })
      .eq('id', req.params.id);
    if (error) throw error;
    console.log(`Conversa ${req.params.id} pausada (humano assumiu)`);
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
    console.log(`Conversa ${req.params.id} retomada (Clara voltou)`);
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

    console.log(`Mensagem manual enviada para ${phone} na conversa ${conversa.id}`);
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

// ⭐ NOVA ROTA: marcar conversa como lida (atualiza last_read_at = now)
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
// HEALTH CHECK
// ════════════════════════════════════════════════════════════════
app.get('/', (req, res) => res.send('Clara da Escola Instructiva está online! 🤖 v3'));

const PORT = process.env.PORT || 3000;

// ════════════════════════════════════════════════════════════════
// META BUSINESS API — Sincronização de gastos do WhatsApp
// ════════════════════════════════════════════════════════════════
async function getCotacaoUSDBRL() {
  try {
    const r = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL', { timeout: 10000 });
    const cotacao = parseFloat(r.data?.USDBRL?.bid);
    if (cotacao && cotacao > 0) return cotacao;
  } catch (e) {
    console.error('Erro ao buscar cotação:', e.message);
  }
  return 5.50;
}

async function sincronizarGastosMeta() {
  console.log('🔄 Iniciando sincronização Meta...');
  
  if (!WHATSAPP_TOKEN || !WABA_ID) {
    console.error('Faltam credenciais Meta (WHATSAPP_TOKEN ou WABA_ID)');
    return { success: false, error: 'Credenciais Meta não configuradas' };
  }

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  const startTs = Math.floor(start.getTime() / 1000);
  const endTs = Math.floor(now.getTime() / 1000);

  const cotacao = await getCotacaoUSDBRL();
  console.log(`💱 Cotação USD->BRL: R$ ${cotacao.toFixed(2)}`);

  try {
    const url = `https://graph.facebook.com/v21.0/${WABA_ID}/pricing_analytics`;
    const params = {
      start: startTs,
      end: endTs,
      granularity: 'DAILY',
      access_token: WHATSAPP_TOKEN
    };

    const response = await axios.get(url, { params, timeout: 30000 });
    const data = response.data?.data?.[0]?.data_points || [];

    if (!data.length) {
      console.log('Nenhum dado de pricing analytics retornado');
      return await sincronizarConversationAnalytics(startTs, endTs, cotacao);
    }

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
        await supabase.from('gastos').update({
          valor: custoBRL,
          descricao,
          canal: 'whatsapp'
        }).eq('id', existing[0].id);
        totalAtualizado++;
      } else {
        await supabase.from('gastos').insert({
          valor: custoBRL,
          descricao,
          data: dataDia,
          canal: 'whatsapp',
          categoria,
          source: 'meta_api'
        });
        totalInserido++;
      }
    }

    console.log(`✅ Meta sincronizado: ${totalInserido} novos, ${totalAtualizado} atualizados`);
    return { success: true, inserted: totalInserido, updated: totalAtualizado, cotacao };

  } catch (err) {
    console.error('Erro Meta API:', err.response?.data || err.message);
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

async function sincronizarConversationAnalytics(startTs, endTs, cotacao) {
  try {
    const url = `https://graph.facebook.com/v21.0/${WABA_ID}`;
    const params = {
      fields: `conversation_analytics.start(${startTs}).end(${endTs}).granularity(DAILY).phone_numbers([])`,
      access_token: WHATSAPP_TOKEN
    };

    const response = await axios.get(url, { params, timeout: 30000 });
    const points = response.data?.conversation_analytics?.data?.[0]?.data_points || [];

    if (!points.length) {
      return { success: true, inserted: 0, updated: 0, message: 'Sem dados disponíveis no período' };
    }

    let totalInserido = 0, totalAtualizado = 0;

    for (const point of points) {
      const dataDia = new Date((point.start || 0) * 1000).toISOString().slice(0, 10);
      const custoUSD = parseFloat(point.cost || 0);
      if (custoUSD <= 0) continue;
      const custoBRL = custoUSD * cotacao;
      const categoria = 'Meta WhatsApp';
      const descricao = `Conversas - ${dataDia}`;

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

async function gerarGastosRecorrentes() {
  console.log('🔄 Gerando gastos recorrentes...');
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mesAno = hoje.toISOString().slice(0, 7);

  const { data: recorrentes } = await supabase
    .from('gastos')
    .select('*')
    .eq('recorrente', true);

  if (!recorrentes || !recorrentes.length) return { generated: 0 };

  let geradosCount = 0;
  for (const r of recorrentes) {
    const diaRec = r.recorrencia_dia || 1;
    if (diaHoje !== diaRec) continue;

    const dataEsperada = `${mesAno}-${String(diaRec).padStart(2, '0')}`;
    const { data: existe } = await supabase
      .from('gastos')
      .select('id')
      .eq('data', dataEsperada)
      .eq('descricao', r.descricao)
      .eq('source', 'recorrente')
      .limit(1);

    if (existe && existe.length > 0) continue;

    await supabase.from('gastos').insert({
      valor: r.valor,
      descricao: r.descricao,
      data: dataEsperada,
      canal: r.canal,
      categoria: r.categoria || 'Outros',
      source: 'recorrente'
    });
    geradosCount++;
  }
  console.log(`✅ ${geradosCount} gastos recorrentes gerados`);
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

function iniciarCronDiario() {
  setInterval(async () => {
    const agora = new Date();
    if (agora.getHours() === 3 && agora.getMinutes() === 0) {
      console.log('⏰ Cron diário 03:00 disparado');
      await sincronizarGastosMeta();
      await gerarGastosRecorrentes();
    }
  }, 60 * 1000);
  console.log('⏰ Cron diário ativo (03:00)');
}
iniciarCronDiario();

app.listen(PORT, () => console.log(`Clara v3 rodando na porta ${PORT}`));
