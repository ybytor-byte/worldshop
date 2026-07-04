## Goal
Build a full‑stack product comparison platform (WorldShop) with image recognition, multi‑region price search, Hermes Agent orchestration via MCP tools, AI support chat, and CPA feeds.

## Constraints & Preferences
- Monorepo: pnpm v11.9.0 + Turborepo
- Frontend: Next.js 16.2.9, React 19, Apollo Client, Tailwind v4
- Backend: NestJS 10, Prisma (PostgreSQL), BullMQ (Redis), Meilisearch, JWT + OAuth (Google/Yandex placeholder)
- AI: llama-server `:8081` with `Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced-Q4_K_M.gguf` – used for support chat only
- Serper API (`google.serper.dev`) for Google Lens + Shopping – key working, **paid** (MCP controls usage+cache)
- Cloudinary for image hosting – credentials configured, working
- Yandex Vision **disabled** (cloud billing blocked) – will be re‑enabled after adding 5000 RUB
- Hermes Agent v0.17.0 (Python) installed; configured with local Gemma4 via `LM_BASE_URL=http://localhost:8081/v1`
- MCP server (`packages/mcp-server`) is the **sole orchestrator** – Hermes Agent uses its 9 MCP tools; no direct Serper calls from backend
- Backend: NestJS starts on `:3001`, must run from `backend/` dir
- Frontend: Next.js starts on `:3000`
- Domain `world-shop.online` on REG.RU → Vercel

## Progress
### Done
- **MCP – NestJS API endpoints**: `backend/src/mcp/mcp.controller.ts` – `POST /mcp/serper-lens` (Google Lens), `POST /mcp/serper-shopping` (Google Shopping → fixes Google URLs → direct store links), `POST /mcp/cloudinary-upload` (base64 → Cloudinary URL), `POST /mcp/save-product` (upserts Product + Offer in DB), `GET /mcp/price-history/:id` (price history from DB). Protected by `McpGuard` (checks `X-MCP-API-Key` header against `MCP_API_KEY` env var)
- **MCP – Guard**: `backend/src/mcp/mcp.guard.ts` – `CanActivate` reads `X-MCP-API-Key` header, compares with `MCP_API_KEY` from `.env`
- **MCP – Module**: `backend/src/mcp/mcp.module.ts` – imports `CloudinaryModule`, provides `SerperLensProvider` + `SerperProvider`
- **MCP – `serper-shopping` URL fix**: controller now post‑processes Serper offers – maps `shop`/`source` to known Russian store domains (Ozon, Wildberries, Yandex Market, DNS, M.Video, Citilink, Eldorado, Regard, BigGeek, etc.), generates **direct search URLs** instead of Google Shopping redirects; unknown stores fall back to region‑appropriate marketplace (Ozon for RU, Best Buy for US, etc.)
- **MCP server – package**: `packages/mcp-server/package.json` – `@modelcontextprotocol/sdk`, `zod`; ES module, TypeScript
- **MCP server – tools**: `packages/mcp-server/src/index.ts` – 9 MCP tools registered: `serper_lens`, `serper_shopping`, `cloudinary_upload`, `convert_currency` (ЦБ РФ rates), `deduplicate_offers` (JS dedup), `calculate_shipping` (RU/INT tariffs), `calculate_duties` (ФТС rules), `save_product`, `get_price_history`. Each tool either calls NestJS MCP API or runs inline logic
- **MCP server – services**: `backend-api.ts` (HTTP client with `X-MCP-API-Key`), `cache.ts` (TTL cache for Serper + currency rates)
- **MCP server – currency tool**: `tools/convert-currency.ts` – fetches `cbr-xml-daily.ru/daily_json.js`, caches 1 h, supports any ЦБ РФ currency; returns `{amount, from, to, result, rate, date}`
- **MCP server – dedup tool**: `tools/deduplicate-offers.ts` – pure JS `Map` keyed by `shop|title`, keeps lowest price
- **Hermes Agent – MCP connected**: `~/.hermes/config.yaml` has `mcp_servers.worldshop` with stdio transport pointing to `packages/mcp-server/dist/index.js`, env vars `BACKEND_URL`, `MCP_API_KEY`; `hermes mcp list` shows `worldshop` enabled with all tools
- **Hermes Agent – MCP tested**: `hermes chat -q "use deduplicate_offers..."` returned correct dedup result `[Ozon:50000, WB:51000]`
- **Prisma schema**: `@@unique([brand, model])` added to `Product` model for upsert in `save-product`
- **`.env`**: Added `MCP_API_KEY=worldshop-mcp-secret-key`
- **`pnpm-workspace.yaml`**: Added `packages/mcp-server`
- **`storeLinks` removed from backend**: `SearchByImageService` – deleted `ruStores` array, `makeStoreLinks()` method, `storeLinks` field from all responses
- **`storeLinks` removed from frontend**: `page.tsx` and `scan/page.tsx` – deleted "Найти в магазинах" block with `storeLinks.map()`
- **Frontend – new offer fields**: `page.tsx` and `scan/page.tsx` – offers now display `rank` (`#1`), `price` (`₽`), `shipping` (`+ X ₽ дост.`), `duty` (`+ X ₽ пошл.`), `totalPrice` (`= X ₽`) with color accents
- **Full stack builds**: `pnpm run build` – 5/5 tasks successful (backend, web, mcp-server, shared, extension)
- **Backend + MCP API tested**: `POST /mcp/serper-shopping` returns 15 offers with direct store URLs (Ozon, Eldorado, M.Video), zero Google Shopping links
- **Fixed "ничего не выдаёт"**: two issues found and fixed – (1) `callLlama()` only read `content`, not `reasoning_content` (Gemma4-QAT puts output in `reasoning_content`); (2) **`cleanProductName` removed Hermes llama-server call** because Gemma4-QAT cannot handle Russian text (UTF-8 chars become `??`), wasting 40+ seconds per request. Now uses fast regex-only fallback (0.5s vs 44s)

