# Sizzora Chatbot Order-Taking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Sizzora n8n chatbot workflow from a broken RAG-only bot into a reliable Intent Router that answers FAQs via RAG and takes orders end-to-end via structured JSON actions and MongoDB/Supabase.

**Architecture:** The frontend ChatWidget sends `{ message, sessionId, userName, userPhone, userAddress }` to the n8n webhook. n8n classifies intent (faq / order_action / cart_view / checkout) and routes to the appropriate path. Order state lives in Supabase (`carts` + `cart_items`). MongoDB orders are created at checkout via a new chatbot-specific Express endpoint secured with a shared secret.

**Tech Stack:** n8n (MCP), Express/MongoDB (backend), Supabase (cart state + vector RAG), React (ChatWidget), OpenRouter (LLM via existing credential), Google Gemini Embeddings (existing credential)

**Existing n8n workflow ID to replace:** `prYsFBw1Ut026BFC`  
**Supabase credential ID:** `CBHMjfCAHYqzYIjh` (Supabase account 2)  
**OpenRouter credential ID:** `Gwo0U12uSolb6ES5`  
**Google Gemini credential ID:** `QyrMJO2yQsTMxG8I`  
**Webhook path to keep:** `sizzora-chat` (webhookId: `2aade149-2c62-4e88-8507-16a011f1d07d`)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `server/routes/products.js` | Modify | Add `GET /api/products/chatbot` public endpoint |
| `server/routes/orders.js` | Modify | Add `POST /api/orders/chatbot` server-to-server endpoint |
| `client/src/components/ChatWidget.jsx` | Modify | Send user context fields in AI webhook payload |
| Supabase SQL editor | Create tables | `carts` and `cart_items` schema |
| n8n workflow `prYsFBw1Ut026BFC` | Replace | Complete Intent Router workflow |

---

## Task 1: Add `/api/products/chatbot` Express Endpoint

**Files:**
- Modify: `server/routes/products.js` (add before the `/:id` route)

- [ ] **Step 1.1: Add the chatbot products endpoint**

Open `server/routes/products.js`. Insert this block **before** the `router.get('/:id', ...)` route (around line 45, after the `GET /` route):

```js
// Chatbot menu lookup (public, read-only)
router.get('/chatbot', async (req, res) => {
    try {
        const query = { inStock: true };
        if (req.query.name) {
            query.name = { $regex: req.query.name, $options: 'i' };
        }
        const products = await Product.find(query).select('_id name price category inStock').lean();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
```

- [ ] **Step 1.2: Verify the endpoint comes before `/:id`**

In `server/routes/products.js`, confirm `router.get('/chatbot', ...)` appears BEFORE `router.get('/:id', ...)`. If it comes after, Express will try to match `chatbot` as an ID param and throw a CastError. The order must be:
1. `/trending`
2. `/chatbot`  ← new
3. `/` (get all)
4. `/:id`

- [ ] **Step 1.3: Commit**

```bash
git add server/routes/products.js
git commit -m "feat: add GET /api/products/chatbot for chatbot item lookup"
```

---

## Task 2: Add `/api/orders/chatbot` Express Endpoint

**Files:**
- Modify: `server/routes/orders.js`

This is a server-to-server endpoint (called from n8n). It skips cookie auth and instead validates a shared secret header. The secret prevents public abuse.

- [ ] **Step 2.1: Add the chatbot order endpoint**

Open `server/routes/orders.js`. Add this block after the `require` statements and before the first `router.post` or `router.get`:

```js
// Chatbot order creation (server-to-server, secured with shared secret)
router.post('/chatbot', express.json(), async (req, res) => {
    const secret = req.headers['x-chatbot-secret'];
    if (!secret || secret !== process.env.CHATBOT_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const { userId, items, totalAmount, shippingAddress, customerName, phoneNumber } = req.body;
        if (!items || !items.length || !totalAmount || !shippingAddress || !customerName || !phoneNumber) {
            return res.status(400).json({ error: 'Missing required order fields' });
        }
        const order = new Order({
            user: userId || 'guest',
            items,
            totalAmount,
            shippingAddress,
            customerName,
            phoneNumber,
            paymentMethod: 'Payment Proof',
            status: 'pending'
        });
        await order.save();
        res.status(201).json({ orderId: order._id, totalAmount: order.totalAmount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
```

Note: `express` is already imported via the router. The `Order` model is already required at the top of this file.

- [ ] **Step 2.2: Set the CHATBOT_SECRET environment variable**

Add to your `.env` file (local dev) and Vercel environment variables (production):

```
CHATBOT_SECRET=sizzora-chatbot-secret-2026
```

Use any strong random string. This same value will be set in the n8n HTTP Request node header.

- [ ] **Step 2.3: Commit**

```bash
git add server/routes/orders.js
git commit -m "feat: add POST /api/orders/chatbot server-to-server endpoint"
```

---

## Task 3: Update ChatWidget Webhook Payload

**Files:**
- Modify: `client/src/components/ChatWidget.jsx` (around line 224)

- [ ] **Step 3.1: Replace the payload in `sendAiMsg`**

Find this block (around line 229):

```js
        try {
            const payload = { message: txt, sessionId: getSessionId() };
            const r = await axios.post(N8N_CHATBOT_WEBHOOK, payload, {
                withCredentials: false,
            });
```

Replace with:

```js
        try {
            const payload = {
                message: txt,
                sessionId: user?.id || user?._id || getSessionId(),
                userName: user?.name || 'Customer',
                userPhone: user?.phone || '',
                userAddress: user?.address || '',
            };
            const r = await axios.post(N8N_CHATBOT_WEBHOOK, payload, {
                withCredentials: false,
            });
```

