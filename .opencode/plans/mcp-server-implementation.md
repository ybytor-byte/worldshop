# План: MCP-сервер WorldShop

## Общая архитектура

```
Hermes Agent ←→ MCP Server (stdio/SSE :8377) ←→ NestJS Backend (:3001)
                                                      ↕
                                               PostgreSQL / Serper / Cloudinary
```

MCP-сервер — прослойка между Hermes Agent и бэкендом. Все инструменты строго контролируемые, с кэшированием и валидацией.

---

## Шаг 1: NestJS — MCP API-эндпоинты

### 1.1 Файл: `backend/src/mcp/mcp.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class McpGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const key = req.headers['x-mcp-api-key'];
    const expected = this.config.get<string>('MCP_API_KEY');
    return key === expected;
  }
}
```

### 1.2 Файл: `backend/src/mcp/mcp.controller.ts`

```typescript
import { Controller, Post, Get, Param, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { McpGuard } from './mcp.guard';
import { SerperLensProvider } from '../search/providers/serper-lens.provider';
import { SerperProvider } from '../search/providers/serper.provider';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('mcp')
@UseGuards(McpGuard)
export class McpController {
  constructor(
    private serperLens: SerperLensProvider,
    private serper: SerperProvider,
    private cloudinary: CloudinaryService,
    private prisma: PrismaService,
  ) {}

  // POST /mcp/serper-lens
  @Post('serper-lens')
  async serperLensSearch(@Body() body: { imageUrl: string }) {
    if (!body.imageUrl) throw new BadRequestException('imageUrl required');
    const results = await this.serperLens.identifyByImage(body.imageUrl, 'ru', 'ru');
    const productName = this.serperLens.extractProductName(results);
    return {
      productName,
      visualMatches: results.map(r => ({ title: r.title, source: r.source, link: r.link, imageUrl: r.imageUrl })),
    };
  }

  // POST /mcp/serper-shopping
  @Post('serper-shopping')
  async serperShoppingSearch(@Body() body: { query: string; region?: string }) {
    if (!body.query) throw new BadRequestException('query required');
    const offers = await this.serper.search({ text: body.query, region: body.region || 'RU' });
    return offers;
  }

  // POST /mcp/cloudinary-upload
  @Post('cloudinary-upload')
  async cloudinaryUpload(@Body() body: { imageBase64: string }) {
    if (!body.imageBase64) throw new BadRequestException('imageBase64 required');
    const buffer = Buffer.from(body.imageBase64, 'base64');
    const url = await this.cloudinary.uploadImage(buffer);
    return { url };
  }

  // POST /products/mcp-save
  @Post('save-product')
  async saveProduct(@Body() body: {
    productName: string;
    brand?: string;
    model?: string;
    specs?: Record<string, any>;
    offers: Array<{
      shop: string;
      price: number;
      currency: string;
      url: string;
      shipping?: number;
      deliveryDays?: string;
      region?: string;
    }>;
  }) {
    // Create or update product
    const product = await this.prisma.product.upsert({
      where: {
        brand_model: { brand: body.brand || 'Unknown', model: body.model || body.productName },
      },
      create: {
        brand: body.brand || 'Unknown',
        model: body.model || body.productName,
        specs: body.specs || {},
      },
      update: {},
    });

    // Create offers
    for (const o of body.offers) {
      await this.prisma.offer.create({
        data: {
          productId: product.id,
          shop: o.shop,
          price: o.price,
          currency: o.currency,
          url: o.url,
          shippingUSD: o.shipping,
          deliveryDays: o.deliveryDays,
          region: o.region || 'RU',
        },
      });
    }

    return { productId: product.id };
  }

  // GET /products/:id/price-history
  @Get('price-history/:id')
  async priceHistory(@Param('id') id: string) {
    const offers = await this.prisma.offer.findMany({
      where: { productId: id },
      orderBy: { scrapedAt: 'desc' },
      take: 100,
      select: { scrapedAt: true, price: true, shop: true, currency: true },
    });
    return offers;
  }
}
```

> **Примечание:** `brand_model` — составной уникальный ключ. Его нужно добавить в Prisma schema (см. ниже).

### 1.3 Файл: `backend/src/mcp/mcp.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SearchModule } from '../search/search.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [CloudinaryModule, SearchModule, PrismaModule],
  controllers: [McpController],
})
export class McpModule {}
```

### 1.4 Изменение: `backend/src/app.module.ts`

Добавить в imports:
```typescript
import { McpModule } from './mcp/mcp.module';

