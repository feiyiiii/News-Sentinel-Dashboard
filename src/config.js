import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function splitList(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  appName: 'News Sentinel Bot',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  paths: {
    stateFile: path.resolve(process.cwd(), process.env.STATE_FILE || './data/state.json'),
    reportFile: path.resolve(process.cwd(), process.env.REPORT_FILE || './output/latest-report.md'),
    publicDashboardFile: path.resolve(process.cwd(), './docs/index.html'),
  },
  alerts: {
    btcPercent: numberFromEnv('BTC_ALERT_PERCENT', 2),
    ethPercent: numberFromEnv('ETH_ALERT_PERCENT', 2),
    goldPercent: numberFromEnv('GOLD_ALERT_PERCENT', 0.5),
    silverPercent: numberFromEnv('SILVER_ALERT_PERCENT', 0.5),
  },
  webhook: {
    url: process.env.WECHAT_WORK_WEBHOOK_URL || process.env.WEBHOOK_URL || '',
    format: process.env.WECHAT_WORK_WEBHOOK_URL ? 'wecom' : (process.env.WEBHOOK_FORMAT || 'generic-json'),
  },
  alphaVantage: {
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
  },
  x: {
    bearerToken: process.env.X_BEARER_TOKEN || '',
    queries: splitList(process.env.X_QUERIES),
    maxResults: Math.min(100, Math.max(10, Math.trunc(numberFromEnv('X_MAX_RESULTS', 10)))),
  },
  feeds: {
    wars: [
      { name: 'NPR World', url: 'https://feeds.npr.org/1004/rss.xml' },
      { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
      { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
      { name: 'Google News Ukraine', url: 'https://news.google.com/rss/search?q=Ukraine+war&hl=en-US&gl=US&ceid=US:en' },
      { name: 'Google News Middle East', url: 'https://news.google.com/rss/search?q=Middle+East+war&hl=en-US&gl=US&ceid=US:en' },
      { name: 'Google News Taiwan', url: 'https://news.google.com/rss/search?q=Taiwan+strait+tension&hl=en-US&gl=US&ceid=US:en' }
    ],
    tech: [
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
      { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
      { name: 'Ars Technica', url: 'http://feeds.arstechnica.com/arstechnica/index' },
      { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
      { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
      { name: 'Google News AI', url: 'https://news.google.com/rss/search?q=AI+chips+semiconductor+OpenAI+NVIDIA&hl=en-US&gl=US&ceid=US:en' }
    ],
  },
};
