require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GEMINI_API_KEY = process.env.CLAUDE_API_KEY;

const supabase = createClient(
  process.env.URL_SUPABASE,
  process.env.SUPABASE_SERVICE_KEY
);

const SYSTEM_PROMPT = `Você é a Clara, consultora de vendas da Escola Instructiva, uma escola técnica em eletrônica do Brasil fundada pelo Prof. Celso Muniz — 38 anos de experiência, ex-professor do SENAI, ex-assistência técnica de Philips, Toshiba, LG, Samsung, Sony. Já impactou mais de 31 mil alunos em mais de 10 países.

NOSSOS CURSOS:
- Especialista em Reparo de Placas Eletrônicas 3.0 (995 aulas | 200h)
- Especialista em Manutenção de Inversores Solares 2.0 (715 aulas | 150h)
- Especialista em Manutenção de Televisores LED e LCD 2.0 (618 aulas | 130h)
- Especialista em Manutenção de Fontes Chaveadas 2.0 (659 aulas | 140h)
- Especialista em Eletrônica de Potência + 3 Livros (972 aulas | 194h)
- Especialista em Manutenção de Amplificadores de Áudio 2.0 (843 aulas | 168h)
- Especialista em Manutenção de Equipamentos Inverter 2.0 (585 aulas | 117h)
- Eletrônica para Iniciante (343 aulas | 68h)
- E muito mais em: www.escolainstructiva.com.br

DIFERENCIAIS:
- Certificado em todos os cursos
- Aulas gravadas + ao vivo mensais
- Suporte por WhatsApp e comunidade
- Acesso pelo celular, tablet ou PC
- Parcelamento em até 12x no cartão
- 7 dias de garantia sem burocracia

REGRAS:
- Use o nome do lead sempre que souber
- Mensagens curtas, máximo 3 parágrafos
- No máximo 2 emojis por mensagem
- Se pedirem humano, diga que vai transferir
- Nunca invente preços, direcione para o site
- Tom: próximo, confiante e empático`;

async function sendWhatsAppMessage(to, message) {
  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;
  try {
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message }
      },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
    console.log(`Mensagem enviada para ${to}`);
  } catch (err) {
    console.error('Erro WhatsApp - Status:', err.response?.status);
    console.error('Erro WhatsApp - Data:', JSON.stringify(err.response?.data));
    throw err;
  }
}

async function getOrCreateLead(phone) {
  let { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('phone', phone)
    .single();

  if (!lead) {
    const { data: newLead } = await supabase
      .from('leads')
      .insert({ phone })
      .select()
      .single();
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
    const { data: novaConversa } = await supabase
      .from('conversas')
      .insert({ lead_id: leadId, channel: 'whatsapp', status: 'aberta' })
      .select()
      .single();
    conversa = novaConversa;
  }
  return conversa;
}

async function salvarMensagem(conversaId, leadId, role, content) {
  await supabase.from('mensagens').insert({
    conversa_id: conversaId,
    lead_id: leadId,
    role,
    content
  });
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

async function askClara(userMessage, historico = []) {
  const historicoTexto = historico
    .map(m => `${m.role === 'user' ? 'Lead' : 'Clara'}: ${m.content}`)
    .join('\n');

  const prompt = SYSTEM_PROMPT
    + (historicoTexto ? `\n\nHISTÓRICO DA CONVERSA:\n${historicoTexto}` : '')
    + `\n\nMensagem atual do lead: ${userMessage}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const response = await axios.post(
      url,
      { contents: [{ parts: [{ text: prompt }] }] }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error('Erro Gemini - Status:', err.response?.status);
    console.error('Erro Gemini - Data:', JSON.stringify(err.response?.data));
    throw err;
  }
}

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
    const message = changes?.value?.messages?.[0];
    if (!message) return;

    const from = message.from;
    const text = message.text?.body || '';
    if (!text) return;

    console.log(`Mensagem recebida de ${from}: ${text}`);

    const lead = await getOrCreateLead(from);
    const conversa = await getOrCreateConversa(lead.id);
    const historico = await buscarHistorico(conversa.id);

    await salvarMensagem(conversa.id, lead.id, 'user', text);
    const reply = await askClara(text, historico);
    await salvarMensagem(conversa.id, lead.id, 'assistant', reply);
    await sendWhatsAppMessage(from, reply);

  } catch (err) {
    console.error('Erro webhook:', err.message);
  }
});

app.post('/hotmart', async (req, res) => {
  res.sendStatus(200);
  try {
    const event = req.body.event;
    const data = req.body.data;
    const phone = data?.buyer?.phone;
    const name = data?.buyer?.name?.split(' ')[0] || 'aluno';
    const product = data?.product?.name || 'nosso curso';

    let message = '';
    if (event === 'PURCHASE_ABANDONED') {
      message = `Oi ${name}! 😊 Vi que você se interessou pelo ${product}. Posso te ajudar com alguma dúvida ou condição especial?`;
    } else if (event === 'PURCHASE_CANCELED') {
      message = `Oi ${name}, tudo bem? Vi que sua matrícula no ${product} não foi concluída. Posso ajudar! 🎓`;
    } else if (event === 'PURCHASE_BILLET_PRINTED') {
      message = `Oi ${name}! Seu boleto do ${product} está aguardando. Temos 7 dias de garantia — sem risco! 😊`;
    }

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

app.get('/', (req, res) => res.send('Clara da Escola Instructiva está online! 🤖'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Clara rodando na porta ${PORT}`));
