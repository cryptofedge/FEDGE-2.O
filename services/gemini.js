const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MASTER_SOUL = fs.readFileSync('./SOUL.md', 'utf8');
const MASTER_MEMORY = fs.existsSync('./MEMORY.md') ? fs.readFileSync('./MEMORY.md', 'utf8') : '';

// gemini-1.5-pro was retired and 404s; gemini-2.5-pro is closed to new users.
// "-latest" tracks the current GA Pro model so this can't rot again.
// Override with GEMINI_MODEL in .env (e.g. gemini-2.5-flash for faster replies).
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-pro-latest";

async function askGemini(prompt, systemInstruction = MASTER_SOUL, attempts = 2) {
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemInstruction + "\n\n---\n## RECENT MEMORY\n" + MASTER_MEMORY
  });

  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastErr = error;
      console.error(`Gemini Engine Error (attempt ${i}/${attempts}):`, error.message);
      if (i < attempts) await new Promise(r => setTimeout(r, 1500));
    }
  }
  // No backup model is configured — say so plainly rather than promising one.
  return `FEDGE 2.O couldn't reach the Gemini engine (${lastErr?.message || 'unknown error'}). Try again in a moment.`;
}

module.exports = { askGemini };
