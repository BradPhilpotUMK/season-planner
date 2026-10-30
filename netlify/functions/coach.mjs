/* Setup Coach AI answers. Runs on Netlify only.
   Needs the environment variable ANTHROPIC_API_KEY (Netlify: Site configuration > Environment variables).
   Optional: COACH_MODEL (defaults to claude-haiku-5-5), COACH_DAILY_LIMIT (questions per visitor per day, default 20). */
const hits = new Map(); // best-effort per-visitor limit (resets when Netlify restarts the function)

const SYSTEM = `You are the Use More Kerb Setup Coach, an expert kart racing driver and engineer helping UK and European karters.
Answer the driver's problem concisely for a phone screen. Use these sections with short bullet points:
## Most likely cause
## Fix it with your driving
## Fix it with setup (owner karts only: list changes in the order to try them, one at a time, with a few words on why)
## Check first
Use general CIK-style sprint kart principles (track width, ride height, caster, camber, Ackermann, toe, seat position, axle stiffness, hub length, tyre pressures, torsion bars, gearing, carburation). Say when advice depends on the chassis maker.
If the driver is in a RENTAL kart, leave out the setup section entirely and focus on driving technique, body position, lines, braking and momentum.
Never invent specific numbers you are unsure of. If a problem could be a safety issue (brakes, steering, seizing engine, bent parts), say to stop and check the kart first.
Stay on karting. No preamble.`;

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: "AI answers aren't switched on yet." }, 503);

  let body; try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  const q = String(body.question || "").trim().slice(0, 600);
  if (q.length < 4) return json({ error: "Describe the problem in a few words." }, 400);
  const rental = body.mode === "rental";
  const conds = Array.isArray(body.conditions) ? body.conditions.filter(c => ["dry","wet","cold","hot"].includes(c)) : [];

  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "?";
  const day = new Date().toISOString().slice(0, 10), k = ip + "|" + day, n = (hits.get(k) || 0) + 1;
  const limit = +process.env.COACH_DAILY_LIMIT || 20;
  if (n > limit) return json({ error: "You've reached today's limit for AI answers. The guide still works." }, 429);
  hits.set(k, n); if (hits.size > 5000) hits.clear();

  const user = `Kart: ${rental ? "RENTAL kart (driving advice only, no setup)" : "owner kart"}.` +
    (conds.length ? ` Conditions: ${conds.join(", ")}.` : "") + `\nProblem: ${q}`;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.COACH_MODEL || "claude-haiku-5-5", max_tokens: 700, system: SYSTEM, messages: [{ role: "user", content: user }] })
    });
    const d = await r.json();
    if (!r.ok) return json({ error: "The AI coach is unavailable right now." }, 502);
    const answer = (d.content || []).filter(c => c.type === "text").map(c => c.text).join("\n").trim();
    return json({ answer });
  } catch (e) {
    return json({ error: "The AI coach is unavailable right now." }, 502);
  }
};

function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