### Blocked
- **Yandex Market**: module left in code; will add MCP tool when user tops up 5000 RUB (cloud billing currently blocked)
- **CityAds CPA**: unreachable from local environment, works only on deployed server
- **Hermes OpenRouter key**: `sk-o...ecd7` returns 401 – no cloud AI for Hermes, only local Gemma4 via llama-server
- **Gemma4-QAT**: cannot handle Russian text (UTF-8 → `??`). Only usable for English prompts (support chat etc.)

## Key Decisions
- **MCP over direct code_execution for dedup/ranking**: user explicitly wants MCP tools to control API‑key spending (Serper paid), cache responses, and run logic 0.1 ms in Node.js instead of having Hermes write Python scripts each time
- **MCP for all data access**: AI agent never touches DB directly – `save_product` and `get_price_history` go through NestJS API with auth
- **MCP for currency**: ЦБ РФ fetched via MCP tool, not through Hermes’ built‑in web search – exact rates, no wasted queries
- **`storeLinks` removed**: hardcoded store links replaced by Hermes‑orchestrated MCP pipeline
- **Google URLs → direct store URLs**: `serper_shopping` MCP tool post‑processes all offers – recognized stores get direct search URLs, unknown stores fall back to Ozon (RU) / Best Buy (US) / MediaMarkt (EU)
- **cleanProductName uses regex only**: Gemma4-QAT can't handle Russian text, so Hermes llama-server call was removed from `cleanProductName`. Regex fallback (`купить`/`с доставкой`/`цена` stripping + 60-char truncation) is fast and sufficient
- **Hermes system prompt not yet activated**: the prompt that chains all 9 MCP tools (`serper_lens → serper_shopping → deduplicate → convert_currency → calculate_shipping → calculate_duties → save_product → rank`) is documented in the plan but not yet injected into the frontend flow

