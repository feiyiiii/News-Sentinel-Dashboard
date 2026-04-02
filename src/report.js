import { formatNumber, formatPercent, formatTimestamp } from './lib/utils.js';

function renderPriceLine(item) {
  if (!item) {
    return '- Data unavailable in this run.';
  }
  const runChange = item.runChange == null ? 'n/a' : formatPercent(item.runChange);
  const change24h = item.change24h == null ? 'n/a' : formatPercent(item.change24h);
  return `- ${item.name}: $${formatNumber(item.price)} | since last run: ${runChange} | 24h: ${change24h} | source: ${item.source}`;
}

function renderNews(title, items, timezone) {
  const lines = [`## ${title}`];
  if (items.length === 0) {
    lines.push('- No items collected this run.');
    return lines.join('\n');
  }

  for (const item of items) {
    const when = item.publishedAt ? formatTimestamp(new Date(item.publishedAt), timezone) : 'time unknown';
    lines.push(`- [${item.title}](${item.link})`);
    lines.push(`  Source: ${item.source} | ${when}`);
  }

  return lines.join('\n');
}

function renderX(items, timezone) {
  const lines = ['## X Signals'];
  if (items.length === 0) {
    lines.push('- X produced no items this run.');
    return lines.join('\n');
  }

  for (const item of items) {
    const when = item.createdAt ? formatTimestamp(new Date(item.createdAt), timezone) : 'time unknown';
    const text = item.text.replace(/\s+/g, ' ').slice(0, 240);
    lines.push(`- [@${item.username}: ${text}](${item.url})`);
    lines.push(`  Query: ${item.query} | ${when}`);
  }

  return lines.join('\n');
}

export function buildMarkdownReport({ runAt, timezone, alerts, prices, news, x, errors }) {
  const lines = [
    '# News Sentinel Report',
    '',
    `Generated at: ${formatTimestamp(runAt, timezone)}`,
    '',
    '## Alerts',
  ];

  if (alerts.length === 0) {
    lines.push('- No threshold alerts in this run.');
  } else {
    alerts.forEach((alert) => lines.push(`- ${alert}`));
  }

  lines.push('');
  lines.push('## Market Snapshot');
  lines.push(renderPriceLine(prices.BTC));
  lines.push(renderPriceLine(prices.ETH));
  lines.push(renderPriceLine(prices.GOLD));
  lines.push(renderPriceLine(prices.SILVER));
  lines.push('');
  lines.push(renderNews('War Developments', news.wars, timezone));
  lines.push('');
  lines.push(renderNews('Technology News', news.tech, timezone));
  lines.push('');
  lines.push(renderX(x.items, timezone));

  if (errors.length > 0) {
    lines.push('');
    lines.push('## Errors');
    errors.forEach((error) => lines.push(`- ${error}`));
  }

  lines.push('');
  return lines.join('\n');
}
