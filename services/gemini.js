const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MASTER_SOUL = fs.readFileSync('./SOUL.md', 'utf8');
const MASTER_MEMORY = fs.existsSync('./MEMORY.md') ? fs.readFileSync('./MEMORY.md', 'utf8') : '';

async function askGemini(prompt, systemInstruction = MASTER_SOUL) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: systemInstruction + "\n\n---\n## RECENT MEMORY\n" + MASTER_MEMORY
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Engine Error:", error.message);
    return "FEDGE 2.O Gemini engine hit a snag. Let me try my backup brain...";
  }
}

module.exports = { askGemini };