// В массив imports:
McpModule,
```

### 1.5 Изменение: `backend/prisma/schema.prisma`

Добавить составной уникальный индекс на Product:
```prisma
model Product {
  id        String   @id @default(uuid())
  brand     String
  model     String
  specs     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  offers    Offer[]
  scans     ProductScan[]

  @@unique([brand, model])
}
```

### 1.6 Изменение: `backend/.env`

Добавить:
```
MCP_API_KEY=worldshop-mcp-secret-key
```

---

## Шаг 2: MCP-сервер (Node.js, пакет `packages/mcp-server`)

### 2.1 Файл: `packages/mcp-server/package.json`

```json
{
  "name": "@worldshop/mcp-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.9.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0"
  }
}
```

### 2.2 Файл: `packages/mcp-server/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

### 2.3 Файл: `packages/mcp-server/src/index.ts`

```typescript
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

// --- serper_lens ---
server.tool(
  'serper_lens',
  { imageUrl: z.string().url() },
  async ({ imageUrl }) => {
    const result = await api.post('/mcp/serper-lens', { imageUrl });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

// --- serper_shopping ---
server.tool(
  'serper_shopping',
  { query: z.string(), region: z.string().optional() },
  async ({ query, region }) => {
    const offers = await api.post('/mcp/serper-shopping', { query, region: region || 'RU' });
    return { content: [{ type: 'text', text: JSON.stringify(offers) }] };
  },
);

// --- cloudinary_upload ---
server.tool(
  'cloudinary_upload',
  { imageBase64: z.string() },
  async ({ imageBase64 }) => {
    const result = await api.post('/mcp/cloudinary-upload', { imageBase64 });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

// --- convert_currency ---
server.tool(
  'convert_currency',
  { amount: z.number(), from: z.string(), to: z.string() },
  async ({ amount, from, to }) => {
    const result = await convertCurrency(amount, from, to);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

// --- deduplicate_offers ---
server.tool(
  'deduplicate_offers',
  { offers: z.array(z.any()) },
  async ({ offers }) => {
    const result = deduplicateOffers(offers);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

// --- calculate_shipping ---
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

// --- calculate_duties ---
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

// --- save_product ---
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
    const result = await api.post('/mcp/save-product', params);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

// --- get_price_history ---
server.tool(
  'get_price_history',
  { productId: z.string() },
  async ({ productId }) => {
    const result = await api.get(`/mcp/price-history/${productId}`);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

// Запуск
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2.4 Файл: `packages/mcp-server/src/services/backend-api.ts`

```typescript
export class BackendApi {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.apiKey = apiKey;
  }

  async post(path: string, body: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MCP-API-Key': this.apiKey,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Backend API ${path} returned ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }

  async get(path: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'X-MCP-API-Key': this.apiKey },
    });
    if (!res.ok) {
      throw new Error(`Backend API ${path} returned ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }
}
```

### 2.5 Файл: `packages/mcp-server/src/services/cache.ts`

```typescript
export class TtlCache<K, V> {
  private store = new Map<K, { value: V; expires: number }>();

  constructor(private ttlMs: number = 30 * 60 * 1000) {}

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: K, value: V): void {
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.store.clear();
  }
}
```

### 2.6 Файл: `packages/mcp-server/src/tools/convert-currency.ts`

```typescript
const CBR_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';

interface CbrResponse {
  Valute: Record<string, { Value: number; Nominal: number }>;
}

let cachedRates: { data: Record<string, number>; expires: number } | null = null;

async function fetchRates(): Promise<Record<string, number>> {
  if (cachedRates && Date.now() < cachedRates.expires) {
    return cachedRates.data;
  }

  const res = await fetch(CBR_URL);
  const json: CbrResponse = await res.json();

  const rates: Record<string, number> = {};
  for (const [code, val] of Object.entries(json.Valute)) {
    rates[code] = val.Value / val.Nominal;
  }
  rates['RUB'] = 1;

  cachedRates = { data: rates, expires: Date.now() + 60 * 60 * 1000 };
  return rates;
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
): Promise<{ amount: number; from: string; to: string; result: number; rate: number; date: string }> {
  const rates = await fetchRates();
  const fromRub = rates[from.toUpperCase()];
  const toRub = rates[to.toUpperCase()];

  if (!fromRub || !toRub) {
    throw new Error(`Unsupported currency: ${from} → ${to}`);
  }

  const rate = fromRub / toRub;
  const result = amount * rate;

  return {
    amount,
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    result: Math.round(result * 100) / 100,
    rate: Math.round(rate * 10000) / 10000,
    date: new Date().toISOString().slice(0, 10),
  };
}
```

### 2.7 Файл: `packages/mcp-server/src/tools/deduplicate-offers.ts`

```typescript
export function deduplicateOffers(offers: any[]): any[] {
  const seen = new Map<string, any>();

  for (const offer of offers) {
    const key = `${offer.shop || ''}|${offer.title || offer.productName || ''}`.toLowerCase();
    const existing = seen.get(key);

    if (!existing || (offer.price || 0) < (existing.price || Infinity)) {
      seen.set(key, offer);
    }
  }

  return Array.from(seen.values());
}
```

---

## Шаг 3: Изменения в pnpm-workspace.yaml

```yaml
packages:
  - 'extension'
  - 'backend'
  - 'web'
  - 'shared'
  - 'packages/mcp-server'
```

---

## Шаг 4: Удаление storeLinks

### 4.1 `backend/src/search-by-image/search-by-image.service.ts`

- Удалить: поля `ruStores`, метод `makeStoreLinks()`, поле `storeLinks` из возвращаемых объектов
- `cleanProductName()` оставить (Gemma4 через HermesService)
- `searchByImageUpload()` — возвращать `{ identified, productName, offers, visualMatches }`
- `searchByKeywords()` — возвращать `{ query, region, offers, keywords }`

### 4.2 `web/src/app/page.tsx`

- Удалить блок `<div className="mt-3">` с `imageResult.storeLinks` (секция "Найти в магазинах")

### 4.3 `web/src/app/scan/page.tsx`

- Удалить аналогичный блок с `result.storeLinks`

---

## Шаг 5: Фронтенд — новые поля

### 5.1 Формат оффера

```typescript
interface Offer {
  shop: string;
  price: number;
  currency: string;
  url: string;
  shipping?: number;
  duty?: number;
  totalPrice?: number;
  rank?: number;
}
```

### 5.2 Отображение в `page.tsx` и `scan/page.tsx`

В карточке оффера заменить простую строку цены на:

```tsx
<div>
  <span className="text-theme-primary font-medium">{name}</span>
  {price && (
    <div className="flex items-center gap-1 flex-wrap mt-0.5">
      <span className="text-xs font-bold">{Number(price).toLocaleString('ru-RU')} ₽</span>
      {shop.shipping !== undefined && (
        <span className="text-[10px] text-theme-muted">+ дост. {Number(shop.shipping).toLocaleString('ru-RU')} ₽</span>
      )}
      {shop.duty !== undefined && shop.duty > 0 && (
        <span className="text-[10px] text-theme-muted">+ пошл. {Number(shop.duty).toLocaleString('ru-RU')} ₽</span>
      )}
      {shop.totalPrice !== undefined && (
        <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>
          = {Number(shop.totalPrice).toLocaleString('ru-RU')} ₽
        </span>
      )}
    </div>
  )}
</div>
```

---

## Шаг 6: Подключение Hermes Agent к MCP

### 6.1 Режим запуска MCP-сервера

MCP-сервер работает через STDIO — Hermes Agent запускает его как дочерний процесс.

Настройка в `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  worldshop:
    transport: stdio
    command: node
    args:
      - "C:/Users/gamer/Desktop/Worldshop/packages/mcp-server/dist/index.js"
    env:
      BACKEND_URL: "http://localhost:3001"
      MCP_API_KEY: "worldshop-mcp-secret-key"
```

Либо через CLI:
```bash
hermes mcp add worldshop \
  --transport stdio \
  --command node \
  --args "C:/Users/gamer/Desktop/Worldshop/packages/mcp-server/dist/index.js" \
  --env BACKEND_URL=http://localhost:3001 \
  --env MCP_API_KEY=worldshop-mcp-secret-key
```

### 6.2 Системный промпт для поиска

При запуске Hermes для поиска по фото использовать промпт:

```
Ты поисковый движок WorldShop. У тебя есть MCP-инструменты: serper_lens, serper_shopping, cloudinary_upload, convert_currency, deduplicate_offers, calculate_shipping, calculate_duties, save_product, get_price_history.

Задача: распознать товар по фото, найти лучшие цены в РФ, сохранить в БД.

Порядок:
1. cloudinary_upload(imageBase64) → получи URL фото
2. serper_lens(imageUrl) → распознай товар → { productName }
3. serper_shopping(productName, "RU") → получи offers[]
4. deduplicate_offers(offers) → убери дубликаты
5. Для каждого offer: convert_currency → приведи к RUB
6. Для каждого offer: calculate_shipping + calculate_duties → totalPrice
7. save_product({ productName, offers }) → сохрани в БД
8. Отсортируй offers по totalPrice (возрастание)
9. Верни JSON: { productName, offers: [{shop,price,currency,shipping,duty,totalPrice,url}], totalOffers, minPrice }
```

---

## Шаг 7: Миграция Prisma

```bash
cd backend
npx prisma migrate dev --name add_brand_model_unique
```

---

## Шаг 8: Сборка и тест

```bash
# 1. Собрать пакеты (установить зависимости)
pnpm install

# 2. Собрать MCP-сервер
cd packages/mcp-server
pnpm run build

# 3. Собрать бэкенд
cd backend
pnpm run build

# 4. Запустить бэкенд
pnpm run start:prod

# 5. Запустить MCP-сервер (на время теста, потом через Hermes)
node dist/index.js

# 6. Протестировать эндпоинты
curl -X POST http://localhost:3001/mcp/serper-lens \
  -H "Content-Type: application/json" \
  -H "X-MCP-API-Key: worldshop-mcp-secret-key" \
  -d '{"imageUrl":"https://..."}'

# 7. Подключить Hermes
hermes mcp add worldshop ...
hermes chat -t worldshop -q "Найди товар по фото..."
```

---

## Файлы (сводка)

| Действие | Файл | Описание |
|---|---|---|
| CREATE | `backend/src/mcp/mcp.guard.ts` | Guard для MCP_API_KEY |
| CREATE | `backend/src/mcp/mcp.controller.ts` | 5 эндпоинтов |
| CREATE | `backend/src/mcp/mcp.module.ts` | Модуль |
| EDIT | `backend/src/app.module.ts` | + McpModule |
| EDIT | `backend/.env` | + MCP_API_KEY |
| EDIT | `backend/prisma/schema.prisma` | + @@unique([brand, model]) |
| CREATE | `packages/mcp-server/package.json` | Пакет |
| CREATE | `packages/mcp-server/tsconfig.json` | TS config |
| CREATE | `packages/mcp-server/src/index.ts` | MCP сервер + 9 инструментов |
| CREATE | `packages/mcp-server/src/services/backend-api.ts` | HTTP клиент |
| CREATE | `packages/mcp-server/src/services/cache.ts` | TTL кэш |
| CREATE | `packages/mcp-server/src/tools/convert-currency.ts` | Курсы ЦБ РФ |
| CREATE | `packages/mcp-server/src/tools/deduplicate-offers.ts` | Дедупликация |
| EDIT | `pnpm-workspace.yaml` | + packages/mcp-server |
| EDIT | `backend/src/search-by-image/search-by-image.service.ts` | - storeLinks |
| EDIT | `web/src/app/page.tsx` | - storeLinks блок |
| EDIT | `web/src/app/scan/page.tsx` | - storeLinks блок |
| EDIT | `web/src/app/page.tsx` | + shipping/duty/totalPrice |
| EDIT | `web/src/app/scan/page.tsx` | + shipping/duty/totalPrice |
