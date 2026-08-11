---
name: openai-api
description: >
  OpenAI API integration for GPT models, image generation (DALL-E), Whisper transcription,
  and AI capabilities. Use when building AI features, generating content with GPT, creating
  images with DALL-E, transcribing audio with Whisper, or integrating AI into workflows.
  Triggers on phrases like "OpenAI", "ChatGPT API", "GPT-4", "DALL-E", "Whisper",
  "AI text generation", "OpenAI integration", "build with GPT", "AI image generation".
---

# OpenAI API — GPT, DALL-E & Whisper

OpenAI provides the world's most powerful AI models via API.
URL: https://platform.openai.com

## Core Models

### 💬 GPT Models (Text)
- *GPT-4o* — Most capable, multimodal (text + image input)
- *GPT-4o mini* — Fast and cheap for simpler tasks
- *o3* — Advanced reasoning model for complex problems
- *o4-mini* — Fast reasoning at lower cost
- Use for: content generation, copywriting, analysis, coding assistance

### 🖼️ Image Generation (DALL-E / GPT Image)
- *gpt-image-1* — Latest, best quality + text rendering
- *DALL-E 3* — High quality image generation
- Use for: ad creatives, product mockups, social media visuals

### 🎙️ Whisper (Audio Transcription)
- Transcribe audio to text in 99 languages
- Already configured in OpenClaw as `openai-whisper-api`
- Use for: transcribe interviews, meetings, voice messages

### 🔊 TTS (Text-to-Speech)
- Voices: Alloy, Echo, Fable, Onyx, Nova, Shimmer
- Fast, affordable alternative to ElevenLabs for simple uses
- Use for: quick voiceovers, content narration

### 👁️ Vision (GPT-4o)
- Analyze images and answer questions about them
- Use for: product image analysis, content review

---

## Use Cases for Éclat Universe

### Content Creation
- Generate social media captions in bulk
- Write press releases and pitch emails
- Draft blog posts and artist bios
- Create ad copy variations for A/B testing

### Music Industry
- Generate song concepts and lyric ideas (for inspiration)
- Write EPK bios and press materials
- Create playlist pitch descriptions

### Sensual Make Up
- Generate product descriptions for Shopify
- Write email marketing copy
- Create workshop descriptions

### FEDGE 2.O Development
- Build new automation features
- Generate training data
- Power additional AI capabilities

---

## API Pricing (Approximate)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|----------------------|
| GPT-4o | $2.50 | $10.00 |
| GPT-4o mini | $0.15 | $0.60 |
| o4-mini | $1.10 | $4.40 |
| gpt-image-1 | ~$0.02/image | — |
| Whisper | $0.006/minute | — |
| TTS | $15/1M chars | — |

## Getting Started
1. Create account: https://platform.openai.com
2. Add billing: platform.openai.com/billing
3. Get API key: platform.openai.com/api-keys
4. Read docs: platform.openai.com/docs

## Key Link
https://platform.openai.com
