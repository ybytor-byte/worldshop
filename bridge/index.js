require('dotenv').config();

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { spawn } = require('child_process');

const REDIS_URL = process.env.REDIS_URL || 'redis://default:mZgEGgweUksiH2F2VuCxgHpc0gF28e4k@cool-orthogonal-touchable-91384.db.redis.io:16488';
const HERMES_PATH = process.env.HERMES_PATH || 'C:\\Users\\gamer\\AppData\\Local\\hermes\\hermes-agent\\venv\\Scripts\\hermes.exe';
const RAILWAY_API = process.env.RAILWAY_API || 'https://worldshopbackend-production.up.railway.app';
const MCP_API_KEY = process.env.MCP_API_KEY || '';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 1000, 10000),
});

function runHermesOneshot(prompt) {
  return new Promise((resolve, reject) => {
    const proc = spawn(HERMES_PATH, ['-z', prompt, '-s', 'global-scout'], {
      windowsHide: true,
      timeout: 300000,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code !== 0 && !stdout) {
        reject(new Error(`Hermes exit code ${code}: ${stderr.slice(0, 500)}`));
      } else {
        resolve(stdout);
      }
    });

    proc.on('error', reject);
  });
}

function extractJson(text) {
  const codeBlock = text.match(/```json\n?([\s\S]*?)\n?```/);
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1]); } catch { /* fall through */ }
  }
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    try { return JSON.parse(text.slice(jsonStart, jsonEnd + 1)); } catch { /* fall through */ }
  }
  return { raw: text };
}

async function processJob(job) {
  const { imageUrl, productName, region } = job.data;
  console.log(`[${new Date().toISOString()}] Processing: "${productName}" (${region})`);

  try {
    const prompt =
`/global-scout Analyze product "${productName}" (image: ${imageUrl}, region: ${region}).
Execute the global-scout workflow:
1. Call fetch_global_market_data
2. Analyze with your LLM (identify SKU, brand, category)
3. Call normalize_and_calculate
4. Call write_to_worldshop_storages
Return final JSON with productId, bestDeal, totalOffers.`;

    const output = await runHermesOneshot(prompt);
    const result = extractJson(output);
    console.log(`[${new Date().toISOString()}] Result:`, JSON.stringify(result).slice(0, 500));

    if (MCP_API_KEY && !result.error) {
      const saveRes = await fetch(`${RAILWAY_API}/mcp/save-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-mcp-api-key': MCP_API_KEY },
        body: JSON.stringify({ productName, region, deepAnalysis: result, source: 'hermes-bridge' }),
      });
      if (saveRes.ok) console.log(`[${new Date().toISOString()}] Saved to Railway`);
      else console.warn(`[${new Date().toISOString()}] Save failed: ${saveRes.status}`);
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error: "${productName}" => ${err.message}`);
  }
}

const worker = new Worker('hermes-processing', async job => {
  await processJob(job);
}, { connection, concurrency: 1 });

worker.on('ready', () => {
  console.log(`[${new Date().toISOString()}] Hermes Bridge Worker started`);
  console.log(`  Redis: ${REDIS_URL.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`  Hermes: ${HERMES_PATH}`);
  console.log(`  Railway: ${RAILWAY_API}`);
});

worker.on('error', err => console.error(`[${new Date().toISOString()}] Worker error:`, err.message));
worker.on('failed', (job, err) => console.error(`[${new Date().toISOString()}] Job ${job?.id} failed:`, err.message));

process.on('SIGINT', async () => {
  console.log(`[${new Date().toISOString()}] Shutting down...`);
  await worker.close();
  await connection.quit();
  process.exit(0);
});
