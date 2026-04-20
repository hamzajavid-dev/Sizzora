# Sizzora Chatbot — Order-Taking & FAQ Design

**Date:** 2026-04-20  
**Status:** Approved

---

## 1. Problem Statement

The existing n8n "Sizzora Chatbot" workflow (id: `prYsFBw1Ut026BFC`) has several critical bugs:

- `Save User Message` node has no field mappings — fails silently on every message
- Two different Supabase credentials used inconsistently across nodes
- AI Agent has no system prompt — bot has no identity or ordering behaviour
- RAG used for everything, including order composition — wrong tool for structured data
- OpenRouter `openrouter/free` model is unreliable for structured output
- No cart state, no item validation, no server-side totals, no checkout flow

The chatbot must be rebuilt to reliably answer FAQs **and** take orders end-to-end.

---

## 2. Scope

**In scope:**
- Rebuild n8n Sizzora Chatbot workflow using Intent Router architecture
- Add `GET /api/products/chatbot` read-only Express endpoint
- Add `carts` and `cart_items` tables to Supabase
- Fix ChatWidget webhook integration (env var, response parsing)
- Order creation via existing MongoDB `Order` model at checkout

**Out of scope:**
- Payment processing (customer uploads proof via existing Orders page)
- POS integration
- WhatsApp / SMS channels
- Modifier groups / complex customisations (items have no modifiers in current schema)
- Guest user ordering (logged-in only)

---

## 3. Architecture

```
Customer (logged-in) types message
        ↓
ChatWidget → POST /webhook/sizzora-chat
    body: { message: string, sessionId: user.id, userName: user.name, userPhone: user.phone, userAddress: user.address }
        ↓
n8n: Intent Classifier LLM
    → intent: "faq" | "order_action" | "cart_view" | "checkout"
        ↓
Switch node routes to one of four paths:

PATH A — faq
    → Supabase Vector Store (RAG on sizzora_knowledge)
    → Format reply

PATH B — order_action
    → Action Extractor LLM (outputs structured JSON)
    → HTTP GET /api/products/chatbot (validate item + inStock)
    → Supabase upsert: carts + cart_items
    → Format confirmation reply

PATH C — cart_view
    → Supabase SELECT cart_items WHERE session_id = $sessionId
    → Format cart summary reply

PATH D — checkout
    → Supabase SELECT cart + cart_items
    → HTTP POST /api/orders (create MongoDB order)
    → Format reply with order ID + payment proof instructions
        ↓
Respond to Webhook { reply: "..." }
```

---

## 4. n8n Workflow Nodes

| Node | Type | Purpose |
|---|---|---|
| Webhook Trigger | Webhook | Receives POST at `/sizzora-chat` |
| Set Variables | Set | Extract `message`, `sessionId`, `userName`, `userPhone`, `userAddress` from body |
| Intent Classifier | LLM Chain | Returns `{ intent }` |
| Switch | Switch | Routes by intent value |
| Knowledge Base Tool | Supabase Vector Store | RAG for FAQ path |
| Action Extractor | LLM Chain | Returns JSON action for order_action path |
| Validate Item | HTTP Request | `GET /api/products/chatbot?name={{item_name}}` |
| Upsert Cart | Supabase | Create/update cart row |
| Upsert Cart Item | Supabase | Add/update/remove item in cart_items |
| Fetch Cart | Supabase | Read cart_items for cart_view and checkout |
| Create Order | HTTP Request | `POST /api/orders` with built payload |
| Format Reply (x4) | Set / Code | Compose human-readable reply string |
| Save Chat | Supabase | Append to `chat_history` (fixed field mappings) |
| Respond to Webhook | Respond to Webhook | Returns `{ reply }` |

**LLM:** OpenRouter `google/gemma-3-27b-it:free` (better instruction-following than `openrouter/free`)  
**Credentials:** All Supabase nodes use `Supabase account 2` (consistent)

---

## 5. Intent Classifier System Prompt

```
You are an intent classifier for Sizzora, a food ordering chatbot.
Classify the user message into exactly one of these intents:
- faq: general questions about menu, hours, prices, policies, ingredients
- order_action: adding items, removing items, changing quantity, setting delivery/pickup, providing address
- cart_view: asking to see current cart, order summary, what's in the basket
- checkout: confirming order, placing order, completing purchase, paying

Reply with ONLY valid JSON: { "intent": "<intent>" }
No explanation. No markdown.
```

---

## 6. Action Extractor System Prompt