- [ ] **Step 3.2: Commit**

```bash
git add client/src/components/ChatWidget.jsx
git commit -m "feat: send user context (name, phone, address) in chatbot webhook payload"
```

---

## Task 4: Create Supabase Tables

Open the Supabase dashboard → SQL Editor and run the following SQL.

- [ ] **Step 4.1: Create `carts` table**

```sql
CREATE TABLE IF NOT EXISTS carts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       text NOT NULL UNIQUE,
  customer_name    text,
  phone_number     text,
  status           text NOT NULL DEFAULT 'active',
  fulfillment_type text,
  address          text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
```

- [ ] **Step 4.2: Create `cart_items` table**

```sql
CREATE TABLE IF NOT EXISTS cart_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id      uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id   text NOT NULL,
  product_name text NOT NULL,
  qty          integer NOT NULL CHECK (qty > 0),
  unit_price   numeric(10,2) NOT NULL,
  line_total   numeric(10,2) GENERATED ALWAYS AS (qty * unit_price) STORED,
  UNIQUE (cart_id, product_id)
);
```

The `UNIQUE (cart_id, product_id)` constraint enables Supabase upsert (add or update quantity) without duplicating items.

- [ ] **Step 4.3: Verify tables exist**

Run in SQL editor:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('carts', 'cart_items');
```

Expected: 2 rows returned.

---

## Task 5: Deploy Rebuilt n8n Sizzora Chatbot Workflow

This replaces the broken workflow `prYsFBw1Ut026BFC` with the full Intent Router.

**Replace `YOUR_API_BASE_URL` below with your actual Vercel deployment URL (e.g., `https://sizzora.vercel.app`).**
**Replace `YOUR_CHATBOT_SECRET` with the value you set in Task 2.2.**

- [ ] **Step 5.1: Deploy the complete workflow via n8n MCP**

Call `mcp__n8n-mcp__n8n_update_full_workflow` with id `prYsFBw1Ut026BFC` and the following workflow definition:

