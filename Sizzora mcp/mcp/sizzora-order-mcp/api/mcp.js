import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createSizzoraOrderServer } from '../src/server.js';

async function readRequestBody(req) {
  if (typeof req.body !== 'undefined') {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return undefined;

  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, MCP-Session-Id, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!['GET', 'POST', 'DELETE'].includes(req.method || '')) {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    // Stateless mode is best for serverless functions.
    sessionIdGenerator: undefined,
  });

  const server = createSizzoraOrderServer();
  await server.connect(transport);

  try {
    const parsedBody = req.method === 'POST' ? await readRequestBody(req) : undefined;
    await transport.handleRequest(req, res, parsedBody);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
}