```
You are an order action extractor for Sizzora food orders.
Extract the user's intent as structured JSON.

Supported actions:
- add_item: { "action": "add_item", "item_name": string, "qty": number, "notes": string }
- remove_item: { "action": "remove_item", "item_name": string }
- update_qty: { "action": "update_qty", "item_name": string, "qty": number }
- set_fulfillment: { "action": "set_fulfillment", "fulfillment_type": "delivery"|"pickup", "address": string|null }
- clear_cart: { "action": "clear_cart" }

Rules:
- qty must be a positive integer
- address is required when fulfillment_type is "delivery", null for pickup
- item_name should match menu item names as closely as possible
- If unsure of qty, default to 1

Reply with ONLY valid JSON. No explanation. No markdown.
```

---

## 7. Supabase Schema

```sql
-- Cart session per user
CREATE TABLE carts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       text NOT NULL UNIQUE,  -- = user._id from MongoDB
  customer_name    text,
  phone_number     text,
  status           text NOT NULL DEFAULT 'active',  -- 'active' | 'checked_out'
  fulfillment_type text,              -- 'delivery' | 'pickup'
  address          text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Items in cart
CREATE TABLE cart_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id      uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id   text NOT NULL,         -- MongoDB _id as string
  product_name text NOT NULL,
  qty          integer NOT NULL CHECK (qty > 0),
  unit_price   numeric(10,2) NOT NULL,
  line_total   numeric(10,2) GENERATED ALWAYS AS (qty * unit_price) STORED
);
```

---

## 8. New Express Endpoint

**File:** `server/routes/products.js`

```
GET /api/products/chatbot?name=<search_term>

Response: [{ _id, name, price, inStock, category }]
```

- No authentication required (menu is public information)
- Optional `name` query param for fuzzy search (case-insensitive regex)
- Returns all in-stock items if no name param
- n8n uses this to validate item exists + is in stock before adding to cart

---

## 9. Checkout Flow

1. n8n fetches cart + cart_items for `sessionId`
2. Validates cart is not empty and fulfillment_type is set
3. Calculates `totalAmount` = sum of all `line_total`
4. Builds order payload:
   ```json
   {
     "user": "<sessionId>",
     "items": [{ "product": "<product_id>", "quantity": 2, "price": 12.99 }],
     "totalAmount": 25.98,
     "shippingAddress": "<address or 'Pickup'>",
     "customerName": "<cart.customer_name (from webhook userName)>",
     "phoneNumber": "<cart.phone_number (from webhook userPhone)>",
     "paymentMethod": "Payment Proof"
   }
   ```
5. POSTs to `POST /api/orders`
6. Marks cart status as `checked_out`
7. Replies: "Your order #ORD-XXXXX has been placed! Total: £X.XX. Please upload your payment proof in the Orders section to confirm."

---

## 10. Error Handling

| Scenario | n8n Response |
|---|---|
| Item not found in DB | "Sorry, I couldn't find [item] on our menu. Try browsing the menu page or ask me what's available." |
| Multiple items match | List matching items by name + price, ask "Which one did you mean?" |
| Phone number empty at checkout | "What's your phone number for the order?" — store in cart before proceeding |
| Item out of stock | "[item] is currently out of stock. Can I suggest something else?" |
| Empty cart at checkout | "Your cart is empty. Add some items first!" |
| Missing address for delivery | "Please provide your delivery address before checking out." |
| Order creation fails | "Something went wrong placing your order. Please try again or contact support." |
| RAG returns no results | "I don't have information on that. Please contact us directly." |

---

## 11. ChatWidget Fix

**File:** `client/src/components/ChatWidget.jsx`

One change required — the webhook payload must include user context fields so n8n can populate the cart and order without additional API calls:

```js
// Before
const payload = { message: txt, sessionId: getSessionId() };

// After
const payload = {
  message: txt,
  sessionId: user.id,
  userName: user.name,
  userPhone: user.phone || '',
  userAddress: user.address || '',
};
```

Response parsing (`r.data?.reply`) is correct and unchanged. Env var `VITE_N8N_CHATBOT_WEBHOOK` must be set in Vercel to the production webhook URL.

---

## 12. What Is NOT Changed

- ChatWidget UI (no visual changes)
- MongoDB schemas (Order, Product, User, Chat — all unchanged)
- Existing chat routes (`/api/chat/*`) — human support chat unchanged
- Supabase `sizzora_knowledge` table and ingestion workflow — unchanged
- Auth system — unchanged
