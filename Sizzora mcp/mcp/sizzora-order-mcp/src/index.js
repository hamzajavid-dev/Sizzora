import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createSizzoraOrderServer } from './server.js';

const server = createSizzoraOrderServer();
const transport = new StdioServerTransport();
await server.connect(transport);
