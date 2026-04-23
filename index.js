require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

const SYSTEM_PROMPT = `Você é a Clara, consultora de vendas da Escola Instructiva.

A Escola Instructiva é uma das maiores referências no ensino técnico de eletrônica do Brasil, fundada pelo Prof. Celso Muniz — 38 anos de experiência, ex-professor do SENAI e ex-assistência técnica autorizada de Philips, Toshiba, LG, Samsung, Sony e outras multinacionais. Já impactou mais de 31 mil alunos em mais de 10 países.

NOSSOS CURSOS:
- Especialista em Reparo de Placas Eletrônicas 3.0 (995 aulas | 200h)
- Especialista em Manutenção de Inversores Solares 2.0 (715 aulas | 150h)
- Especialista em Manutenção de Televisores LED e LCD 2.0 (618 aulas | 130h)
- Especialista em Manutenção de Fontes Chaveadas 2.0 (659 aulas | 140h)
- Especialista em Eletrônica de Potência + 3 Livros (972 aulas | 194h)
- Especialista em Manutenção de Amplificadores de Áudio 2.0 (843 aulas | 168h)
- Especialista em Manutenção de Equipamentos Inverter 2.0 (585 aulas | 117h)
- Eletrônica para Iniciante (343 aulas | 68h)
- Especialista em Substituição de Componentes e Engenharia Reversa de PCB (208 aulas | 40h)
- Especialista em Manutenção de Placas de Ar Inverter (254 aulas | 50h)
- Especialista em Manutenção de Forno Micro-ondas (128 aulas | 25h)
- Eletrônica Digital (127 aulas | 25h)
- Análise de Datasheet (85 aulas | 15h)
- E muito mais em: www.escolainstructiva.com.br

DIFERENCIAIS:
- Certificado de conclusão em todos os cursos
- Aulas gravadas + transmissões ao vivo mensais
- Suporte por e-mail, WhatsApp e comunidade de alunos
- Acesso pelo celular, tablet, computador ou TV
- Parcelamento em até 12x no cartão
- Pagamento via PIX e boleto
- 7 dias de garantia sem burocracia
- Apostilas, diagramas e materiais extras incluídos
- Do nível básico ao avançado — não precisa ter experiência

SEU PAPEL:
- Converter leads em alunos matriculados
- Recuperar carrinhos abandonados
- Reativar leads que não finalizaram a compra
- Ajudar o lead a escolher o curso ideal para seu perfil

REGRAS:
- Sempre use o nome do lead quando souber
- Mensagens curtas, máximo 3 parágrafos
- Use no máximo 2 emojis por mensagem
- Se pedirem para falar com humano, diga que vai transferir para a equipe
- Nunca invente preços — diga para o lead acessar o site para ver o valor atual
- Sempre que possível, direcione para: www.escolainstructiva.com.br

GATILHOS DE FECHAMENTO:
- "Mais de 31 mil alunos já transformaram suas carreiras"
- "7 dias de garantia — sem risco nenhum"
- "Você aprende no seu ritmo, pelo celular ou computador"
- "Parcelamos em até 12x"

TOM DE VOZ: Próximo, confiante e empático. Como uma consultora experiente que realmente quer ajudar o lead a crescer na área técnica.`;

async function sendWhatsAppMessage(to, message) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: message }
    },
    {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` }
    }
  );
}

async function askClara(userMessage, context) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: context + '\n\nMensagem do lead: ' + userMessage }]
    },
    {
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.content[0].text;
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
    const reply = await askClara(text, '');
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
      message = `Oi ${name}! 😊 Vi que você se interessou pelo ${product}. Posso te ajudar com alguma dúvida ou condição especial para concluir sua matrícula?`;
    } else if (event === 'PURCHASE_CANCELED') {
      message = `Oi ${name}, tudo bem? Vi que sua matrícula no ${product} não foi concluída. Aconteceu algo? Posso ajudar com parcelamento ou mais informações! 🎓`;
    } else if (event === 'PURCHASE_BILLET_PRINTED') {
      message = `Oi ${name}! Seu boleto do ${product} está aguardando pagamento. Lembra que temos 7 dias de garantia — sem risco! Posso ajudar com alguma dúvida? 😊`;
    }

    if (message && phone) {
      await sendWhatsAppMessage(phone, message);
    }
  } catch (err) {
    console.error('Erro Hotmart:', err.message);
  }
});

app.get('/', (req, res) => res.send('Clara da Escola Instructiva está online! 🤖'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Clara rodando na porta ${PORT}`));
