require('dotenv').config();

const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(express.json());
app.use(express.static('public'));

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || process.env.ID_DO_NÚMERO_DE_TELEFONE;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || process.env.VERIFICAR_TOKEN;
const GEMINI_API_KEY = process.env.CLAUDE_API_KEY;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SYSTEM_PROMPT = `Você é a Clara, consultora de vendas da Escola Instructiva.

A Escola Instructiva é uma escola técnica em eletrônica fundada pelo Prof. Celso Muniz.

Sua missão é conversar com leads pelo WhatsApp, tirar dúvidas, orientar sobre cursos e ajudar na matrícula.

Regras:
- Fale de forma humana, curta e objetiva
- Use no máximo 2 emojis
- Nunca invente preços
- Se o lead pedir humano, diga que vai transferir para a equipe
- Não envie textos longos
- Seja próxima, educada e consultiva`;

async function getOrCreateLead(phone) {
  let { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (!lead) {
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({ phone })
      .select()
      .single();

    if (error) throw error;
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
    .maybeSingle();

  if (!conversa) {
    const { data: novaConversa, error } = await supabase
      .from('conversas')
      .insert({
        lead_id: leadId,
        channel: 'whatsapp',
        status: 'aberta'
      })
      .select()
      .single();

    if (error) throw error;
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

async function buscarHistorico(conversaId) {
  const { data } = await supabase
    .from('mensagens')
    .select('role, content')
    .eq('conversa_id', conversaId)
    .order('created_at', { ascending: false })
    .limit(10);

  return (data || []).reverse();
}

async function sendWhatsAppMessage(to, message) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: message
      }
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`
      }
    }
  );
}

async function askClara(userMessage, historico = []) {
  const historicoTexto = historico
    .map(m => `${m.role === 'user' ? 'Lead' : 'Clara'}: ${m.content}`)
    .join('\n');

  const prompt = `
${SYSTEM_PROMPT}

Histórico:
${historicoTexto}

Mensagem atual do lead:
${userMessage}
`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    }
  );

  return response.data.candidates[0].content.parts[0].text;
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

    const lead = await getOrCreateLead(from);
    const conversa = await getOrCreateConversa(lead.id);

    await salvarMensagem(conversa.id, lead.id, 'user', text);

    const historico = await buscarHistorico(conversa.id);
    const reply = await askClara(text, historico);

    await salvarMensagem(conversa.id, lead.id, 'assistant', reply);
    await sendWhatsAppMessage(from, reply);

  } catch (err) {
    console.error('Erro webhook:', err.response?.data || err.message);
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

    if (!phone) return;

    let message = '';

    if (event === 'PURCHASE_ABANDONED') {
      message = `Oi ${name}! 😊 Vi que você se interessou pelo ${product}. Posso te ajudar com alguma dúvida para concluir sua matrícula?`;
    }

    if (event === 'PURCHASE_CANCELED') {
      message = `Oi ${name}, tudo bem? Vi que sua matrícula no ${product} não foi concluída. Posso te ajudar?`;
    }

    if (event === 'PURCHASE_BILLET_PRINTED') {
      message = `Oi ${name}! Seu boleto do ${product} ficou aguardando pagamento. Precisa de ajuda com alguma dúvida? 😊`;
    }

    if (!message) return;

    const lead = await getOrCreateLead(phone);
    const conversa = await getOrCreateConversa(lead.id);

    await salvarMensagem(conversa.id, lead.id, 'assistant', message);
    await sendWhatsAppMessage(phone, message);

  } catch (err) {
    console.error('Erro Hotmart:', err.response?.data || err.message);
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const PORT = process.env.PORT || process.env.PORTA || 3000;

app.listen(PORT, () => {
  console.log(`Clara rodando na porta ${PORT}`);
});
