# Диагностика TMAPI (Китай)

## Статус: API НЕ РАБОТАЕТ

**Дата проверки:** 03.07.2026
**Эндпоинт:** `https://api.tmapi.top/taobao/item_search`
**Ключ:** ✅ есть в .env (JWT)

## Результаты тестов

| Эндпоинт | Статус | Ответ |
|---|---|---|
| `GET /` | 404 | `{"message":"no Route matched with those values"}` |
| `GET /taobao/item_search?q=test` | 404 | `{"message":"no Route matched with those values"}` |
| `GET /1688/item_search?q=test` | 404 | `{"message":"no Route matched with those values"}` |
| `GET /api/taobao/item_search` | 404 | То же |
| `GET /v1/taobao/search` | 404 | То же |
| `GET /search?keyword=test` | 404 | То же |

## Проблемы

1. **SSL-сертификат невалидный** — `ERR_TLS_CERT_ALTNAME_INVALID`
2. **Все роуты 404** — сервер nginx отвечает, но API-роуты не настроены
3. **Сайт `tmapi.top` недоступен** — DNS резолвится, но HTTP 404

## Вывод

TMAPI API больше не работает. Сервер жив (nginx отдаёт JSON-ошибки), но ни один эндпоинт не функционирует. Возможные причины:
- API изменил URL/структуру (нужна документация)
- Сервис закрыт
- Ключ просрочен или привязан к другому аккаунту

## Что делать

1. **Найти новый API для Китая (Taobao/1688)** — альтернативы:
   - Alibaba Cloud API (официальный)
   - Taobao Open Platform API
   - AliExpress Affiliate API
   - DataHut (datHut.co)
   - AliData (alidata.com)
2. **Проверить документацию TMAPI** — возможно, сменился baseUrl
3. **Пока TMAPI сломан** — поиск по ASIA-региону отдаёт пустой результат

## ApiShip (Логистика)

**Ключ:** `2ca4c3702b7bfa40436b04190ae32023` — добавлен в `.env` (не в git)
**Файлы:** `backend/src/logistics/apiship.service.ts`
**Используется в:** `NormalizeAndCalculateTool` (MCP) — расчёт доставки по РФ

### Как работает
- При origin=RU, dest=RU → вызывает ApiShip API для реального расчёта доставки
- При международной доставке (US/EU/ASIA → RU) → оценки (international shipping $10-25)
- Если ApiShip недоступен → fallback (Почта России, СДЭК, Boxberry)

### Для деплоя
Добавить `APISHIP_KEY=2ca4c3702b7bfa40436b04190ae32023` в Railway variables

## Текущий код

`backend/src/search/providers/tmapi.provider.ts`:
- baseUrl: `https://api.tmapi.top`
- Эндпоинты: `/taobao/item_search`, `/1688/item_search`
- fallbackSearch() возвращает `[]` (без хардкода)
