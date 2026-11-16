# 3. LINE Official Account

One small server: [`examples/line-webhook`](../examples/line-webhook).

## One-time setup (LINE side)
1. Create a LINE Official Account at manager.line.biz (free) and enable the **Messaging API**.
2. In the LINE Developers console open that channel: copy the **Channel secret** (Basic settings) and issue a long-lived **Channel access token** (Messaging API tab).
3. Messaging API tab: set the webhook URL to `https://your.host/webhook`, press **Verify**, turn **Use webhook** on, and turn **Auto-reply messages** off so only your agent answers.

## What the example does
- `POST /webhook`: checks `X-Line-Signature` (base64 HMAC-SHA256 of the raw body with the channel secret), answers 200 at once, then replies with the free Reply API (`POST https://api.line.me/v2/bot/message/reply`, using the event's `replyToken`). Only text messages from one-to-one chats are answered; repeated event ids are ignored.
- Replace `answer()` with your agent.

Run: `CHANNEL_SECRET=... CHANNEL_ACCESS_TOKEN=... node examples/line-webhook/server.mjs`. Tests: `node --test examples/line-webhook/server.test.mjs`.

## Honest limits
- Reply tokens expire quickly and can be used once; pushing a message later uses the Push API, which counts against your plan's message quota.
- Tested here: signature check and event parsing with unit tests. **Not tested against a live LINE channel** (the product repo has the same logic running in production code, `server/lineConnect.ts`, but that was also checked only with unit tests and a local run).
- No open-source inbox UI for LINE is bundled; `chatwoot/chatwoot` has a LINE channel (see the licence note in the Meta guide).
