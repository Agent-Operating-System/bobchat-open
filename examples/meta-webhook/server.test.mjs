import test from "node:test"; import assert from "node:assert/strict"; import crypto from "node:crypto";
import { signatureOk, textMessages, createServer } from "./server.mjs";
const sign = (raw, secret) => "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
test("signature accepts the right secret only", () => { const raw = Buffer.from('{"a":1}'); assert.ok(signatureOk(raw, sign(raw, "s"), "s")); assert.ok(!signatureOk(raw, sign(raw, "x"), "s")); assert.ok(!signatureOk(raw, undefined, "s")); });
test("extracts text for Messenger and Instagram, skips echoes and non-text", () => {
  const b = (object, ev) => ({ object, entry: [{ messaging: [ev] }] });
  assert.deepEqual(textMessages(b("page", { sender: { id: "1" }, message: { mid: "m1", text: "hi" } })), [{ channel: "messenger", from: "1", text: "hi", mid: "m1" }]);
  assert.equal(textMessages(b("instagram", { sender: { id: "2" }, message: { mid: "m2", text: "yo" } }))[0].channel, "instagram");
  assert.equal(textMessages(b("page", { sender: { id: "1" }, message: { mid: "m3", text: "x", is_echo: true } })).length, 0);
  assert.equal(textMessages(b("page", { sender: { id: "1" }, message: { mid: "m4", attachments: [{}] } })).length, 0);
});
test("server: handshake, bad signature, good signature", async () => {
  const srv = createServer({ appSecret: "s", verifyToken: "vt", pageToken: "pt" }); await new Promise((r) => srv.listen(0, r)); const base = `http://127.0.0.1:${srv.address().port}`;
  assert.equal(await (await fetch(`${base}/webhook?hub.mode=subscribe&hub.verify_token=vt&hub.challenge=abc`)).text(), "abc");
  assert.equal((await fetch(`${base}/webhook?hub.mode=subscribe&hub.verify_token=no&hub.challenge=abc`)).status, 403);
  const raw = JSON.stringify({ object: "page", entry: [] });
  assert.equal((await fetch(`${base}/webhook`, { method: "POST", body: raw, headers: { "x-hub-signature-256": "sha256=bad" } })).status, 401);
  assert.equal((await fetch(`${base}/webhook`, { method: "POST", body: raw, headers: { "x-hub-signature-256": sign(raw, "s") } })).status, 200);
  srv.close();
});