```json
{
  "name": "Sizzora Chatbot",
  "active": true,
  "settings": { "executionOrder": "v1" },
  "nodes": [
    {
      "id": "wh1",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [240, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "sizzora-chat",
        "responseMode": "responseNode",
        "options": {}
      },
      "webhookId": "2aade149-2c62-4e88-8507-16a011f1d07d"
    },
    {
      "id": "sv1",
      "name": "Set Variables",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [460, 300],
      "parameters": {
        "mode": "manual",
        "duplicateItem": false,
        "assignments": {
          "assignments": [
            { "id": "a1", "name": "message",     "value": "={{ $json.body.message }}",              "type": "string" },
            { "id": "a2", "name": "sessionId",   "value": "={{ $json.body.sessionId }}",            "type": "string" },
            { "id": "a3", "name": "userName",    "value": "={{ $json.body.userName || 'Customer' }}", "type": "string" },
            { "id": "a4", "name": "userPhone",   "value": "={{ $json.body.userPhone || '' }}",      "type": "string" },
            { "id": "a5", "name": "userAddress", "value": "={{ $json.body.userAddress || '' }}",    "type": "string" }
          ]
        },
        "options": {}
      }
    },
    {
      "id": "ic1",
      "name": "Intent Classifier",
      "type": "@n8n/n8n-nodes-langchain.chainLlm",
      "typeVersion": 1.4,
      "position": [680, 300],
      "parameters": {
        "promptType": "define",
        "text": "={{ $json.message }}",
        "messages": {
          "messageValues": [
            {
              "type": "system",
              "message": "You are an intent classifier for Sizzora, a food ordering chatbot.\nClassify the user message into exactly one of these intents:\n- faq: general questions about menu, hours, prices, policies, ingredients, availability\n- order_action: adding items, removing items, changing quantity, setting delivery or pickup, providing address\n- cart_view: asking to see current cart, basket, order summary\n- checkout: confirming order, placing order, completing purchase\n\nReply with ONLY valid JSON: { \"intent\": \"<intent>\" }\nNo explanation. No markdown. No code blocks."
            }
          ]
        }
      }
    },
    {
      "id": "llm_ic",
      "name": "LLM Intent",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenRouter",
      "typeVersion": 1,
      "position": [680, 500],
      "parameters": {
        "model": "google/gemma-3-27b-it:free",
        "options": {}
      },
      "credentials": {
        "openRouterApi": { "id": "Gwo0U12uSolb6ES5", "name": "OpenRouter account" }
      }
    },
    {
      "id": "pi1",
      "name": "Parse Intent",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 300],
      "parameters": {
        "jsCode": "const raw = $input.first().json.output || '';\nlet intent = 'faq';\ntry {\n  const cleaned = raw.replace(/```json\\n?|```\\n?/g, '').trim();\n  const parsed = JSON.parse(cleaned);\n  if (['faq','order_action','cart_view','checkout'].includes(parsed.intent)) {\n    intent = parsed.intent;\n  }\n} catch(e) {}\nconst vars = $('Set Variables').first().json;\nreturn [{ json: { ...vars, intent } }];"
      }
    },
    {
      "id": "sw1",
      "name": "Route by Intent",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [1120, 300],
      "parameters": {
        "mode": "rules",
        "rules": {
          "values": [
            {
              "conditions": { "conditions": [{ "leftValue": "={{ $json.intent }}", "rightValue": "faq", "operator": { "type": "string", "operation": "equals" } }], "combinator": "and" },
              "renameOutput": true, "outputKey": "faq"
            },
            {
              "conditions": { "conditions": [{ "leftValue": "={{ $json.intent }}", "rightValue": "order_action", "operator": { "type": "string", "operation": "equals" } }], "combinator": "and" },
              "renameOutput": true, "outputKey": "order_action"
            },
            {
              "conditions": { "conditions": [{ "leftValue": "={{ $json.intent }}", "rightValue": "cart_view", "operator": { "type": "string", "operation": "equals" } }], "combinator": "and" },
              "renameOutput": true, "outputKey": "cart_view"
            },
            {
              "conditions": { "conditions": [{ "leftValue": "={{ $json.intent }}", "rightValue": "checkout", "operator": { "type": "string", "operation": "equals" } }], "combinator": "and" },
              "renameOutput": true, "outputKey": "checkout"
            }
          ]
        },
        "options": { "fallbackOutput": "none" }
      }
    },
    {
      "id": "faq_agent",
      "name": "FAQ Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.7,
      "position": [1340, 100],
      "parameters": {
        "promptType": "define",
        "text": "={{ $('Set Variables').item.json.message }}",
        "options": {
          "systemMessage": "You are Sizzora AI, the helpful assistant for Sizzora restaurant. Answer questions about the menu, prices, ingredients, hours, delivery, and policies using your knowledge base tool. Be friendly, concise, and end with a helpful suggestion. Do not make up prices or items not in the knowledge base."
        }
      }
    },
    {
      "id": "llm_faq",
      "name": "LLM FAQ",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenRouter",
      "typeVersion": 1,
      "position": [1140, 280],
      "parameters": { "model": "google/gemma-3-27b-it:free", "options": {} },
      "credentials": { "openRouterApi": { "id": "Gwo0U12uSolb6ES5", "name": "OpenRouter account" } }
    },
    {
      "id": "mem_faq",
      "name": "Memory FAQ",
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.2,
      "position": [1340, 280],
      "parameters": {
        "sessionIdType": "customKey",
        "sessionKey": "={{ $('Set Variables').item.json.sessionId }}",
        "contextWindowLength": 10
      }
    },
    {
      "id": "kb_tool",
      "name": "Knowledge Base",
      "type": "@n8n/n8n-nodes-langchain.vectorStoreSupabase",
      "typeVersion": 1,
      "position": [1540, 280],
      "parameters": {
        "mode": "retrieve-as-tool",
        "toolName": "knowledge_base",
        "toolDescription": "Search Sizzora menu, products, prices, categories, restaurant hours, delivery info and FAQs",
        "tableName": { "__rl": true, "value": "sizzora_knowledge", "mode": "list", "cachedResultName": "sizzora_knowledge" },
        "topK": 5,
        "options": {}
      },
      "credentials": { "supabaseApi": { "id": "CBHMjfCAHYqzYIjh", "name": "Supabase account 2" } }
    },
    {
      "id": "emb1",
      "name": "Embeddings",
      "type": "@n8n/n8n-nodes-langchain.embeddingsGoogleGemini",
      "typeVersion": 1,
      "position": [1540, 460],
      "parameters": {},
      "credentials": { "googlePalmApi": { "id": "QyrMJO2yQsTMxG8I", "name": "Google Gemini(PaLM) Api account 2" } }
    },
    {
      "id": "faq_reply",
      "name": "FAQ Reply",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [1760, 100],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [{ "id": "r1", "name": "reply", "value": "={{ $json.output }}", "type": "string" }]
        },
        "options": {}
      }
    },
    {
      "id": "ae1",
      "name": "Action Extractor",
      "type": "@n8n/n8n-nodes-langchain.chainLlm",
      "typeVersion": 1.4,
      "position": [1340, 500],
      "parameters": {
        "promptType": "define",
        "text": "={{ $('Set Variables').item.json.message }}",
        "messages": {
          "messageValues": [
            {
              "type": "system",
              "message": "You are an order action extractor for Sizzora food orders.\nExtract the user intent as structured JSON.\n\nSupported actions:\n- add_item: { \"action\": \"add_item\", \"item_name\": string, \"qty\": number, \"notes\": string }\n- remove_item: { \"action\": \"remove_item\", \"item_name\": string }\n- update_qty: { \"action\": \"update_qty\", \"item_name\": string, \"qty\": number }\n- set_fulfillment: { \"action\": \"set_fulfillment\", \"fulfillment_type\": \"delivery\" or \"pickup\", \"address\": string or null }\n- clear_cart: { \"action\": \"clear_cart\" }\n\nRules:\n- qty must be a positive integer, default 1 if not specified\n- address required for delivery, null for pickup\n- item_name should match menu item names as closely as possible\n\nReply with ONLY valid JSON. No explanation. No markdown. No code blocks."
            }
          ]
        }
      }
    },
    {
      "id": "llm_ae",
      "name": "LLM Action",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenRouter",
      "typeVersion": 1,
      "position": [1340, 680],
      "parameters": { "model": "google/gemma-3-27b-it:free", "options": {} },
      "credentials": { "openRouterApi": { "id": "Gwo0U12uSolb6ES5", "name": "OpenRouter account" } }
    },
    {
      "id": "pa1",
      "name": "Parse Action",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1560, 500],
      "parameters": {
        "jsCode": "const raw = $input.first().json.output || '';\nlet action = null;\ntry {\n  const cleaned = raw.replace(/```json\\n?|```\\n?/g, '').trim();\n  action = JSON.parse(cleaned);\n} catch(e) { action = { action: 'add_item', item_name: '', qty: 1, notes: '' }; }\nconst vars = $('Set Variables').first().json;\nconst needsLookup = ['add_item','update_qty'].includes(action.action);\nreturn [{ json: { ...vars, action, needsLookup } }];"
      }
    },
    {
      "id": "if_lookup",
      "name": "Needs Item Lookup",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [1780, 500],
      "parameters": {
        "conditions": {
          "conditions": [{ "leftValue": "={{ $json.needsLookup }}", "rightValue": true, "operator": { "type": "boolean", "operation": "true" } }],
          "combinator": "and"
        },
        "options": {}
      }
    },
    {
      "id": "http_item",
      "name": "Validate Item",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [2000, 400],
      "parameters": {
        "method": "GET",
        "url": "=YOUR_API_BASE_URL/api/products/chatbot",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [{ "name": "name", "value": "={{ $json.action.item_name }}" }]
        },
        "options": {}
      }
    },
    {
      "id": "code_item_result",
      "name": "Process Item Result",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2220, 400],
      "parameters": {
        "jsCode": "const items = $input.all().map(i => i.json);\nconst action = $('Parse Action').first().json.action;\nconst vars = $('Set Variables').first().json;\n\nif (items.length === 0) {\n  return [{ json: { ...vars, action, resultType: 'not_found', reply: `Sorry, I couldn't find \"${action.item_name}\" on our menu. Try asking me what's available!` } }];\n}\nif (items.length > 1) {\n  const list = items.map(p => `- ${p.name} (£${p.price.toFixed(2)})`).join('\\n');\n  return [{ json: { ...vars, action, resultType: 'ambiguous', reply: `I found a few matches for \"${action.item_name}\":\\n${list}\\nWhich one would you like?` } }];\n}\nconst product = items[0];\nif (!product.inStock) {\n  return [{ json: { ...vars, action, resultType: 'out_of_stock', reply: `${product.name} is currently out of stock. Can I suggest something else?` } }];\n}\nreturn [{ json: { ...vars, action, resultType: 'found', product } }];"
      }
    },
    {
      "id": "if_found",
      "name": "Item Found",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [2440, 400],
      "parameters": {
        "conditions": {
          "conditions": [{ "leftValue": "={{ $json.resultType }}", "rightValue": "found", "operator": { "type": "string", "operation": "equals" } }],
          "combinator": "and"
        },
        "options": {}
      }
    },
    {
      "id": "supa_upsert_cart",
      "name": "Upsert Cart",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [2660, 340],
      "parameters": {
        "operation": "upsert",
        "tableId": "carts",
        "fieldsUi": {
          "fieldValues": [
            { "fieldId": "session_id",    "fieldValue": "={{ $json.sessionId }}" },
            { "fieldId": "customer_name", "fieldValue": "={{ $json.userName }}" },
            { "fieldId": "phone_number",  "fieldValue": "={{ $json.userPhone }}" },
            { "fieldId": "status",        "fieldValue": "active" },
            { "fieldId": "updated_at",    "fieldValue": "={{ new Date().toISOString() }}" }
          ]
        }
      },
      "credentials": { "supabaseApi": { "id": "CBHMjfCAHYqzYIjh", "name": "Supabase account 2" } }
    },
    {
      "id": "supa_upsert_item",
      "name": "Upsert Cart Item",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [2880, 340],
      "parameters": {
        "operation": "upsert",
        "tableId": "cart_items",
        "fieldsUi": {
          "fieldValues": [
            { "fieldId": "cart_id",      "fieldValue": "={{ $('Upsert Cart').item.json.id }}" },
            { "fieldId": "product_id",   "fieldValue": "={{ $('Process Item Result').item.json.product._id }}" },
            { "fieldId": "product_name", "fieldValue": "={{ $('Process Item Result').item.json.product.name }}" },
            { "fieldId": "qty",          "fieldValue": "={{ $('Process Item Result').item.json.action.qty || 1 }}" },
            { "fieldId": "unit_price",   "fieldValue": "={{ $('Process Item Result').item.json.product.price }}" }
          ]
        }
      },
      "credentials": { "supabaseApi": { "id": "CBHMjfCAHYqzYIjh", "name": "Supabase account 2" } }
    },
    {
      "id": "set_item_reply",
      "name": "Item Added Reply",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [3100, 340],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [{ "id": "r1", "name": "reply", "value": "={{ `✅ Added ${$('Process Item Result').item.json.action.qty || 1}x ${$('Process Item Result').item.json.product.name} (£${$('Process Item Result').item.json.product.price.toFixed(2)} each) to your cart. Say 'checkout' when ready or keep adding items!` }}", "type": "string" }]
        },
        "options": {}
      }
    },
    {
      "id": "set_item_error_reply",
      "name": "Item Error Reply",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [2660, 480],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [{ "id": "r1", "name": "reply", "value": "={{ $json.reply }}", "type": "string" }]
        },
        "options": {}
      }
    },
    {
      "id": "code_no_lookup",
      "name": "Handle Non-Lookup Action",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2000, 580],
      "parameters": {
        "jsCode": "const { action, sessionId, userName, userPhone, userAddress } = $input.first().json;\nreturn [{ json: { action, sessionId, userName, userPhone, userAddress, actionType: action.action } }];"
      }
    },
    {
      "id": "sw_action",
      "name": "Switch Action Type",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3.2,
      "position": [2220, 580],
      "parameters": {
        "mode": "rules",
        "rules": {
          "values": [
            {
              "conditions": { "conditions": [{ "leftValue": "={{ $json.actionType }}", "rightValue": "remove_item", "operator": { "type": "string", "operation": "equals" } }], "combinator": "and" },
              "renameOutput": true, "outputKey": "remove"
            },
            {
              "conditions": { "conditions": [{ "leftValue": "={{ $json.actionType }}", "rightValue": "set_fulfillment", "operator": { "type": "string", "operation": "equals" } }], "combinator": "and" },
              "renameOutput": true, "outputKey": "fulfillment"
            },
            {
              "conditions": { "conditions": [{ "leftValue": "={{ $json.actionType }}", "rightValue": "clear_cart", "operator": { "type": "string", "operation": "equals" } }], "combinator": "and" },
              "renameOutput": true, "outputKey": "clear"
            }
          ]
        },
        "options": { "fallbackOutput": "none" }
      }
    },
    {
      "id": "http_remove",
      "name": "Remove Cart Item",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [2440, 500],
      "parameters": {
        "method": "DELETE",
        "url": "=YOUR_SUPABASE_URL/rest/v1/cart_items",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "apikey",        "value": "YOUR_SUPABASE_ANON_KEY" },
            { "name": "Authorization", "value": "=Bearer YOUR_SUPABASE_ANON_KEY" }
          ]
        },
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            { "name": "product_name", "value": "=ilike.{{ $json.action.item_name }}" },
            { "name": "cart_id",      "value": "=in.(select id from carts where session_id eq.{{ $json.sessionId }})" }
          ]
        },
        "options": {}
      }
    },
    {
      "id": "set_remove_reply",
      "name": "Remove Reply",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [2660, 500],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [{ "id": "r1", "name": "reply", "value": "={{ `🗑️ Removed ${$('Handle Non-Lookup Action').item.json.action.item_name} from your cart.` }}", "type": "string" }]
        },
        "options": {}
      }
    },
    {
      "id": "supa_fulfillment",
      "name": "Set Fulfillment",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [2440, 620],
      "parameters": {
        "operation": "upsert",
        "tableId": "carts",
        "fieldsUi": {
          "fieldValues": [
            { "fieldId": "session_id",       "fieldValue": "={{ $json.sessionId }}" },
            { "fieldId": "customer_name",    "fieldValue": "={{ $json.userName }}" },
            { "fieldId": "phone_number",     "fieldValue": "={{ $json.userPhone }}" },
            { "fieldId": "fulfillment_type", "fieldValue": "={{ $json.action.fulfillment_type }}" },
            { "fieldId": "address",          "fieldValue": "={{ $json.action.address || ($json.action.fulfillment_type === 'pickup' ? 'Pickup' : $json.userAddress) }}" },
            { "fieldId": "status",           "fieldValue": "active" },
            { "fieldId": "updated_at",       "fieldValue": "={{ new Date().toISOString() }}" }
          ]
        }
      },
      "credentials": { "supabaseApi": { "id": "CBHMjfCAHYqzYIjh", "name": "Supabase account 2" } }
    },
    {
      "id": "set_fulfillment_reply",
      "name": "Fulfillment Reply",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [2660, 620],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [{ "id": "r1", "name": "reply", "value": "={{ $('Handle Non-Lookup Action').item.json.action.fulfillment_type === 'pickup' ? '🏪 Got it! You chose pickup. Say \"checkout\" when you\\'re ready.' : `🚗 Delivery to: ${$('Set Fulfillment').item.json.address}. Say \"checkout\" when you\\'re ready.` }}", "type": "string" }]
        },
        "options": {}
      }
    },
    {
      "id": "http_clear",
      "name": "Clear Cart Items",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [2440, 740],
      "parameters": {
        "method": "DELETE",
        "url": "=YOUR_SUPABASE_URL/rest/v1/cart_items",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "apikey",        "value": "YOUR_SUPABASE_ANON_KEY" },
            { "name": "Authorization", "value": "=Bearer YOUR_SUPABASE_ANON_KEY" }
          ]
        },
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            { "name": "cart_id", "value": "=in.(select id from carts where session_id eq.{{ $json.sessionId }})" }
          ]
        },
        "options": {}
      }
    },
    {
      "id": "set_clear_reply",
      "name": "Clear Reply",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [2660, 740],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [{ "id": "r1", "name": "reply", "value": "🧹 Cart cleared! Start fresh — what would you like to order?", "type": "string" }]
        },
        "options": {}
      }
    },
    {
      "id": "supa_fetch_cart_items_view",
      "name": "Fetch Cart Items (View)",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1340, 900],
      "parameters": {
        "operation": "getAll",
        "tableId": "cart_items",
        "filterType": "string",
        "filterString": "=cart_id=in.(select id from carts where session_id=eq.{{ $('Set Variables').item.json.sessionId }})"
      },
      "credentials": { "supabaseApi": { "id": "CBHMjfCAHYqzYIjh", "name": "Supabase account 2" } }
    },
    {
      "id": "code_cart_summary",
      "name": "Format Cart Summary",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1560, 900],
      "parameters": {
        "jsCode": "const items = $input.all().map(i => i.json);\nif (!items.length) {\n  return [{ json: { reply: '🛒 Your cart is empty. Add some items to get started!' } }];\n}\nconst lines = items.map(i => `• ${i.qty}x ${i.product_name} — £${Number(i.line_total).toFixed(2)}`).join('\\n');\nconst total = items.reduce((s, i) => s + Number(i.line_total), 0);\nconst reply = `🛒 Your cart:\\n${lines}\\n\\n💰 Total: £${total.toFixed(2)}\\n\\nSay \"checkout\" to place your order or keep adding items!`;\nreturn [{ json: { reply } }];"
      }
    },
    {
      "id": "supa_fetch_cart_co",
      "name": "Fetch Cart (Checkout)",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1340, 1100],
      "parameters": {
        "operation": "getAll",
        "tableId": "carts",
        "filterType": "string",
        "filterString": "=session_id=eq.{{ $('Set Variables').item.json.sessionId }}&status=eq.active"
      },
      "credentials": { "supabaseApi": { "id": "CBHMjfCAHYqzYIjh", "name": "Supabase account 2" } }
    },
    {
      "id": "supa_fetch_items_co",
      "name": "Fetch Cart Items (Checkout)",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1560, 1100],
      "parameters": {
        "operation": "getAll",
        "tableId": "cart_items",
        "filterType": "string",
        "filterString": "=cart_id=eq.{{ $('Fetch Cart (Checkout)').first().json.id }}"
      },
      "credentials": { "supabaseApi": { "id": "CBHMjfCAHYqzYIjh", "name": "Supabase account 2" } }
    },
    {
      "id": "code_build_order",
      "name": "Build Order Payload",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1780, 1100],
      "parameters": {
        "jsCode": "const cartArr = $('Fetch Cart (Checkout)').all().map(i => i.json);\nconst itemsArr = $('Fetch Cart Items (Checkout)').all().map(i => i.json);\nconst vars = $('Set Variables').first().json;\n\nif (!cartArr.length) {\n  return [{ json: { valid: false, reply: '🛒 Your cart is empty. Add some items first!' } }];\n}\nconst cart = cartArr[0];\nif (!itemsArr.length) {\n  return [{ json: { valid: false, reply: '🛒 Your cart is empty. Add some items first!' } }];\n}\nif (!cart.fulfillment_type) {\n  return [{ json: { valid: false, reply: 'Please tell me if you want delivery or pickup before checking out.' } }];\n}\nif (cart.fulfillment_type === 'delivery' && !cart.address) {\n  return [{ json: { valid: false, reply: 'Please provide your delivery address before checking out.' } }];\n}\nconst phone = cart.phone_number || vars.userPhone;\nif (!phone) {\n  return [{ json: { valid: false, reply: 'What is your phone number for the order?' } }];\n}\nconst total = itemsArr.reduce((s, i) => s + Number(i.line_total), 0);\nconst orderItems = itemsArr.map(i => ({ product: i.product_id, quantity: i.qty, price: i.unit_price }));\nreturn [{ json: {\n  valid: true,\n  cartId: cart.id,\n  sessionId: vars.sessionId,\n  payload: {\n    userId: vars.sessionId,\n    items: orderItems,\n    totalAmount: total,\n    shippingAddress: cart.fulfillment_type === 'pickup' ? 'Pickup' : cart.address,\n    customerName: cart.customer_name || vars.userName,\n    phoneNumber: phone,\n    paymentMethod: 'Payment Proof'\n  },\n  summaryLines: itemsArr.map(i => `${i.qty}x ${i.product_name}`).join(', '),\n  total\n}}];"
      }
    },
    {
      "id": "if_valid_cart",
      "name": "Cart Valid",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [2000, 1100],
      "parameters": {
        "conditions": {
          "conditions": [{ "leftValue": "={{ $json.valid }}", "rightValue": true, "operator": { "type": "boolean", "operation": "true" } }],
          "combinator": "and"
        },
        "options": {}
      }
    },
    {
      "id": "http_create_order",
      "name": "Create Order",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [2220, 1040],
      "parameters": {
        "method": "POST",
        "url": "=YOUR_API_BASE_URL/api/orders/chatbot",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "x-chatbot-secret", "value": "YOUR_CHATBOT_SECRET" },
            { "name": "Content-Type",     "value": "application/json" }
          ]
        },
        "sendBody": true,
        "contentType": "json",
        "body": "={{ JSON.stringify($json.payload) }}",
        "options": {}
      }
    },
    {
      "id": "supa_mark_checked_out",
      "name": "Mark Cart Checked Out",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [2440, 1040],
      "parameters": {
        "operation": "update",
        "tableId": "carts",
        "filterType": "string",
        "filterString": "=id=eq.{{ $('Build Order Payload').item.json.cartId }}",
        "fieldsUi": {
          "fieldValues": [
            { "fieldId": "status",     "fieldValue": "checked_out" },
            { "fieldId": "updated_at", "fieldValue": "={{ new Date().toISOString() }}" }
          ]
        }
      },
      "credentials": { "supabaseApi": { "id": "CBHMjfCAHYqzYIjh", "name": "Supabase account 2" } }
    },
    {
      "id": "set_checkout_success",
      "name": "Checkout Success Reply",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [2660, 1040],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [{ "id": "r1", "name": "reply", "value": "={{ `🎉 Order placed! Here's your summary:\\n${$('Build Order Payload').item.json.summaryLines}\\n\\n💰 Total: £${$('Build Order Payload').item.json.total.toFixed(2)}\\n\\nPlease upload your payment proof in the Orders section to confirm. We'll start preparing once we receive it! 🔥` }}", "type": "string" }]
        },
        "options": {}
      }
    },
    {
      "id": "set_checkout_error",
      "name": "Checkout Error Reply",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [2220, 1180],
      "parameters": {
        "mode": "manual",
        "assignments": {
          "assignments": [{ "id": "r1", "name": "reply", "value": "={{ $('Build Order Payload').item.json.reply }}", "type": "string" }]
        },
        "options": {}
      }
    },
    {
      "id": "merge1",
      "name": "Merge Replies",
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3,
      "position": [3200, 600],
      "parameters": { "mode": "append", "options": {} }
    },
    {
      "id": "supa_save_chat",
      "name": "Save Chat History",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [3420, 600],
      "parameters": {
        "operation": "create",
        "tableId": "chat_history",
        "fieldsUi": {
          "fieldValues": [
            { "fieldId": "session_id", "fieldValue": "={{ $('Set Variables').item.json.sessionId }}" },
            { "fieldId": "role",       "fieldValue": "assistant" },
            { "fieldId": "content",    "fieldValue": "={{ $json.reply }}" }
          ]
        }
      },
      "credentials": { "supabaseApi": { "id": "CBHMjfCAHYqzYIjh", "name": "Supabase account 2" } }
    },
    {
      "id": "respond1",
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [3640, 600],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify({ reply: $json.reply }) }}",
        "options": { "responseCode": 200 }
      }
    }
  ],
  "connections": {
    "Webhook Trigger":          { "main": [[{ "node": "Set Variables",        "type": "main", "index": 0 }]] },
    "Set Variables":            { "main": [[{ "node": "Intent Classifier",    "type": "main", "index": 0 }]] },
    "Intent Classifier":        { "main": [[{ "node": "Parse Intent",         "type": "main", "index": 0 }]] },
    "LLM Intent":               { "ai_languageModel": [[{ "node": "Intent Classifier", "type": "ai_languageModel", "index": 0 }]] },
    "Parse Intent":             { "main": [[{ "node": "Route by Intent",      "type": "main", "index": 0 }]] },
    "Route by Intent": {
      "main": [
        [{ "node": "FAQ Agent",           "type": "main", "index": 0 }],
        [{ "node": "Action Extractor",    "type": "main", "index": 0 }],
        [{ "node": "Fetch Cart Items (View)", "type": "main", "index": 0 }],
        [{ "node": "Fetch Cart (Checkout)", "type": "main", "index": 0 }]
      ]
    },
    "LLM FAQ":      { "ai_languageModel": [[{ "node": "FAQ Agent", "type": "ai_languageModel", "index": 0 }]] },
    "Memory FAQ":   { "ai_memory":        [[{ "node": "FAQ Agent", "type": "ai_memory",        "index": 0 }]] },
    "Knowledge Base": { "ai_tool":        [[{ "node": "FAQ Agent", "type": "ai_tool",          "index": 0 }]] },
    "Embeddings":   { "ai_embedding":     [[{ "node": "Knowledge Base", "type": "ai_embedding", "index": 0 }]] },
    "FAQ Agent":    { "main": [[{ "node": "FAQ Reply", "type": "main", "index": 0 }]] },
    "FAQ Reply":    { "main": [[{ "node": "Merge Replies", "type": "main", "index": 0 }]] },
    "LLM Action":    { "ai_languageModel": [[{ "node": "Action Extractor", "type": "ai_languageModel", "index": 0 }]] },
    "Action Extractor": { "main": [[{ "node": "Parse Action",  "type": "main", "index": 0 }]] },
    "Parse Action":     { "main": [[{ "node": "Needs Item Lookup", "type": "main", "index": 0 }]] },
    "Needs Item Lookup": {
      "main": [
        [{ "node": "Validate Item",           "type": "main", "index": 0 }],
        [{ "node": "Handle Non-Lookup Action", "type": "main", "index": 0 }]
      ]
    },
    "Validate Item":    { "main": [[{ "node": "Process Item Result", "type": "main", "index": 0 }]] },
    "Process Item Result": { "main": [[{ "node": "Item Found", "type": "main", "index": 0 }]] },
    "Item Found": {
      "main": [
        [{ "node": "Upsert Cart",       "type": "main", "index": 0 }],
        [{ "node": "Item Error Reply",  "type": "main", "index": 0 }]
      ]
    },
    "Upsert Cart":      { "main": [[{ "node": "Upsert Cart Item",  "type": "main", "index": 0 }]] },
    "Upsert Cart Item": { "main": [[{ "node": "Item Added Reply",  "type": "main", "index": 0 }]] },
    "Item Added Reply": { "main": [[{ "node": "Merge Replies", "type": "main", "index": 1 }]] },
    "Item Error Reply": { "main": [[{ "node": "Merge Replies", "type": "main", "index": 2 }]] },
    "Handle Non-Lookup Action": { "main": [[{ "node": "Switch Action Type", "type": "main", "index": 0 }]] },
    "Switch Action Type": {
      "main": [
        [{ "node": "Remove Cart Item", "type": "main", "index": 0 }],
        [{ "node": "Set Fulfillment",  "type": "main", "index": 0 }],
        [{ "node": "Clear Cart Items", "type": "main", "index": 0 }]
      ]
    },
    "Remove Cart Item": { "main": [[{ "node": "Remove Reply",      "type": "main", "index": 0 }]] },
    "Set Fulfillment":  { "main": [[{ "node": "Fulfillment Reply", "type": "main", "index": 0 }]] },
    "Clear Cart Items": { "main": [[{ "node": "Clear Reply",       "type": "main", "index": 0 }]] },
    "Remove Reply":      { "main": [[{ "node": "Merge Replies", "type": "main", "index": 3 }]] },
    "Fulfillment Reply": { "main": [[{ "node": "Merge Replies", "type": "main", "index": 4 }]] },
    "Clear Reply":       { "main": [[{ "node": "Merge Replies", "type": "main", "index": 5 }]] },
    "Fetch Cart Items (View)": { "main": [[{ "node": "Format Cart Summary",   "type": "main", "index": 0 }]] },
    "Format Cart Summary":     { "main": [[{ "node": "Merge Replies", "type": "main", "index": 6 }]] },
    "Fetch Cart (Checkout)": { "main": [[{ "node": "Fetch Cart Items (Checkout)", "type": "main", "index": 0 }]] },
    "Fetch Cart Items (Checkout)": { "main": [[{ "node": "Build Order Payload", "type": "main", "index": 0 }]] },
    "Build Order Payload": { "main": [[{ "node": "Cart Valid", "type": "main", "index": 0 }]] },
    "Cart Valid": {
      "main": [
        [{ "node": "Create Order",        "type": "main", "index": 0 }],
        [{ "node": "Checkout Error Reply", "type": "main", "index": 0 }]
      ]
    },
    "Create Order":         { "main": [[{ "node": "Mark Cart Checked Out", "type": "main", "index": 0 }]] },
    "Mark Cart Checked Out":{ "main": [[{ "node": "Checkout Success Reply", "type": "main", "index": 0 }]] },
    "Checkout Success Reply": { "main": [[{ "node": "Merge Replies", "type": "main", "index": 7 }]] },
    "Checkout Error Reply":   { "main": [[{ "node": "Merge Replies", "type": "main", "index": 8 }]] },
    "Merge Replies":    { "main": [[{ "node": "Save Chat History",   "type": "main", "index": 0 }]] },
    "Save Chat History":{ "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]] }
  }
}
```

- [ ] **Step 5.2: Replace placeholder values in the workflow**

Before deploying, replace these values in the workflow JSON:

| Placeholder | Replace with |
|---|---|
| `YOUR_API_BASE_URL` | Your Vercel production URL (e.g. `https://sizzora.vercel.app`) |
| `YOUR_CHATBOT_SECRET` | The value you set in Task 2.2 (e.g. `sizzora-chatbot-secret-2026`) |
| `YOUR_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxxx.supabase.co`) |
| `YOUR_SUPABASE_ANON_KEY` | Your Supabase anon/public key from the Supabase dashboard |

