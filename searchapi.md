# SearchApi.io API — Google Shopping Response Format

## Endpoint

```
GET https://www.searchapi.io/api/v1/search
  ?engine=google_shopping
  &q={query}
  &gl={country_code}
  &hl={language}
  &api_key={key}
```

## Параметры

| Параметр | Описание | Пример |
|---|---|---|
| engine | всегда `google_shopping` | google_shopping |
| q | поисковый запрос | macbook pro |
| gl | регион (ru/us/de/jp) | us |
| hl | язык (ru/en/de/ja) | en |
| api_key | API ключ SearchApi.io | bwetm5ZbkwqYuBw7eJHTozrU |

## Регионы и валюты

| Регион | gl | hl | Валюта |
|--------|----|----|--------|
| RU | ru | ru | RUB |
| US | us | en | USD |
| EU | de | de | EUR |
| ASIA | jp | ja | JPY |

## shopping_ads — прямые ссылки на магазины

Массив платных объявлений. **У каждого элемента есть `link` — прямая ссылка на товар в магазине.**

Поля: `position`, `block_position`, `title`, `seller`, `link`, `price`, `extracted_price`, `rating`, `reviews`, `delivery`, `image`, `tag`

## shopping_results — основные результаты Google Shopping

**`link` отсутствует.** Вместо него `product_link` — ссылка на страницу товара в Google Shopping (не на магазин).

Поля: `position`, `product_id`, `title`, `product_link`, `offers_link`, `price`, `extracted_price`, `original_price`, `extracted_original_price`, `rating`, `reviews`, `seller`, `delivery`, `delivery_return`, `thumbnail`, `tag`, `condition`, `product_token`

## Ключевые поля

| Поле | Описание | ads | results |
|---|---|---|---|
| seller | Название магазина | ✔ | ✔ |
| price | Цена строкой ("$1,849.00") | ✔ | ✔ |
| extracted_price | Цена числом (1849.0) | ✔ | ✔ |
| link | **Прямая ссылка на товар в магазине** | ✔ | ✘ |
| product_link | Google Shopping ссылка | ✘ | ✔ |
| title | Название товара | ✔ | ✔ |
| rating | Рейтинг (4.8) | ✔ | ✔ |
| reviews | Количество отзывов | ✔ | ✔ |
| delivery | Информация о доставке | ✔ | ✘ |
| delivery_return | Информация о возврате | ✘ | ✔ |
| thumbnail | URL изображения | ✔ | ✔ |
| tag | Тег ("Sale", "7% OFF") | ✔ | ✔ |
| condition | Состояние ("New", "Pre-owned") | ✘ | ✔ |
| original_price | Цена до скидки | ✘ | ✔ |
| offers_link | Ссылка на все предложения | ✘ | ✔ |
| product_token | Токен для доп. запросов | ✘ | ✔ |

## Обработка в WorldShop

1. Сначала парсятся **shopping_ads** — у них есть прямые ссылки (`link`)
2. Затем **shopping_results** — для них `link` генерируется через `getStoreUrl()` (маппинг продавца на URL магазина)
3. Дедупликация по `seller + price`
4. Если API недоступен — fallback с `price=0` и ссылками на поиск в магазинах
