import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { BackendApi } from './services/backend-api.js';
import { convertCurrency } from './tools/convert-currency.js';
import { deduplicateOffers } from './tools/deduplicate-offers.js';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
const apiKey = process.env.MCP_API_KEY || 'worldshop-mcp-secret-key';
const api = new BackendApi(backendUrl, apiKey);

const server = new McpServer({
  name: 'WorldShop MCP',
  version: '1.0.0',
});

server.tool(
  'serper_lens',
  { imageUrl: z.string().url() },
  async ({ imageUrl }) => {
    const result = await api.post('/mcp/serper-lens', { imageUrl });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

server.tool(
  'serper_shopping',
  { query: z.string(), region: z.string().optional() },
  async ({ query, region }) => {
    const offers = await api.post('/mcp/serper-shopping', { query, region: region || 'RU' });
    return { content: [{ type: 'text', text: JSON.stringify(offers) }] };
  },
);

server.tool(
  'cloudinary_upload',
  { imageBase64: z.string() },
  async ({ imageBase64 }) => {
    const result = await api.post('/mcp/cloudinary-upload', { imageBase64 });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

server.tool(
  'convert_currency',
  { amount: z.number(), from: z.string(), to: z.string() },
  async ({ amount, from, to }) => {
    const result = await convertCurrency(amount, from, to);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

server.tool(
  'deduplicate_offers',
  { offers: z.array(z.any()) },
  async ({ offers }) => {
    const result = deduplicateOffers(offers);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

server.tool(
  'calculate_shipping',
  { weightKg: z.number(), fromRegion: z.string(), toRegion: z.string() },
  async ({ weightKg, fromRegion, toRegion }) => {
    const RU_BASE = 300;
    const RU_PER_KG = 50;
    const INT_BASE = 1500;
    const INT_PER_KG = 200;

    if (fromRegion === 'RU' && toRegion === 'RU') {
      const cost = RU_BASE + RU_PER_KG * weightKg;
      return { content: [{ type: 'text', text: JSON.stringify({ cost, currency: 'RUB', deliveryDays: '3-7' }) }] };
    }
    const cost = INT_BASE + INT_PER_KG * weightKg;
    return { content: [{ type: 'text', text: JSON.stringify({ cost, currency: 'RUB', deliveryDays: '14-30' }) }] };
  },
);

server.tool(
  'calculate_duties',
  { priceEur: z.number(), weightKg: z.number() },
  async ({ priceEur, weightKg }) => {
    const FREE_PRICE_THRESHOLD = 200;
    const FREE_WEIGHT_THRESHOLD = 31;
    let duty = 0;

    if (priceEur > FREE_PRICE_THRESHOLD && weightKg > FREE_WEIGHT_THRESHOLD) {
      const excessPrice = priceEur - FREE_PRICE_THRESHOLD;
      const excessWeight = weightKg - FREE_WEIGHT_THRESHOLD;
      const byPrice = excessPrice * 0.15;
      const byWeight = excessWeight * 2;
      duty = Math.max(byPrice, byWeight);
    } else if (priceEur > FREE_PRICE_THRESHOLD) {
      duty = (priceEur - FREE_PRICE_THRESHOLD) * 0.15;
    } else if (weightKg > FREE_WEIGHT_THRESHOLD) {
      duty = (weightKg - FREE_WEIGHT_THRESHOLD) * 2;
    }

    return { content: [{ type: 'text', text: JSON.stringify({ duty, currency: 'EUR' }) }] };
  },
);

server.tool(
  'save_product',
  {
    productName: z.string(),
    brand: z.string().optional(),
    model: z.string().optional(),
    specs: z.any().optional(),
    offers: z.array(z.any()),
  },
  async (params) => {
    const result = await api.post('/mcp/save-product', {
      productName: params.productName,
      brand: params.brand,
      model: params.model,
      specs: params.specs,
      offers: params.offers,
    });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

server.tool(
  'get_price_history',
  { productId: z.string() },
  async ({ productId }) => {
    const result = await api.get(`/mcp/price-history/${productId}`);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