The Supabase URL and anon key are used for direct PostgREST HTTP calls in the Remove Cart Item and Clear Cart Items nodes. Find them in Supabase → Project Settings → API.

- [ ] **Step 5.3: Activate the workflow**

After deploying, confirm the workflow is set `"active": true` and the webhook at `/webhook/sizzora-chat` is live in the n8n UI.

- [ ] **Step 5.4: Commit placeholder note**

```bash
git commit --allow-empty -m "chore: n8n workflow deployed (Sizzora Chatbot v2 - Intent Router)"
```

---

## Task 6: Smoke Test

- [ ] **Step 6.1: Test FAQ path**

Open the Sizzora site while logged in. Open the AI chatbot tab. Send:
> "What burgers do you have?"

Expected: A reply listing burgers from the knowledge base. No errors.

- [ ] **Step 6.2: Test order add_item path**

Send: "Add 2 Classic Burgers please"

Expected: "✅ Added 2x Classic Burger (£X.XX each) to your cart."

If you get "not found": check that `YOUR_API_BASE_URL/api/products/chatbot?name=Classic Burger` returns results in the browser.

- [ ] **Step 6.3: Test cart_view path**

Send: "What's in my cart?"

Expected: Cart summary with item(s) and total.

- [ ] **Step 6.4: Test set_fulfillment**

