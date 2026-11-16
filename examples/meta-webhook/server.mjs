// Messenger + Instagram DM webhook, no dependencies (Node 18+).
// Both channels use Meta's Messenger Platform webhook shape: verify the GET handshake, check X-Hub-Signature-256 on every POST, reply through the Graph API.
// Env: APP_SECRET (Meta app secret), VERIFY_TOKEN (any string you also type in the Meta dashboard), PAGE_TOKEN (Page access token; for Instagram use the token of the Page linked to the account).
import http from "node:http";
import crypto from "node:crypto";

export function signatureOk(raw, header, appSecret) {
  if (!Buffer.isBuffer(raw) || typeof header !== "string" || !appSecret) return false;
  const want = Buffer.from("sha256=" + crypto.createHmac("sha256", appSecret).update(raw).digest("hex"));
  const got = Buffer.from(header);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

/** Pull the text messages out of a webhook body (object is "page" for Messenger and "instagram" for Instagram). Echoes of our own messages are skipped. */
export function textMessages(body) {
  const out = [];
  for (const entry of body?.entry || []) for (const ev of entry.messaging || []) {
    if (!ev?.message?.text || ev.message.is_echo) continue;
    out.push({ channel: body.object === "instagram" ? "instagram" : "messenger", from: ev.sender?.id, text: ev.message.text, mid: ev.message.mid });
  }
  return out;
}

async function reply(pageToken, to, text) {
  const r = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(pageToken)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: to }, messaging_type: "RESPONSE", message: { text: text.slice(0, 1900) } }),
  });
  if (!r.ok) console.warn("send failed", r.status, (await r.text()).slice(0, 200));
}

/** Put your agent here: return the reply text. */
export async function answer(msg) { return `Thanks for your message on ${msg.channel}: "${msg.text.slice(0, 80)}". A person will follow up.`; }

export function createServer({ appSecret = process.env.APP_SECRET, verifyToken = process.env.VERIFY_TOKEN, pageToken = process.env.PAGE_TOKEN } = {}) {
  const seen = new Set();
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    if (req.method === "GET" && url.pathname === "/webhook") {      // Meta's one-time handshake
      if (url.searchParams.get("hub.mode") === "subscribe" && verifyToken && url.searchParams.get("hub.verify_token") === verifyToken) { res.writeHead(200).end(url.searchParams.get("hub.challenge") || ""); return; }
      res.writeHead(403).end(); return;
    }
    if (req.method === "POST" && url.pathname === "/webhook") {
      const chunks = []; for await (const c of req) chunks.push(c); const raw = Buffer.concat(chunks);
      if (!signatureOk(raw, req.headers["x-hub-signature-256"], appSecret)) { res.writeHead(401).end(); return; }
      res.writeHead(200).end("ok");                                  // answer fast, work after
      let body; try { body = JSON.parse(raw.toString("utf8")); } catch { return; }
      for (const m of textMessages(body)) { if (m.mid && seen.has(m.mid)) continue; if (m.mid) seen.add(m.mid); try { await reply(pageToken, m.from, await answer(m)); } catch (e) { console.warn(e.message); } }
      return;
    }
    res.writeHead(404).end();
  });
}
if (import.meta.url === `file://${process.argv[1]}`) createServer().listen(process.env.PORT || 3000, () => console.log("meta webhook on", process.env.PORT || 3000));
