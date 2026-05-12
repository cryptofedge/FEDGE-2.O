const fs = require('fs');
const envVars = {};
fs.readFileSync('.env','utf8').split('\n').forEach(line => {
  const [k,...v] = line.trim().split('=');
  if(k) envVars[k] = v.join('=');
});
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: envVars.ANTHROPIC_API_KEY });
const SOUL = 'You are FEDGE 2.O, an AI agent for generational wealth and financial empowerment of underserved communities. You are direct, mission-driven, and knowledgeable about crypto, AI, and financial education. Keep responses concise for WhatsApp.';
async function ask(message) {
  const res = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: SOUL,
    messages: [{ role: 'user', content: message }]
  });
  return res.content[0].text;
}
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_session');
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('FEDGE 2.O connected to WhatsApp');
    }
  });
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!text) return;
    const from = msg.key.remoteJid;
    console.log('Message from', from, ':', text);
    try {
      const reply = await ask(text);
      await sock.sendMessage(from, { text: reply });
    } catch (err) {
      console.error('Error:', err.message);
    }
  });
}
startBot();
