// FEDGE 2.O Journey — "Ask FEDGE" AI guide (Supabase Edge Function).
// The journey page (fedge2o.com/journey) sends the player's question plus which stop they're on;
// this function adds FEDGE's personality and the stop's lesson, asks Gemini, and returns a short answer.
// The Gemini key lives here as a secret, never in the web page.
//
// Deploy (from the FEDGE-2.O folder):
//   npx supabase functions deploy fedge-guide --no-verify-jwt --project-ref <your-project-ref>
//   npx supabase secrets set GEMINI_API_KEY=<key> --project-ref <your-project-ref>

const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-flash-latest";
const KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const BASE = Deno.env.get("GEMINI_BASE") ?? "https://generativelanguage.googleapis.com"; // override only for local testing
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://fedge2o.com,https://www.fedge2o.com,https://cryptofedge.github.io,http://localhost:8080")
  .split(",").map((s) => s.trim());

const STOPS: Record<string, { name: string; game: string; lesson: string }> = {
  lockin: { name: "The Block", game: "Lock In", lesson: "mindset, boundaries, discipline and consistency; protecting your mental energy; spotting toxic influence" },
  credit: { name: "Credit Ave", game: "Credit Warrior", lesson: "how credit scores work (FICO 300-850; payment history 35%, amounts owed 30%, length of history, new credit, credit mix), building credit from zero, avoiding predatory lending, personal vs business credit" },
  tradestreet: { name: "Wall Street", game: "TradeStreet", lesson: "paper trading, stocks and crypto basics, diversification, risk, spotting hype, pump-and-dumps and market manipulation" },
  worldstage: { name: "The Stage", game: "World Stage", lesson: "the music business: masters vs publishing, PROs (ASCAP, BMI, SESAC), royalties, reading deals, U.S. termination rights (reclaiming rights after about 35 years)" },
  trustfund: { name: "The Vault", game: "Trust Fund Tycoon", lesson: "handling an inheritance, revocable living trusts, avoiding probate, investment styles and risk through market events" },
  genwealth: { name: "Legacy Heights", game: "Generational Wealth", lesson: "the Infinite Banking Concept: whole life insurance cash value, borrowing against a policy (unpaid loans reduce the death benefit), compounding over a lifetime, real estate, passing wealth down" },
};

const SYSTEM = (stop: { name: string; game: string; lesson: string } | undefined, player: string) => `
You are FEDGE, the AI guide of FEDGE 2.O by Eclat Universe: a journey across a city where every neighborhood is a game that teaches generational wealth.
Voice: confident, warm, NYC energy, plain words. Talk like a big-brother mentor, never corny. Short answers: 2-5 sentences, or a tight list of up to 4 bullets. No markdown headers.
Player: ${player || "the player"}. ${stop ? `They are at ${stop.name}, playing ${stop.game}. This stop teaches: ${stop.lesson}.` : "They are looking at the journey map."}
Rules:
- Teach. Explain the idea, give a real-life example, and tie it back to the game when it helps.
- You are educational, not a financial, legal or tax advisor. Never tell someone to buy or sell a specific stock, coin or product. For big personal decisions, suggest a licensed professional.
- Be honest: if something is risky or you're not sure, say so. Don't invent statistics.
- Mental health: be supportive and practical, never clinical. If someone mentions self-harm, suicide or being in danger, respond with care and tell them to call or text 988 (Suicide & Crisis Lifeline, US) or their local emergency number right now.
- Keep it clean and respectful. Players may be young. Refuse anything unsafe or illegal and steer back to the journey.
- If asked about the password, accounts or anything technical about the site, say you can't help with that here.
`.trim();

// Best-effort per-IP limit (each function instance keeps its own counter).
const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) { hits.set(ip, { n: 1, t: now }); return false; }
  h.n++;
  return h.n > 12;
}

function cors(origin: string | null) {
  const allow = origin && ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers });
  if (origin && !ALLOWED.includes(origin)) return new Response(JSON.stringify({ error: "origin not allowed" }), { status: 403, headers });
  if (!KEY) return new Response(JSON.stringify({ error: "guide not configured" }), { status: 503, headers });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (limited(ip)) {
    return new Response(JSON.stringify({ reply: "Easy, I'm getting a lot of questions right now. Give me a minute and ask again." }), { headers });
  }

  let body: { stop?: string; player?: string; messages?: { role: string; text: string }[] };
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "bad json" }), { status: 400, headers }); }

  const msgs = (body.messages ?? []).slice(-10)
    .filter((m) => m && typeof m.text === "string" && m.text.trim())
    .map((m) => ({ role: m.role === "fedge" ? "model" : "user", parts: [{ text: m.text.slice(0, 600) }] }));
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") {
    return new Response(JSON.stringify({ error: "no question" }), { status: 400, headers });
  }
  const stop = body.stop ? STOPS[body.stop] : undefined;
  const player = String(body.player ?? "").replace(/[^\p{L}\p{N} '\-]/gu, "").slice(0, 24);

  const r = await fetch(`${BASE}/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM(stop, player) }] },
      contents: msgs,
      generationConfig: { maxOutputTokens: 350, temperature: 0.7 },
    }),
  });
  if (!r.ok) {
    console.error("gemini", r.status, (await r.text()).slice(0, 300));
    return new Response(JSON.stringify({ reply: "My signal dropped for a sec. Ask me again." }), { headers });
  }
  const data = await r.json();
  const reply = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("").trim()
    || "I couldn't put that into words. Try asking it a different way.";
  return new Response(JSON.stringify({ reply }), { headers });
});
