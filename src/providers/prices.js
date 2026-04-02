import { fetchJson, pctChange } from '../lib/utils.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchCryptoPrices(previous = {}) {
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true';
  const data = await fetchJson(url);

  const btc = Number(data.bitcoin?.usd);
  const eth = Number(data.ethereum?.usd);

  return {
    BTC: {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: btc,
      change24h: Number(data.bitcoin?.usd_24h_change || 0),
      runChange: pctChange(btc, previous.BTC?.price),
      currency: 'USD',
      source: 'CoinGecko',
    },
    ETH: {
      symbol: 'ETH',
      name: 'Ethereum',
      price: eth,
      change24h: Number(data.ethereum?.usd_24h_change || 0),
      runChange: pctChange(eth, previous.ETH?.price),
      currency: 'USD',
      source: 'CoinGecko',
    },
  };
}

async function fetchMetal(symbol, previousPrice, apiKey) {
  const url = `https://www.alphavantage.co/query?function=GOLD_SILVER_SPOT&symbol=${symbol}&apikey=${encodeURIComponent(apiKey)}`;
  const data = await fetchJson(url);
  const nestedMatch = Array.isArray(data?.data)
    ? data.data.find((item) => String(item?.symbol || '').toUpperCase().includes(symbol))
    : null;
  const candidate = nestedMatch || data;
  const price = Number(candidate?.price ?? candidate?.price_oz ?? candidate?.spot_price);
  const changePercent = Number(candidate?.change_percent ?? candidate?.changePercent ?? candidate?.chp);

  if (!Number.isFinite(price)) {
    const detail = data?.Note || data?.Information || data?.Error || 'unexpected payload';
    throw new Error(`Gold/Silver 未接通：请检查 ALPHA_VANTAGE_API_KEY。详情：${detail}`);
  }

  return {
    price,
    change24h: Number.isFinite(changePercent) ? changePercent : null,
    runChange: pctChange(price, previousPrice),
    source: 'Alpha Vantage',
  };
}

export async function fetchMetalPrices(previous = {}, apiKey = 'demo') {
  const gold = await fetchMetal('GOLD', previous.GOLD?.price, apiKey);
  await sleep(1200);
  const silver = await fetchMetal('SILVER', previous.SILVER?.price, apiKey);

  return {
    GOLD: {
      symbol: 'XAU',
      name: 'Gold',
      price: gold.price,
      change24h: gold.change24h,
      runChange: gold.runChange,
      currency: 'USD',
      source: gold.source,
    },
    SILVER: {
      symbol: 'XAG',
      name: 'Silver',
      price: silver.price,
      change24h: silver.change24h,
      runChange: silver.runChange,
      currency: 'USD',
      source: silver.source,
    },
  };
}
