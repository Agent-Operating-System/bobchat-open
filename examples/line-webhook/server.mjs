// LINE Official Account webhook, no dependencies (Node 18+). Verify X-Line-Signature, answer with the free Reply API.
// Env: CHANNEL_SECRET, CHANNEL_ACCESS_TOKEN (long-lived token), both from the LINE Developers console (Messaging API channel).
import http from "node:http";
import crypto from "node:crypto";

export function signatureOk(raw, header, secret) {
  if (!Buffer.isBuffer(raw) || typeof header !== "string" || !secret) return false;
  const want = crypto.createHmac("sha256", secret).update(raw).digest();
  let got; try { got = Buffer.from(header, "base64"); } catch { return false; }
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}
export function textEvents(body) {
  return (body?.events || []).filter((e) => e.type === "message" && e.message?.type === "text" && e.replyToken && e.source?.type === "user")
    .map((e) => ({ replyToken: e.replyToken, from: e.source.userId, text: e.message.text, id: e.webhookEventId }));
}
async function reply(token, replyToken, text) {
  const r = await fetch("https://api.line.me/v2/bot/message/reply", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ replyToken, messages: [{ type: "text", text: text.slice(0, 4500) }] }) });
  if (!r.ok) console.warn("reply failed", r.status);
}
/** Put your agent here: return the reply text. */
export async function answer(ev) { return `Thanks for your message: "${ev.text.slice(0, 80)}". A person will follow up.`; }

export function createServer({ channelSecret = process.env.CHANNEL_SECRET, token = process.env.CHANNEL_ACCESS_TOKEN } = {}) {
  const seen = new Set();
  return http.createServer(async (req, res) => {
    if (req.method !== "POST" || new URL(req.url, "http://x").pathname !== "/webhook") { res.writeHead(404).end(); return; }
    const chunks = []; for await (const c of req) chunks.push(c); const raw = Buffer.concat(chunks);
    if (!signatureOk(raw, req.headers["x-line-signature"], channelSecret)) { res.writeHead(401).end(); return; }
    res.writeHead(200).end("ok");
    let body; try { body = JSON.parse(raw.toString("utf8")); } catch { return; }
    for (const ev of textEvents(body)) { if (ev.id && seen.has(ev.id)) continue; if (ev.id) seen.add(ev.id); try { await reply(token, ev.replyToken, await answer(ev)); } catch (e) { console.warn(e.message); } }
  });
}
if (import.meta.url === `file://${process.argv[1]}`) createServer().listen(process.env.PORT || 3000, () => console.log("line webhook on", process.env.PORT || 3000));
