require('dotenv').config();
const express = require('express');
const axios = require('axios');
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

const supabase = createClient(
  process.env.URL_SUPABASE,
  process.env.SUPABASE_SERVICE_KEY
);

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
async function getOrCreateLead(phone, name = null) {
  let { data: lead } = await supabase.from('leads').select('*').eq('phone', phone).single();
  if (!lead) {
    const insertData = { phone };
    if (name) insertData.name = name;
    const { data: newLead } = await supabase.from('leads').insert(insertData).select().single();
    lead = newLead;
  }
  return lead;
}

async function getOrCreateConversa(leadId) {
  let { data: conversa } = await supabase
    .from('conversas')
    .select('*')
    .eq('lead_id', leadId)
    .eq('status', 'aberta')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (!conversa) {
    const { data: nova } = await supabase
      .from('conversas')
      .insert({ lead_id: leadId, channel: 'whatsapp', status: 'aberta' })
      .select()
      .single();
    conversa = nova;
  }
  return conversa;
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
async function buscarAgenteAtivo(leadId) {
  // 1. Primeiro tenta achar campanha ativa que esse lead foi alvo
  const { data: envio } = await supabase
    .from('campanha_envios')
    .select('campanha_id, campanhas(agente_id)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (envio?.campanhas?.agente_id) {
    const { data: agente } = await supabase
      .from('agentes')
      .select('*')
      .eq('id', envio.campanhas.agente_id)
      .single();
    if (agente) return agente;
  }

  // 2. Se não achou pela campanha, pega o agente padrão (is_default=true)
  const { data: padrao } = await supabase
    .from('agentes')
    .select('*')
    .eq('is_default', true)
    .eq('ativo', true)
    .limit(1)
    .single();

  return padrao || null;
}

async function askClara(userMessage, historico = [], agente = null) {
  const promptBase = agente?.system_prompt || SYSTEM_PROMPT_FALLBACK;
  const baseConhecimento = agente?.base_conhecimento ? `\n\nBASE DE CONHECIMENTO:\n${agente.base_conhecimento}` : '';
  const historicoTexto = historico.map(m => `${m.role === 'user' ? 'Lead' : 'Clara'}: ${m.content}`).join('\n');
  const prompt = promptBase
    + baseConhecimento
    + (historicoTexto ? `\n\nHISTÓRICO:\n${historicoTexto}` : '')
    + `\n\nMensagem atual do lead: ${userMessage}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const r = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] });
  return r.data.candidates[0].content.parts[0].text;
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

    // Atualizar status de envios (entregue, lido)
    if (value?.statuses?.length) {
      for (const st of value.statuses) {
        const msgId = st.id;
        const status = st.status; // sent, delivered, read, failed
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

    // Marcar resposta de campanha (se houver)
    await supabase
      .from('campanha_envios')
      .update({ status: 'respondido', respondido_em: new Date() })
      .eq('lead_id', lead.id)
      .in('status', ['enviado', 'entregue', 'lido']);

    const historico = await buscarHistorico(conversa.id);
    const agente = await buscarAgenteAtivo(lead.id);

    await salvarMensagem(conversa.id, lead.id, 'user', text);
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
// API DE DISPARO DE CAMPANHA
// ════════════════════════════════════════════════════════════════
app.post('/api/campanhas/:id/disparar', async (req, res) => {
  const campanhaId = req.params.id;
  res.json({ ok: true, message: 'Disparo iniciado em segundo plano' });

  // Disparo em segundo plano (não bloqueia resposta)
  setImmediate(async () => {
    try {
      const { data: campanha } = await supabase.from('campanhas').select('*').eq('id', campanhaId).single();
      if (!campanha) return console.error('Campanha não encontrada');

      await supabase.from('campanhas').update({ status: 'disparando', iniciada_em: new Date() }).eq('id', campanhaId);

      // Descobrir quantas variáveis o template tem
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
          // Garantir que o lead existe
          const lead = await getOrCreateLead(envio.phone, envio.nome);

          // Preparar variáveis: pegar só a quantidade que o template precisa
          let varsToSend = [];
          if (varCount > 0) {
            const allVars = envio.variaveis || [];
            varsToSend = allVars.slice(0, varCount);
            // Se faltar variáveis, preenche com nome ou "amigo"
            while (varsToSend.length < varCount) {
              varsToSend.push(envio.nome || 'amigo');
            }
          }

          // Enviar template
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

          // Delay entre envios (respeita rate limit Meta: ~80/seg, mas vamos bem mais devagar pra qualidade)
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
// HEALTH CHECK
// ════════════════════════════════════════════════════════════════
app.get('/', (req, res) => res.send('Clara da Escola Instructiva está online! 🤖 v3'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Clara v3 rodando na porta ${PORT}`));
