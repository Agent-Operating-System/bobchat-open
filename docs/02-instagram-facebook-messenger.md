# 2. Instagram and Facebook Messenger (Meta Messenger Platform)

Both use the same Meta webhook and the same send API, so one small server covers both: [`examples/meta-webhook`](../examples/meta-webhook).

## One-time setup (Meta side)
1. Create an app at developers.facebook.com (type: Business) and add the **Messenger** product. For Instagram, also add Instagram messaging and connect an Instagram **professional** account to a Facebook Page.
2. Generate a **Page access token** for the Page. Keep your **App secret** (Settings > Basic).
3. Set the webhook URL to `https://your.host/webhook` and a verify token you choose (it must equal `VERIFY_TOKEN`). Subscribe to `messages` for the Page (object `page`) and for Instagram (object `instagram`).
4. In development only app roles can message the Page. Going live needs Meta App Review for the messaging permissions. Check Meta's current docs for permission names and the Graph API version: they change.

## What the example does
- `GET /webhook`: answers Meta's handshake (`hub.mode`, `hub.verify_token`, `hub.challenge`).
- `POST /webhook`: checks `X-Hub-Signature-256` (`sha256=` + HMAC-SHA256 of the raw body with the app secret), answers 200 at once, then replies with `POST https://graph.facebook.com/v21.0/me/messages` (`messaging_type: RESPONSE`). Echoes of your own messages are skipped; repeated message ids are ignored.
- Replace `answer()` with your agent.

Run: `APP_SECRET=... VERIFY_TOKEN=... PAGE_TOKEN=... node examples/meta-webhook/server.mjs`. Tests: `node --test examples/meta-webhook/server.test.mjs`.

## Honest limits
- Replies are allowed inside Meta's 24-hour window after the customer's last message; later messages need an approved tag or flow.
- Tested here: signature check, handshake and message parsing with unit tests. **Not tested against a live Meta app.**
- No open-source *inbox UI* for these two is bundled. If you want one, `chatwoot/chatwoot` supports Facebook and Instagram, but it is heavy to host and its licence needs reading (MIT plus an enterprise folder).
