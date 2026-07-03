require('dotenv').config();
const { Worker } = require('bullmq');
const IORedis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://default:mZgEGgweUksiH2F2VuCxgHpc0gF28e4k@cool-orthogonal-touchable-91384.db.redis.io:16488';
const LLAMA_URL = process.env.LLAMA_URL || 'http://127.0.0.1:8081/v1/chat/completions';
const RAILWAY_API = process.env.RAILWAY_API || 'https://worldshopbackend-production.up.railway.app';
const MCP_AUTH = process.env.MCP_API_KEY || 'worldshop-mcp-secret-key';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy: (t) => Math.min(t * 1000, 10000),
});

async function mcpCall(method, params) {
  const res = await fetch(`${RAILWAY_API}/mcp/v1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-mcp-api-key': MCP_AUTH },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
  });
  if (!res.ok) throw new Error(`MCP ${method} failed: ${res.status}`);
  const data = await res.json();
  return data.result;
}

async function llamaChat(system, user) {
  const res = await fetch(LLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwyothos',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) throw new Error(`llama error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

const SYSTEM_PROMPT = `You are an e-commerce analyst. Your job: extract product info from raw search results.

Rules:
1. Identify brand, model, SKU from the text
2. Assign categoryId: 14=shoes, 15=clothing, 16=electronics, 17=accessories, 18=home, 19=other
3. Remove duplicate offers (same store, same price)
4. Normalize currency: keep original currency and price, but add priceRUB field (use rates: 1 USD=90 RUB, 1 EUR=98 RUB, 1 CNY=12.5 RUB)
5. Sort offers by priceRUB ascending
6. Return ONLY valid JSON, no markdown, no explain

Output format:
{
  "brand": "string",
  "model": "string",
  "sku": "string | null",
  "categoryId": number,
  "offers": [{ "store": "string", "price": number, "currency": "string", "priceRUB": number, "url": "string", "region": "string" }]
}`;

async function processJob(job) {
  const { imageUrl, productName, region } = job.data;
  const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);
  log(`Processing: "${productName}" (${region})`);

  try {
    // Step 1: Fetch market data from Railway MCP
    log(`Calling fetch_global_market_data...`);
    const marketResult = await mcpCall('tools/call', {
      name: 'fetch_global_market_data',
      arguments: { imageUrl, productName, region: region || 'RU' },
    });
    const marketData = JSON.parse(marketResult.content[0].text);
    log(`Got ${marketData.offerCount || 0} offers`);

    if (!marketData.offers?.length) {
      log('No offers found, skipping');
      return;
    }

    // Step 2: Analyze with local Qwythos-9B
    log(`Analyzing with local LLM...`);
    const rawJson = JSON.stringify({ productName: marketData.productName, offers: marketData.offers });
    const aiOutput = await llamaChat(SYSTEM_PROMPT, `Analyze this product data:\n${rawJson}`);
    const analysis = JSON.parse(aiOutput.replace(/```json\n?/g, '').replace(/```/g, ''));
    log(`Identified: ${analysis.brand} ${analysis.model} (SKU: ${analysis.sku || 'N/A'}, cat: ${analysis.categoryId})`);

    // Step 3: Normalize & calculate logistics (pure math — 0ms)
    log(`Calculating logistics...`);
    const calcResult = await mcpCall('tools/call', {
      name: 'normalize_and_calculate',
      arguments: {
        offers: analysis.offers,
        categoryId: analysis.categoryId || 19,
      },
    });
    const calcData = JSON.parse(calcResult.content[0].text);
    log(`Best deal: ${calcData.bestDeal?.shop} at ${calcData.bestDeal?.finalPrice} RUB`);

    // Step 4: Save to database
    log(`Saving to database...`);
    const saveResult = await mcpCall('tools/call', {
      name: 'write_to_worldshop_storages',
      arguments: {
        productName: marketData.productName,
        brand: analysis.brand,
        model: analysis.model,
        specs: { sku: analysis.sku, categoryId: analysis.categoryId, rawAnalysis: analysis },
        offers: marketData.offers,
        normalized: calcData.normalized,
        bestDeal: calcData.bestDeal,
        category: 'electronics',
        deepAnalysis: { analysis, calcData },
      },
    });
    const saveData = JSON.parse(saveResult.content[0].text);
    log(`Saved! Product ID: ${saveData.productId}, offers: ${saveData.offersSaved}`);
  } catch (err) {
    log(`ERROR: ${err.message}`);
  }
}

const worker = new Worker('hermes-processing', async (job) => processJob(job), { connection, concurrency: 1 });

worker.on('ready', () => {
  console.log(`[${new Date().toISOString()}] Bridge started`);
  console.log(`  LLM: ${LLAMA_URL}`);
  console.log(`  MCP: ${RAILWAY_API}/mcp/v1`);
  console.log(`  Redis: ${REDIS_URL.replace(/\/\/.*@/, '//***:***@')}`);
});

worker.on('error', (err) => console.error(`Worker error: ${err.message}`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed: ${err.message}`));
process.on('SIGINT', async () => { await worker.close(); await connection.quit(); process.exit(0); });
