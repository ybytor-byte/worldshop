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
