# SearchApi.io — Google Shopping API

## Endpoint

```
GET https://www.searchapi.io/api/v1/search
  ?engine=google_shopping
  &q={query}
  &gl={country}
  &hl={language}
  &api_key={key}
```

## Response (macbook pro, gl=us)

### search_metadata

```json
{
  "id": "search_m3WR9zk90VHGOjnRWvyn8YoV",
  "status": "Success",
  "created_at": "2026-07-03T20:49:03Z",
  "request_time_taken": 6.13,
  "parsing_time_taken": 0.41,
  "total_time_taken": 6.54,
  "request_url": "https://www.google.com/search?q=macbook+pro&oq=macbook+pro&gl=us&hl=en&udm=28",
  "json_url": "https://www.searchapi.io/api/v1/searches/search_m3WR9zk90VHGOjnRWvyn8YoV"
}
```

### search_parameters

```json
{
  "engine": "google_shopping",
  "q": "macbook pro",
  "hl": "en",
  "gl": "us"
}
```

### shopping_ads (платные объявления)

**Есть `link` — прямая ссылка на магазин**

```json
{
  "position": 1,
  "block_position": "top",
  "title": "MacBook Pro (2021) 16-inch - Apple M1 Pro 10-core and 16-core GPU - 16GB RAM - SSD 512GB - Standard display",
  "seller": "Back Market",
  "link": "https://www.backmarket.com/en-us/p/macbook-pro-2021-16-inch-m1-pro-10-core-and-16-core-gpu-16gb-ram-ssd-512gb/813c81d0-69ba-4dfd-a162-96074cb188e3",
  "price": "$694.00",
  "extracted_price": 694.0,
  "rating": 4.8,
  "reviews": 223,
  "delivery": "Free 1-day",
  "image": "data:image/webp;base64,... [truncated]"
}
```

**Поля:** `position`, `block_position`, `title`, `seller`, `link`, `price`, `extracted_price`, `rating`, `reviews`, `delivery`, `tag`, `image`

### shopping_results (основные результаты)

**Нет `link`, только `product_link` (Google Shopping)**

```json
{
  "position": 1,
  "product_id": "1293272249390991376",
  "title": "14-inch Apple MacBook Pro M5 10 CPU / 10 GPU",
  "seller": "Best Buy",
  "price": "$1,849.00",
  "extracted_price": 1849.0,
  "original_price": "$1,999",
  "extracted_original_price": 1999.0,
  "tag": "7% OFF",
  "rating": 4.8,
  "reviews": 1400,
  "delivery": "Free delivery by Tue",
  "delivery_return": "15-day returns",
  "product_link": "https://www.google.com/search?ibp=oshop&q=macbook+pro&prds=catalogid:1293272249390991376,gpcid:4624075570524723513,headlineOfferDocid:14847710533659668153,imageDocid:1253466832787864713,pvo:25,pvt:hg&gl=us&udm=28",
  "offers": "& more",
  "offers_link": "https://www.google.com/search?ibp=oshop&q=macbook+pro&prds=catalogid:1293272249390991376,gpcid:4624075570524723513,headlineOfferDocid:14847710533659668153,imageDocid:1253466832787864713,pvo:25,pvt:hg&gl=us&udm=28",
  "thumbnail": "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRwyaHwfzlZePpvJKas2uIp3t45RyUu2OPPSYzi_CkI6hrIJr9G369dprEqGoGLcxTdgsFmIe6KyWRICIUztNCHvrlr-ypWGgwGgtxdwH1v"
}
```

```json
{
  "position": 2,
  "product_id": "16957269223819760312",
  "title": "Apple MacBook Pro 14.2\" Liquid Retina XDR Display M5 Chip 10-Core CPU 10-Core GPU 24GB 1TB SSD",
  "seller": "Apple",
  "price": "$2,499.00",
  "extracted_price": 2499.0,
  "rating": 4.8,
  "reviews": 1400,
  "delivery": "Free delivery by Tue",
  "product_link": "https://www.google.com/search?ibp=oshop&q=macbook+pro&prds=catalogid:16957269223819760312,gpcid:5177596715793088919,headlineOfferDocid:6882463376978543886,imageDocid:10992370633670671683,pvo:25,pvt:hg&gl=us&udm=28",
  "thumbnail": "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQVRF-RqL1VcpAjEf6mWlWCg-xe5rYQi9uxQ9J1M3Ere8HDCbiSm7WBs9_Tnp2CE3nrf4qntjTLMAAQYQyMPqJJrh5FSwwKYaMgSdFgrxX3_JZg"
}
```

**Поля:** `position`, `product_id`, `title`, `seller`, `price`, `extracted_price`, `original_price`, `extracted_original_price`, `tag`, `rating`, `reviews`, `delivery`, `delivery_return`, `product_link`, `offers`, `offers_link`, `thumbnail`, `product_token`, `condition`

## Сравнение полей

| Поле | shopping_ads | shopping_results |
|---|---|---|
| `seller` | ✔ | ✔ |
| `price` / `extracted_price` | ✔ | ✔ |
| `link` (прямая ссылка) | **✔** | ✘ |
| `product_link` (Google Shopping) | ✘ | **✔** |
| `title` | ✔ | ✔ |
| `rating` / `reviews` | ✔ | ✔ |
| `delivery` | ✔ | ✔ |
| `delivery_return` | ✘ | ✔ |
| `original_price` | ✘ | ✔ |
| `tag` ("Sale", "7% OFF") | ✔ | ✔ |
| `condition` ("New", "Pre-owned") | ✘ | ✔ |
| `thumbnail` | ✔ (base64) | ✔ (URL) |

## Как используется в WorldShop

1. **`shopping_ads`** парсятся первыми — у них есть `link` (прямая ссылка на магазин)
2. **`shopping_results`** — нет `link`, используется `product_link` (Google Shopping)
3. Дедупликация по `seller + extracted_price`
4. Fallback — если API недоступен, возвращаются ссылки на поиск в магазинах (price=0)