Send: "I want delivery to 42 Baker Street, London"

Expected: "🚗 Delivery to: 42 Baker Street, London. Say checkout when you're ready."

- [ ] **Step 6.5: Test checkout path**

Send: "Checkout"

Expected: Order confirmation with summary and total. Order appears in MongoDB (check the Orders admin panel).

- [ ] **Step 6.6: Test error cases**

Send: "Add unicorn pizza" → Expected: item not found message  
Send: "Checkout" (with empty cart, new session) → Expected: "Your cart is empty"

---

## Notes & Known Gotchas

1. **`Fetch Cart (Checkout)` → `Fetch Cart Items (Checkout)` connection**: n8n runs nodes in sequence but the `Build Order Payload` Code node references both with `$('Fetch Cart (Checkout)')` and `$('Fetch Cart Items (Checkout)')`. Make sure both are connected in sequence (Checkout → Items → Build).

2. **Remove/Clear use direct Supabase HTTP calls** (not n8n Supabase nodes) because the n8n Supabase node's `delete` operation doesn't support subquery filters. If PostgREST subquery syntax doesn't work with your Supabase version, replace them with: fetch the cart ID first (Supabase `getAll` with filter), then delete by `cart_id`.

3. **OpenRouter free model**: `google/gemma-3-27b-it:free` is used for intent classification and action extraction. If this model is unavailable or rate-limited, swap to `meta-llama/llama-3.1-8b-instruct:free` as a fallback (same credential).

4. **Supabase `filterString`** in Supabase nodes uses PostgREST filter syntax. If the inline subquery syntax (`in.(select ...)`) doesn't work, use two steps: first fetch cart ID with a `getAll` filtered by `session_id`, then use that ID in the second query.

5. **Environment variable `CHATBOT_SECRET`** must be set in Vercel before deploying or the `/api/orders/chatbot` endpoint will reject all requests with 401.