## Next Steps
1. **Test the site**: verify image search actually returns results in browser now (0.5s vs 44s)
2. **Activate Hermes full pipeline**: update `POST /search-by-image` to invoke `hermes chat -q` with the system prompt that chains all 9 MCP tools, instead of calling Serper directly
3. **Add Yandex Market tool to MCP** when user tops up 5000 RUB on Yandex cloud
4. **Deploy backend** to VPS / Railway / Render
5. **Build frontend support chat widget** (backend `POST /support/chat` exists)
6. **Integrate real CPA feeds** (CityAds) on deployed server

## Critical Context
- **Serper key**: `SERPER_KEY=89bff08b265ea5608569cec6f8ddf2916bd560b7` – paid, MCP caches responses 30 min to save money
- **Cloudinary**: `cloud_name=nyn0asuv`, `api_key=919248793557833`, `api_secret=XNFyppn_-8Le1RlF5N4p9alass8` – auto‑compression 800px WebP
- **MCP_API_KEY**: `worldshop-mcp-secret-key` – shared between MCP server and NestJS backend
- **llama‑server**: `:8081` with Gemma4‑12B‑QAT – **does NOT support Russian text (UTF-8 → `??`)**, English only
- **Hermes Agent status**: `.env file ✓ exists`, Model `gemma4`, Provider `openai`, MCP server `worldshop` enabled
- **Beware**: running `hermes chat -q` can take >60 s because Gemma4‑QAT reasons deeply; backend calls must use adequate timeouts
- **port `:3001`**: NestJS backend; `:3000`: Next.js frontend; `:8081`: llama‑server
- **Backend must run from `backend/` dir** – GraphQL `typePaths` uses `process.cwd()` relative paths

## Relevant Files
- `backend/src/mcp/mcp.controller.ts`: 5 MCP endpoints (serper-lens, serper-shopping with URL fix, cloudinary-upload, save-product, price-history)
- `backend/src/mcp/mcp.guard.ts`: `X-MCP-API-Key` validation
- `backend/src/mcp/mcp.module.ts`: module definition, imports CloudinaryModule, provides Serper providers
- `backend/src/app.module.ts`: imports McpModule
- `backend/.env`: `MCP_API_KEY=worldshop-mcp-secret-key`, existing keys
- `backend/prisma/schema.prisma`: `@@unique([brand, model])` on Product model
- `packages/mcp-server/package.json`: `@modelcontextprotocol/sdk`, `zod`, ESM, TS
- `packages/mcp-server/src/index.ts`: 9 MCP tools (serper_lens, serper_shopping, cloudinary_upload, convert_currency, deduplicate_offers, calculate_shipping, calculate_duties, save_product, get_price_history)
- `packages/mcp-server/src/services/backend-api.ts`: HTTP client with `X-MCP-API-Key`
- `packages/mcp-server/src/services/cache.ts`: TtlCache<K,V>
- `packages/mcp-server/src/tools/convert-currency.ts`: ЦБ РФ rates, 1h cache
- `packages/mcp-server/src/tools/deduplicate-offers.ts`: `Map<shop|title>` dedup
- `backend/src/search-by-image/search-by-image.service.ts`: `storeLinks` removed, `cleanProductName` uses regex-only (no Hermes llama-server call — Gemma4-QAT doesn't support Russian)
- `backend/src/search/providers/serper.provider.ts`: `toDirectUrl()` with Russian store domains; region‑aware fallback
- `backend/src/hermes/hermes.service.ts`: `callLlama()` now reads `reasoning_content` as fallback for `content`
- `~/.hermes/config.yaml`: `model: { provider: openai, default: gemma4 }`, `mcp_servers.worldshop` with stdio transport
- `web/src/app/page.tsx`: `ImageUpload` component – storeLinks removed, new offer fields (rank, shipping, duty, totalPrice)
- `web/src/app/scan/page.tsx`: same offer field updates as page.tsx
- `packages/mcp-server/tsconfig.json`: ES2022, ESNext module, bundler resolution
- `.opencode/plans/mcp-server-implementation.md`: full implementation plan with 9 MCP tools, NestJS endpoints, Hermes prompt
