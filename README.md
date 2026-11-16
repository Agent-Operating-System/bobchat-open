# Chat by BobChat.AI: open toolkit for connecting customer channels

Small, readable pieces for connecting an AI agent to the channels customers actually use. Copy what you need.

| # | Channel | How | In this repo | Status |
|---|---|---|---|---|
| 1 | **WhatsApp** (first) | Official API through Kapso: your own WABA, or coexistence with the WhatsApp Business app. REST, MCP, CLI. A brand-new pre-verified number is bought, so it is second. | [`docs/01`](docs/01-whatsapp-waba-coexistence-api-mcp.md), [`inbox/`](inbox) (open WhatsApp inbox), [`examples/whatsapp-support-agent`](examples/whatsapp-support-agent) | Inbox builds. Not run against a live Kapso key yet. |
| 2 | **Instagram + Facebook Messenger** | Meta Messenger Platform webhook + Graph API | [`docs/02`](docs/02-instagram-facebook-messenger.md), [`examples/meta-webhook`](examples/meta-webhook) | Unit tests pass. Not run against a live Meta app. |
| 3 | **LINE** | LINE Messaging API webhook + Reply API | [`docs/03`](docs/03-line.md), [`examples/line-webhook`](examples/line-webhook) | Unit tests pass. Not run against a live LINE channel. |

Rule we followed: only what exists in the open is here. Where there is no maintained open inbox UI (Instagram, Facebook, LINE) we say so instead of faking one.

## Try it
```bash
node --test examples/meta-webhook/server.test.mjs examples/line-webhook/server.test.mjs     # signature + parsing tests, Node 18+
cd inbox && npm install && KAPSO_API_KEY=... INBOX_AUTH_USERNAME=... INBOX_AUTH_PASSWORD=... npm run dev   # open WhatsApp inbox (needs a Kapso key)
```

## Licences
Our code: MIT (`LICENSE`). Copied third-party code (MIT, unchanged, their licence files kept) is listed in [`THIRD_PARTY.md`](THIRD_PARTY.md).

## Product
The hosted product is Chat by BobChat.AI (chat.bobwork.ai). This repo is the open part.
