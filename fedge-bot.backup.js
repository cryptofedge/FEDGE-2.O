require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require("baileys");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const { execSync } = require("child_process");
const { Boom } = require("@hapi/boom");

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const FEDGE_SOUL = `You are FEDGE 2.O, an AI agent built to generate generational wealth for underserved communities. You speak like a financial coach from the hood who reads Bloomberg. Direct, confident, warm, no corporate speak. Always connect money moves to real life. Keep responses under 3 sentences for WhatsApp.`;
const MELAO_SOUL = `You are FEDGE 2.O in Melao's Studio mode — a music creation assistant for Milciades Holguin (Melao), cousin of Fellito Rodriguez. Help generate Suno AI music prompts and assist with music/content creation. Format Suno prompts with: Genre, Mood, Tempo, Instruments, Vocals, Theme, Style Reference, then a paste-ready full prompt. Keep it creative and hype. Sign off with — FEDGE 2.O ⚡ | Melao's Studio 🎶`;

async function generateVoice(text) {
  const mp3Path = "C:\\Users\\Fellito Rodriguez\\test_output.mp3";
  const safe = text.replace(/"/g, "'");
  execSync(`edge-tts --text "${safe}" --voice "en-US-ChristopherNeural" --write-media "${mp3Path}"`);
  return fs.readFileSync(mp3Path);
}

async function askFEDGE(userMessage, systemPrompt = FEDGE_SOUL) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }]
      })
    });
    const data = await response.json();
    if (!data.content || !data.content[0]) {
      console.log("API error:", JSON.stringify(data));
      return "FEDGE 2.O is processing... try again in a moment.";
    }
    return data.content[0].text;
  } catch (err) {
    console.log("askFEDGE error:", err.message);
    return "FEDGE 2.O hit a snag. Try again!";
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.windows("Chrome"),
    connectTimeoutMs: 60000,
  });
  sock.ev.on("connection.update", async ({ connection, qr, lastDisconnect }) => {
    if (qr) { console.log("Scan QR:"); qrcode.generate(qr, { small: true }); }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) startBot();
    }
    if (connection === "open") console.log("✅ FEDGE 2.O is LIVE!");
  });
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!text) return;
    console.log(`[${from}]: ${text}`);
    try {
      const lowerText = text.toLowerCase();
    const isStudioTrigger = lowerText.includes("melao") || lowerText.includes("studio") || lowerText.includes("!studio") || lowerText.includes("suno");
    const systemPrompt = isStudioTrigger ? MELAO_SOUL : FEDGE_SOUL;
      const reply = await askFEDGE(text, systemPrompt);
      console.log(`FEDGE: ${reply}`);
      await sock.sendMessage(from, { text: reply });
    } catch (err) {
      console.log("Error:", err.message);
    }
  });
  sock.ev.on("creds.update", saveCreds);
}
startBot();
