require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const GEMINI_API_KEY = process.env.CLAUDE_API_KEY;

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
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: message }
    },
    { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
  );
}

async function askClara(userMessage) {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\nMensagem do lead: ' + userMessage }] }]
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
    const reply = await askClara(text);
    await sendWhatsAppMessage(from, reply);
  } catch (err) {
    console.error('Erro:', err.message);
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

    if (message && phone) await sendWhatsAppMessage(phone, message);
  } catch (err) {
    console.error('Erro Hotmart:', err.message);
  }
});

app.get('/', (req, res) => res.send('Clara da Escola Instructiva está online! 🤖'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Clara rodando na porta ${PORT}`));
