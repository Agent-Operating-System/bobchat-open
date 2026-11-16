import test from "node:test"; import assert from "node:assert/strict"; import crypto from "node:crypto";
import { signatureOk, textEvents, createServer } from "./server.mjs";
const sign = (raw, secret) => crypto.createHmac("sha256", secret).update(raw).digest("base64");
test("signature accepts the right secret only", () => { const raw = Buffer.from('{"events":[]}'); assert.ok(signatureOk(raw, sign(raw, "s"), "s")); assert.ok(!signatureOk(raw, sign(raw, "x"), "s")); assert.ok(!signatureOk(raw, undefined, "s")); });
test("keeps only text messages from users", () => {
  const ev = (o) => ({ type: "message", replyToken: "r", source: { type: "user", userId: "U1" }, webhookEventId: "e1", message: { type: "text", text: "hello" }, ...o });
  assert.equal(textEvents({ events: [ev({})] })[0].text, "hello");
  assert.equal(textEvents({ events: [ev({ message: { type: "sticker" } }), ev({ source: { type: "group" } }), ev({ type: "follow" })] }).length, 0);
});
test("server: bad signature 401, good 200", async () => {
  const srv = createServer({ channelSecret: "s", token: "t" }); await new Promise((r) => srv.listen(0, r)); const base = `http://127.0.0.1:${srv.address().port}/webhook`;
  const raw = JSON.stringify({ events: [] });
  assert.equal((await fetch(base, { method: "POST", body: raw, headers: { "x-line-signature": "bad" } })).status, 401);
  assert.equal((await fetch(base, { method: "POST", body: raw, headers: { "x-line-signature": sign(raw, "s") } })).status, 200);
  srv.close();
});
