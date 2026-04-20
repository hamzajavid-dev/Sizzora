# Sizzora Order MCP

This MCP server allows an AI agent to place an order for a person on the Sizzora website backend.

It exposes two tools:

1. `search_menu`
- Find in-stock menu items from `GET /api/products/chatbot`.

2. `place_order_for_person`
- Resolve item names to product IDs
- Calculate totals
- Place an order via `POST /api/orders/chatbot`

## Prerequisites

1. Sizzora backend running and reachable (default: `http://localhost:5000`)
2. `CHATBOT_SECRET` configured on the backend
3. Same secret configured in this MCP server as `SIZZORA_CHATBOT_SECRET`

## Setup

```bash
cd mcp/sizzora-order-mcp
npm install
```

Create `.env` from `.env.example` and set values:

```env
SIZZORA_API_BASE_URL=http://localhost:5000
SIZZORA_CHATBOT_SECRET=replace-with-your-chatbot-secret
```

## Run

```bash
npm start
```

This runs as a stdio MCP server and is intended to be launched by an MCP-compatible client.

## Example Tool Input

### `search_menu`

```json
{
  "query": "burger",
  "limit": 5
}
```

### `place_order_for_person`

```json
{
  "customerName": "Ali Khan",
  "phoneNumber": "03001234567",
  "shippingAddress": "House 12, Street 8, Gulberg, Lahore",
  "userId": "67fd80f7420f89d2f5011111",
  "items": [
    { "name": "Smoky Zinger Burger", "quantity": 2 },
    { "name": "Peri Peri Fries", "quantity": 1 }
  ],
  "additionalDetails": "Call before delivery"
}
```
