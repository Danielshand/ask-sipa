// POST /api/speak { text, lang } -> audio/mpeg
// Neural text-to-speech for the read-aloud feature. Uses OpenAI TTS if OPENAI_API_KEY is set,
// ElevenLabs if ELEVENLABS_API_KEY is set. The page falls back to the browser voice if neither is set.

const OPENAI_VOICE = "nova";     // options: alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer
const OPENAI_MODEL = "gpt-4o-mini-tts";
const ELEVEN_VOICE = "pNInz6obpgDQGcFmaJgB"; // "Adam" default; set ELEVENLABS_VOICE_ID to override

const STYLE = {
  en: "You are an experienced SIP jobsite foreman explaining something to a crew member. Calm, warm, unhurried, plain spoken. Natural pauses at sentence ends. Slightly emphasize measurements and the words do not. No announcer energy.",
  es: "Eres un maestro de obra con experiencia en paneles SIP explicando algo a un compañero. Tranquilo, cálido, sin prisa, lenguaje sencillo. Pausas naturales al final de cada frase.",
};

export async function onRequestPost({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return new Response("Bad JSON", { status: 400 }); }
  const text = (typeof b.text === "string" ? b.text : "").trim().slice(0, 1200);
  const lang = b.lang === "es" ? "es" : "en";
  const VOICES = ["alloy","ash","ballad","coral","echo","fable","onyx","nova","sage","shimmer"];
  const voice = VOICES.includes(b.voice) ? b.voice : (env.OPENAI_TTS_VOICE || OPENAI_VOICE);
  if (!text) return new Response("No text", { status: 400 });

  if (env.OPENAI_API_KEY) {
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "authorization": "Bearer " + env.OPENAI_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        model: env.OPENAI_TTS_MODEL || OPENAI_MODEL,
        voice,
        input: text,
        instructions: STYLE[lang],
        response_format: "mp3",
        speed: 1.0,
      }),
    });
    if (!r.ok) return new Response("TTS error: " + (await r.text()).slice(0, 200), { status: 502 });
    return new Response(r.body, { headers: { "content-type": "audio/mpeg", "cache-control": "no-store", "access-control-allow-origin": "*" } });
  }

  if (env.ELEVENLABS_API_KEY) {
    const voice = env.ELEVENLABS_VOICE_ID || ELEVEN_VOICE;
    const r = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + voice + "/stream?output_format=mp3_44100_64", {
      method: "POST",
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ text, model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2 } }),
    });
    if (!r.ok) return new Response("TTS error: " + (await r.text()).slice(0, 200), { status: 502 });
    return new Response(r.body, { headers: { "content-type": "audio/mpeg", "cache-control": "no-store", "access-control-allow-origin": "*" } });
  }

  return new Response(JSON.stringify({ fallback: true }), { status: 501, headers: { "content-type": "application/json" } });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type" } });
}
