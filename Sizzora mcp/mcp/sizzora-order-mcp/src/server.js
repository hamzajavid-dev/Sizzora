import dotenv from 'dotenv';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

dotenv.config();

const API_BASE_URL = (process.env.SIZZORA_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const CHATBOT_SECRET = process.env.SIZZORA_CHATBOT_SECRET || '';

function ensureConfigured() {
  if (!API_BASE_URL) {
    throw new Error('SIZZORA_API_BASE_URL is not configured.');
  }
  if (!CHATBOT_SECRET) {
    throw new Error('SIZZORA_CHATBOT_SECRET is not configured.');
  }
}

function normalizePrice(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return parsed;
}

async function fetchJsonOrThrow(url, options = {}) {
  const response = await fetch(url, options);
  const rawText = await response.text();

  let data;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = { raw: rawText };
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function pickBestProductMatch(products, wantedName) {
  if (!products.length) return null;

  const target = wantedName.trim().toLowerCase();
  const exact = products.find((product) => String(product.name || '').trim().toLowerCase() === target);
  if (exact) return exact;

  const startsWith = products.find((product) => String(product.name || '').toLowerCase().startsWith(target));
  if (startsWith) return startsWith;

  return products[0];
}

export function createSizzoraOrderServer() {
  const server = new McpServer({
    name: 'sizzora-order-mcp',
    version: '1.0.0',
  });

  server.tool(
    'search_menu',
    'Search available in-stock Sizzora menu items. Use before placing an order.',
    {
      query: z.string().optional().describe('Optional item name to search, e.g. "burger"'),
      limit: z.number().int().positive().max(50).optional().describe('Optional max number of items to return.'),
    },
    async ({ query, limit = 10 }) => {
      const queryParam = query ? `?name=${encodeURIComponent(query)}` : '';
      const url = `${API_BASE_URL}/api/products/chatbot${queryParam}`;

      const products = await fetchJsonOrThrow(url);
      const truncated = Array.isArray(products) ? products.slice(0, limit) : [];

      if (!truncated.length) {
        return {
          content: [{ type: 'text', text: 'No in-stock menu items were found for this query.' }],
        };
      }

      const lines = truncated.map((product, index) => {
        const price = normalizePrice(product.price);
        return `${index + 1}. ${product.name} | id=${product._id} | price=${price}`;
      });

      return {
        content: [{ type: 'text', text: lines.join('\n') }],
      };
    }
  );

  server.tool(
    'place_order_for_person',
    'Place an order in Sizzora for a person by item names and quantities.',
    {
      customerName: z.string().min(2).describe('Customer full name.'),
      phoneNumber: z.string().min(7).describe('Customer phone number.'),
      shippingAddress: z.string().min(5).describe('Delivery address.'),
      userId: z.string().optional().describe('Optional Sizzora user ID. Leave empty for guest order.'),
      additionalDetails: z.string().optional().describe('Optional note to include in response context.'),
      items: z
        .array(
          z.object({
            name: z.string().min(1).describe('Human-readable product name, e.g. "zinger burger".'),
            quantity: z.number().int().positive().describe('Quantity for this product.'),
          })
        )
        .min(1)
        .describe('List of requested items and quantities.'),
    },
    async ({ customerName, phoneNumber, shippingAddress, userId, additionalDetails, items }) => {
      ensureConfigured();

      const resolvedItems = [];

      for (const item of items) {
        const searchUrl = `${API_BASE_URL}/api/products/chatbot?name=${encodeURIComponent(item.name)}`;
        const candidates = await fetchJsonOrThrow(searchUrl);
        const selected = pickBestProductMatch(Array.isArray(candidates) ? candidates : [], item.name);

        if (!selected) {
          throw new Error(`Could not find in-stock product for: ${item.name}`);
        }

        const unitPrice = normalizePrice(selected.price);
        resolvedItems.push({
          requestedName: item.name,
          resolvedName: selected.name,
          product: selected._id,
          quantity: item.quantity,
          price: unitPrice,
          lineTotal: unitPrice * item.quantity,
        });
      }

      const totalAmount = resolvedItems.reduce((sum, item) => sum + item.lineTotal, 0);

      const payload = {
        userId: userId || 'guest',
        items: resolvedItems.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount,
        shippingAddress,
        customerName,
        phoneNumber,
      };

      const orderResponse = await fetchJsonOrThrow(`${API_BASE_URL}/api/orders/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-chatbot-secret': CHATBOT_SECRET,
        },
        body: JSON.stringify(payload),
      });

      const summaryLines = resolvedItems.map(
        (item) => `- ${item.quantity} x ${item.resolvedName} (requested: ${item.requestedName}) = ${item.lineTotal}`
      );

      const details = [
        `Order placed successfully for ${customerName}.`,
        `Order ID: ${orderResponse.orderId || 'unknown'}`,
        `Total: ${orderResponse.totalAmount ?? totalAmount}`,
        'Items:',
        ...summaryLines,
      ];

      if (additionalDetails) {
        details.push(`Note: ${additionalDetails}`);
      }

      return {
        content: [{ type: 'text', text: details.join('\n') }],
      };
    }
  );

  return server;
}
