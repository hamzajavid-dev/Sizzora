# Sizzora AI Chatbot — Design Spec
**Date:** 2026-04-19  
**Status:** Approved

---

## Context

Sizzora's ChatWidget already has an AI tab that calls the n8n MCP API directly. That call is unauthenticated and returns generic responses — it has no knowledge of Sizzora's actual menu, categories, or restaurant policies.

This design replaces that placeholder with a proper RAG (Retrieval-Augmented Generation) pipeline: Sizzora's real data is embedded into a Supabase vector store, and a Claude-style AI agent queries it to give grounded, accurate answers about the menu, restaurant info, and FAQs.

**Goals:**
- Chatbot answers questions about menu & products, restaurant info, FAQs & support
- All knowledge and chat history stored in Supabase
- Powered by OpenRouter free LLM (cost = $0)
- Minimal frontend change — ChatWidget POSTs to a webhook, gets JSON reply

---

## Architecture Overview

```
ChatWidget (AI tab)
      │  POST { message, sessionId }
      ▼
n8n Webhook  ──►  AI Agent
                    │
              ┌─────┴──────┐
              │             │
    Supabase Vector     Buffer Memory
    Store (RAG tool)   (per session)
              │
    OpenRouter LLM
    (free model)
              │
      ◄─── JSON { reply }
      ▼
ChatWidget renders reply
```

**Two n8n workflows:**
1. **Ingestion Workflow** — seeds Supabase vector store from Sizzora's live MongoDB data
2. **Chat Workflow** — webhook-triggered RAG chatbot with session memory

---

## Workflow 1: Data Ingestion

**Trigger:** Manual (run once, then periodically when menu changes)

**Steps:**
1. `HTTP Request` → GET `http://localhost:5000/api/products` → all products
2. `HTTP Request` → GET `http://localhost:5000/api/categories` → all categories
3. `Code` node → format each product as a text chunk:
   ```
   Product: {name}
   Category: {category}
   Price: PKR {price}
   Description: {description}
   In Stock: {inStock}
   Trending: {isTrending}
   ```
4. `Set` node → append static restaurant knowledge chunks (hours, location, payment methods, delivery policy, FAQs)
5. `Embeddings` → Jina AI `jina-embeddings-v2-base-en` (free, 768 dims) via HTTP Request
6. `Supabase Vector Store Insert` → store chunks + embeddings into `sizzora_knowledge` table

**Supabase table schema (run in Supabase SQL editor):**
```sql
-- Enable pgvector
create extension if not exists vector;

-- Knowledge base table
create table sizzora_knowledge (
  id bigserial primary key,
  content text not null,
  metadata jsonb,
  embedding vector(768)
);

-- Similarity search function
create or replace function match_sizzora_knowledge (
  query_embedding vector(768),
  match_count int default 5,
  filter jsonb default '{}'
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    sizzora_knowledge.id,
    sizzora_knowledge.content,
    sizzora_knowledge.metadata,
    1 - (sizzora_knowledge.embedding <=> query_embedding) as similarity
  from sizzora_knowledge
  where metadata @> filter
  order by sizzora_knowledge.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Chat history table
create table chat_history (
  id bigserial primary key,
  session_id text not null,
  role text not null,      -- 'user' or 'assistant'
  content text not null,
  created_at timestamptz default now()
);

create index on chat_history(session_id, created_at);
```

---

## Workflow 2: Chatbot (RAG)

**Trigger:** Webhook — `POST /webhook/sizzora-chat`  
**Request body:** `{ "message": "...", "sessionId": "..." }`  
**Response:** `{ "reply": "..." }`

**Nodes:**
1. `Webhook` → receives POST, extracts `message` and `sessionId`
2. `Supabase` → fetch last 10 messages for `sessionId` from `chat_history`
3. `AI Agent` (n8n LangChain agent):
   - **LLM:** OpenAI-compatible node, base URL = `https://openrouter.ai/api/v1`, model = `meta-llama/llama-3.1-8b-instruct:free`
   - **Memory:** Simple Buffer Window (last 10 turns)
   - **Tool:** Supabase Vector Store in `retrieve-as-tool` mode — searches `sizzora_knowledge`
   - **System prompt:**
     ```
     You are Sizzora's friendly AI food assistant. 
     You help customers with menu questions, prices, ingredients, restaurant hours, delivery info, and FAQs.
     Always use the knowledge base tool to look up accurate product and restaurant information.
     If you don't find something in the knowledge base, say so politely — don't make up prices or details.
     Keep answers concise and friendly.
     ```
4. `Supabase` → insert user message + assistant reply into `chat_history`
5. `Respond to Webhook` → `{ "reply": "{{agent_output}}" }`

---

## Frontend Change (ChatWidget)

**File:** `client/src/components/ChatWidget.jsx`

The existing AI tab has a call to `https://api.n8n-mcp.com/mcp`. Replace that single API call with a POST to the n8n webhook URL:

```js
// Replace existing AI call with:
const res = await axios.post('YOUR_N8N_WEBHOOK_URL/sizzora-chat', {
  message: userMessage,
  sessionId: userId || 'guest-' + Date.now()
});
const reply = res.data.reply;
```

No other frontend changes needed.

---

## Environment Variables

Add to `server/.env` (not strictly needed for n8n, but good for reference):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

Add to n8n credentials:
- **Supabase credential** — URL + service key
- **OpenRouter credential** — OpenAI-compatible, base URL `https://openrouter.ai/api/v1`, API key from openrouter.ai
- **Jina AI credential** (HTTP header auth) — free API key from jina.ai

---

## Verification Steps

1. Run Supabase SQL script → confirm tables created via Supabase dashboard
2. Execute Ingestion Workflow manually → check `sizzora_knowledge` table has rows
3. Test Chat Workflow via n8n test mode → send `{ "message": "What burgers do you have?", "sessionId": "test-1" }` → verify grounded reply
4. Update ChatWidget webhook URL → open Sizzora frontend → type a menu question in AI tab → verify response
5. Check `chat_history` table in Supabase → confirm messages are being logged

---

## Approach Considered & Rejected

- **Single workflow (no ingestion):** Would require live MongoDB queries on every chat message — slow and fragile
- **Telegram/WhatsApp channel:** Out of scope, user confirmed webhook-only
- **Paid embeddings (OpenAI):** Rejected in favor of Jina AI free tier
