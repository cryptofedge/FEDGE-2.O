require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function test() {
  const response = await axios({
    method: "post",
    url: "https://api.elevenlabs.io/v1/text-to-speech/OhcAdN25ThAFnC904VSS",
    headers: {
      "xi-api-key": process.env.ELEVEN_API_KEY,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    data: {
      text: "Yo, this is FEDGE 2.O. Your money moves start here.",
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    },
    responseType: "arraybuffer",
  });

  const filePath = path.join("C:\\Users\\Fellito Rodriguez", "test_output.mp3");
  fs.writeFileSync(filePath, response.data);
  console.log("Done! Saved to: " + filePath);
}

test().catch(err => console.log("Error: " + err.response?.status + " " + err.message));
