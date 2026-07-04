# SearchApi.io — ответы API

## 1. Органический поиск (`engine=google`)

**Запрос:** `?engine=google&q=macbook+pro&gl=ru&hl=ru`

### organic_results

```json
{
  "position": 1,
  "title": "MacBook Pro - купить, цена на Макбук Про от ...",
  "link": "https://re-store.ru/kompyutery-noutbuki/apple/macbook-pro/",
  "source": "Re-store",
  "domain": "re-store.ru",
  "snippet": "MacBook Pro можно укомплектовать по полной: до 128 ГБ оперативной памяти и до 8 ТБ SSD.",
  "rich_snippet": {
    "extensions": ["От 199 990,00 ₽ до 1 349 990,00 ₽"]
  }
}
```

```json
{
  "position": 2,
  "title": "Apple MacBook Pro купить в интернет-магазине ...",
  "link": "https://www.dns-shop.ru/catalog/recipe/b70b01357dbede01/apple-macbook-pro/",
  "source": "DNS",
  "domain": "www.dns-shop.ru"
}
```

**Поля:** `position`, `title`, `link` (прямая ссылка!), `source`, `domain`, `snippet`, `rich_snippet.extensions` (ценовой диапазон), `favicon`

**Плюсы:** прямые ссылки на магазины (DNS, Re-store, i-shop, iPort)
**Минусы:** нет структурированной цены `extracted_price` — только диапазон в `rich_snippet.extensions`

---

## 2. Google Shopping (`engine=google_shopping`) — старый способ

**Запрос:** `?engine=google_shopping&q=macbook+pro&gl=us`

### shopping_ads (платные)

Есть `link` — прямая ссылка на магазин:

```json
{
  "seller": "Back Market",
  "link": "https://www.backmarket.com/en-us/p/...",
  "price": "$694.00",
  "extracted_price": 694.0
}
```

### shopping_results (основные)

Нет `link`, только `product_link` (Google Shopping):

```json
{
  "seller": "Best Buy",
  "price": "$1,849.00",
  "extracted_price": 1849.0,
  "product_link": "https://www.google.com/search?ibp=oshop&..."
}
```

---

## 3. Google Lens (`engine=google_lens`) — НОВЫЙ способ

**Запрос:** `?engine=google_lens&url=https://...`

**Используется в `search-by-image` (Google Lens)**

### visual_matches

```json
{
  "position": 1,
  "title": "Sony WH-1000XM4 Wireless Noise Cancelling",
  "link": "https://www.amazon.com/Sony-WH-1000XM4-Canceling-Headphones/dp/B0863FR3S9",
  "source": "Amazon",
  "price": "$248.00",
  "extracted_price": 248.0,
  "currency": "USD",
  "thumbnail": "https://encrypted-tbn1.gstatic.com/..."
}
```

**Поля:** `position`, `title`, `link` (прямая ссылка!), `source`, `price`, `extracted_price`, `currency`, `thumbnail`, `rating`, `reviews`

**Плюсы:** прямая ссылка на магазин, есть цена, 60 результатов
**Минусы:** не у всех товаров есть price

---

## Итог

| Эндпоинт | Прямая ссылка | Цена | Где используется |
|---|---|---|---|
| `engine=google_shopping` | только у `shopping_ads` | ✅ `extracted_price` | Старый `SerpApiProvider` (поиск по тексту) |
| `engine=google` (organic) | ✅ `link` | ❌ только диапазон | Новый `SerpApiProvider` (пока не включён) |
| `engine=google_lens` | ✅ `link` | ✅ `extracted_price` | Новый `SearchApiLensProvider` (распознавание фото) |

## Провайдеры WorldShop

- **`SerpApiProvider`** — поиск по тексту, `engine=google_shopping`
- **`SearchApiLensProvider`** — распознавание фото, `engine=google_lens` (заменил SerperLens)
- **`SerperProvider`** — поиск по тексту, `serper.dev/shopping` (ключ не работает)
