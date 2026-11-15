const DEFAULT_PROMPT = `Create a standalone typographic lettering artwork, not a photograph.
Exact text to render: "{{TEXT}}"
Text color: {{COLOR}}.
Style: refined, minimal, editorial travel-journal lettering, hand-crafted lettering with excellent legibility and balanced composition. Add at most one tiny hand-drawn decorative icon that relates subtly to the words. Keep all lettering and decoration together as one compact composition, centered, with generous breathing room.
The entire background must be a perfectly flat, uniform pure chroma green (#00FF00), edge to edge. Do not use gradients, shadows, texture, lighting, noise, or any green hue in the artwork. Do not include a frame, mockup, photograph, or any other text. Make the lettering large and readable. Output one image.`;

const corsHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}
function b64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}
async function sessionValid(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(";").map(x => x.trim()).find(x => x.startsWith("fv_admin="))?.slice(9);
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return signature === await sign(expires, env.ADMIN_PASSWORD);
}
function cookie(value, maxAge) {
  return `fv_admin=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}
async function getPrompt(env) {
  if (!env.PROMPTS) return DEFAULT_PROMPT;
  return (await env.PROMPTS.get("active_prompt")) || DEFAULT_PROMPT;
}
async function readJson(request, max = 20000) {
  const text = await request.text();
  if (text.length > max) throw new Error("Corpo da solicitação muito grande.");
  return JSON.parse(text);
}
function cleanText(value) {
  return String(value || "").trim().replace(/[\u0000-\u001f]/g, " ").slice(0, 90);
}
async function generate(request, env) {
  if (!env.GEMINI_API_KEY) return json({ error: "A chave da API Gemini ainda não foi configurada no servidor." }, 503);
  const body = await readJson(request, 5000);
  const text = cleanText(body.text);
  const color = body.color === "white" ? "pure white" : "pure black";
  if (!text) return json({ error: "Digite o texto que deseja transformar em lettering." }, 400);
  const template = await getPrompt(env);
  const prompt = template.replaceAll("{{TEXT}}", text).replaceAll("{{COLOR}}", color);
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/interactions";
  const upstream = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
    body: JSON.stringify({
      model: "gemini-3.1-flash-image",
      input: prompt,
      response_format: { type: "image", aspect_ratio: "1:1" }
    })
  });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const message = payload?.error?.message || "O Gemini não conseguiu gerar o lettering.";
    return json({ error: message }, upstream.status === 429 ? 429 : 502);
  }
  let image = payload?.output_image;
  if (!image?.data && Array.isArray(payload?.steps)) {
    for (const step of payload.steps) {
      for (const block of step.content || []) if (block.type === "image" && block.data) image = block;
    }
  }
  if (!image?.data) return json({ error: "O Gemini respondeu, mas não devolveu uma imagem. Tente novamente." }, 502);
  return json({ image: image.data, mimeType: image.mime_type || "image/png", text });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...corsHeaders, "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
      if (url.pathname === "/api/health" && request.method === "GET") return json({ ok: true, geminiConfigured: !!env.GEMINI_API_KEY, adminConfigured: !!env.ADMIN_PASSWORD });
      if (url.pathname === "/api/admin/login" && request.method === "POST") {
        if (!env.ADMIN_PASSWORD) return json({ error: "Configure ADMIN_PASSWORD como secret do Worker." }, 503);
        const body = await readJson(request, 2000);
        if (typeof body.password !== "string" || body.password !== env.ADMIN_PASSWORD) return json({ error: "Senha incorreta." }, 401);
        const expires = String(Date.now() + 8 * 60 * 60 * 1000);
        const signature = await sign(expires, env.ADMIN_PASSWORD);
        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Set-Cookie": cookie(expires + "." + signature, 8 * 60 * 60) } });
      }
      if (url.pathname === "/api/admin/logout" && request.method === "POST") return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Set-Cookie": cookie("", 0) } });
      if (url.pathname === "/api/admin/prompt" && request.method === "GET") {
        if (!(await sessionValid(request, env))) return json({ error: "Acesso não autorizado." }, 401);
        return json({ prompt: await getPrompt(env), defaultPrompt: DEFAULT_PROMPT });
      }
      if (url.pathname === "/api/admin/prompt" && request.method === "PUT") {
        if (!(await sessionValid(request, env))) return json({ error: "Acesso não autorizado." }, 401);
        if (!env.PROMPTS) return json({ error: "O armazenamento PROMPTS ainda não está vinculado ao Worker." }, 503);
        const body = await readJson(request, 12000);
        const prompt = String(body.prompt || "").trim();
        if (prompt.length < 80 || prompt.length > 10000 || !prompt.includes("{{TEXT}}") || !prompt.includes("{{COLOR}}")) return json({ error: "O prompt precisa ter entre 80 e 10.000 caracteres e conter {{TEXT}} e {{COLOR}}." }, 400);
        await env.PROMPTS.put("active_prompt", prompt);
        return json({ ok: true, prompt });
      }
      if (url.pathname === "/api/generate" && request.method === "POST") return generate(request, env);
      return json({ error: "Endpoint não encontrado." }, 404);
    }
    return env.ASSETS.fetch(request);
  }
};