# 1. Connect WhatsApp first: your own WABA or coexistence, by API or MCP

Order of preference (the product follows the same order):
1. **Coexistence**: keep using the WhatsApp Business app on your phone and connect the same number to the API. Chats stay in the app and reach your agent.
2. **Your own WABA number** (a WhatsApp Business Account you already have; "dedicated" in Kapso's words).
3. **A brand-new pre-verified number**: has to be *bought*, so it is a paid extra and not the default. (Kapso's own docs say one free plan number exists; treat anything beyond that as paid and confirm the price with Kapso.)

We use [Kapso](https://kapso.ai), an official Meta WhatsApp developer platform (setup links, webhooks, REST API, MCP, CLI). Facts below come from docs.kapso.ai on 2026-11-16 and from our own mock tests; **not yet run against a live Kapso key**.

## Create a customer and a setup link (REST)
Base URL `https://api.kapso.ai`, header `X-API-Key: <project key>`.
```bash
# 1. one Kapso customer per business
curl -X POST https://api.kapso.ai/platform/v1/customers -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"customer":{"name":"Acme","external_customer_id":"agent-123"}}'        # -> data.id

# 2. a setup link that connects THEIR OWN number: coexistence or own WABA (no number is bought)
curl -X POST https://api.kapso.ai/platform/v1/customers/$CUSTOMER_ID/setup_links -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"setup_link":{"allowed_connection_types":["coexistence","dedicated"],"success_redirect_url":"https://you.example/done","failure_redirect_url":"https://you.example/failed"}}'   # -> data.url
```
Send `data.url` to the owner. They log in with Facebook, pick their WhatsApp Business account (about 5 minutes). For a bought pre-verified number add `"provision_phone_number": true` and `"allowed_connection_types":["dedicated"]` (US numbers; other countries need your own Twilio or Telnyx account).

## Know when they are connected
- Webhook event `whatsapp.phone_number.created` (payload has `phone_number_id` and `customer.id`), or
- the redirect to your `success_redirect_url` with `setup_link_id`, `status=completed`, `phone_number_id`, or
- poll `GET /platform/v1/customers/{id}/setup_links` and read `whatsapp_setup_status` (`pending`, `processing`, `completed`, `failed`).

## Receive and answer messages
- Event `whatsapp.message.received`, headers `X-Webhook-Event`, `X-Idempotency-Key`, and `X-Webhook-Signature` = HMAC-SHA256 (hex) of the **raw** body with your webhook secret. Compare timing-safely; answer 401 on mismatch.
- Text is at `message.text.body`, sender at `message.from`, number id at `phone_number_id`. Skip messages whose `message.kapso.direction` is not `inbound`.
- Reply: `POST https://api.kapso.ai/meta/whatsapp/v24.0/{phone_number_id}/messages` with `{"messaging_product":"whatsapp","to":"<digits>","type":"text","text":{"body":"..."}}`. Outside the 24-hour window only templates are allowed.
- A full working implementation (with tests against a mock Kapso) is in the product repo: `server/kapsoConnect.ts`; the human-side UI is `inbox/` here.

## MCP and CLI
- MCP server: `https://api.kapso.ai/mcp` (header `X-API-Key`). Add it to Claude Code with `claude mcp add --transport http kapso https://api.kapso.ai/mcp --header "X-API-Key: $KAPSO_API_KEY"`, or paste the URL and key into the "custom MCP" connector of Chat by BobChat.AI. Listed in Kapso's docs; **not yet tried by us with a key**.
- CLI: `npm i -g @kapso/cli`.
- Kapso also publishes agent skills (`github.com/gokapso/agent-skills`): no licence file, so we link to it and do not copy it.
