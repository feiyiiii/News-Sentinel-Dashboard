import { formatNumber, formatPercent, formatTimestamp } from './lib/utils.js';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPriceCard(item, label) {
  if (!item) {
    return `
      <section class="card price-card">
        <h3>${escapeHtml(label)}</h3>
        <p class="muted">Data unavailable</p>
      </section>
    `;
  }

  const runChange = item.runChange == null ? 'n/a' : formatPercent(item.runChange);
  const dayChange = item.change24h == null ? 'n/a' : formatPercent(item.change24h);
  const tone = item.runChange > 0 ? 'up' : item.runChange < 0 ? 'down' : 'flat';

  return `
    <section class="card price-card ${tone}">
      <h3>${escapeHtml(label)}</h3>
      <div class="price">$${formatNumber(item.price)}</div>
      <p>Since last run: <strong>${escapeHtml(runChange)}</strong></p>
      <p>24h: <strong>${escapeHtml(dayChange)}</strong></p>
      <p class="muted">Source: ${escapeHtml(item.source)}</p>
    </section>
  `;
}

function renderSummaryCard(title, value, note) {
  return `
    <section class="card stat-card">
      <p class="eyebrow">${escapeHtml(title)}</p>
      <div class="stat-value">${escapeHtml(String(value))}</div>
      <p class="muted">${escapeHtml(note)}</p>
    </section>
  `;
}

function renderNewsList(title, items, timezone) {
  const content = items.length === 0
    ? '<li>No items in this run.</li>'
    : items.map((item) => {
        const when = item.publishedAt ? formatTimestamp(new Date(item.publishedAt), timezone) : 'time unknown';
        return `
          <li>
            <a href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>
            <div class="meta">${escapeHtml(item.source)} | ${escapeHtml(when)}</div>
          </li>
        `;
      }).join('');

  return `
    <section class="card">
      <h2>${escapeHtml(title)}</h2>
      <ul class="news-list">${content}</ul>
    </section>
  `;
}

function renderXList(items, timezone) {
  const content = items.length === 0
    ? '<li>X is not configured yet.</li>'
    : items.map((item) => {
        const when = item.createdAt ? formatTimestamp(new Date(item.createdAt), timezone) : 'time unknown';
        return `
          <li>
            <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">@${escapeHtml(item.username)}</a>
            <div>${escapeHtml(item.text)}</div>
            <div class="meta">${escapeHtml(item.query)} | ${escapeHtml(when)}</div>
          </li>
        `;
      }).join('');

  return `
    <section class="card">
      <h2>X Signals</h2>
      <ul class="news-list">${content}</ul>
    </section>
  `;
}

function renderErrors(errors) {
  const content = errors.length === 0
    ? '<li>No errors in this run.</li>'
    : errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('');

  return `
    <section class="card">
      <h2>Status / Missing Setup</h2>
      <ul class="error-list">${content}</ul>
    </section>
  `;
}

export function buildDashboardHtml({ runAt, timezone, alerts, prices, news, x, errors }) {
  const generatedAt = formatTimestamp(runAt, timezone);
  const totalSignals = news.wars.length + news.tech.length;
  const trackedMarkets = ['BTC', 'ETH', 'GOLD', 'SILVER'].filter((key) => prices[key]).length;
  const alertsHtml = alerts.length === 0
    ? '<li>No threshold alerts in this run.</li>'
    : alerts.map((alert) => `<li>${escapeHtml(alert)}</li>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>News Sentinel | Public Monitoring Dashboard</title>
  <meta name="description" content="A public dashboard tracking war developments, technology headlines, crypto, and metals snapshots." />
  <style>
    :root {
      --bg: #f6efe5;
      --panel: #fffaf2;
      --ink: #1c1a17;
      --muted: #6c6256;
      --line: #d8c9b5;
      --accent: #1f6b5c;
      --up: #0a7a43;
      --down: #aa3e2b;
      --shadow: 0 16px 40px rgba(70, 42, 18, 0.10);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Avenir Next", "PingFang SC", "Noto Sans SC", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(255,255,255,0.7), transparent 30%),
        linear-gradient(135deg, #f3eadf 0%, #efe1cf 50%, #ead8c0 100%);
      min-height: 100vh;
    }
    .wrap {
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px 20px 48px;
    }
    .hero {
      background: linear-gradient(135deg, rgba(31,107,92,0.94), rgba(25,53,76,0.92));
      color: white;
      padding: 28px;
      border-radius: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 20px;
    }
    .hero h1 {
      margin: 0 0 8px;
      font-size: clamp(28px, 4vw, 44px);
      line-height: 1.05;
    }
    .hero p {
      margin: 6px 0;
      color: rgba(255,255,255,0.86);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 16px;
    }
    .card {
      background: var(--panel);
      border: 1px solid rgba(216, 201, 181, 0.9);
      border-radius: 20px;
      padding: 18px;
      box-shadow: var(--shadow);
    }
    .summary, .prices, .lists {
      grid-column: 1 / -1;
    }
    .summary-grid, .price-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 14px;
    }
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 36px;
      font-weight: 750;
      line-height: 1;
      margin-bottom: 10px;
    }
    .price-card .price {
      font-size: 28px;
      font-weight: 700;
      margin: 8px 0 10px;
    }
    .price-card.up { border-left: 6px solid var(--up); }
    .price-card.down { border-left: 6px solid var(--down); }
    .price-card.flat { border-left: 6px solid var(--accent); }
    .muted, .meta {
      color: var(--muted);
      font-size: 14px;
    }
    .lists-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }
    h2, h3 {
      margin-top: 0;
    }
    ul {
      margin: 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 10px;
    }
    a {
      color: #0f4f87;
      text-decoration: none;
    }
    a:hover { text-decoration: underline; }
    .kicker {
      max-width: 760px;
      font-size: 17px;
      line-height: 1.6;
    }
    .disclaimer {
      border-left: 6px solid #d9a441;
    }
    .footer {
      margin-top: 18px;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.7;
    }
    .pill {
      display: inline-block;
      padding: 6px 10px;
      background: rgba(255,255,255,0.16);
      border: 1px solid rgba(255,255,255,0.22);
      border-radius: 999px;
      margin-right: 8px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <h1>News Sentinel</h1>
      <p class="kicker">A public monitoring dashboard for major war developments, high-signal technology news, crypto snapshots, and precious metals tracking.</p>
      <p>Last updated: ${escapeHtml(generatedAt)} (${escapeHtml(timezone)})</p>
      <span class="pill">Updated every 6 hours</span>
      <span class="pill">Public dashboard</span>
      <span class="pill">Source-linked headlines</span>
    </section>

    <section class="card summary">
      <h2>Alerts</h2>
      <ul>${alertsHtml}</ul>
    </section>

    <section class="summary">
      <div class="summary-grid">
        ${renderSummaryCard('Tracked Markets', trackedMarkets, 'BTC, ETH, Gold, and Silver snapshots')}
        ${renderSummaryCard('News Signals', totalSignals, 'Combined war and technology headlines in this update')}
        ${renderSummaryCard('War Headlines', news.wars.length, 'Highest-priority conflict-related stories')}
        ${renderSummaryCard('Tech Headlines', news.tech.length, 'Highest-priority technology stories')}
      </div>
    </section>

    <section class="prices">
      <div class="price-grid">
        ${renderPriceCard(prices.BTC, 'Bitcoin')}
        ${renderPriceCard(prices.ETH, 'Ethereum')}
        ${renderPriceCard(prices.GOLD, 'Gold')}
        ${renderPriceCard(prices.SILVER, 'Silver')}
      </div>
    </section>

    <section class="lists">
      <div class="lists-grid">
        ${renderNewsList('War Developments', news.wars, timezone)}
        ${renderNewsList('Technology News', news.tech, timezone)}
        ${renderXList(x.items, timezone)}
        ${renderErrors(errors)}
      </div>
    </section>

    <section class="card disclaimer">
      <h2>Public Notes</h2>
      <ul>
        <li>This page is an automated public snapshot, not investment advice or war-zone verification.</li>
        <li>Each headline links to its original source for direct reading and independent judgment.</li>
        <li>X monitoring is currently disabled in the public version to avoid unstable API credit usage.</li>
      </ul>
    </section>

    <div class="footer">
      Public page generated by News Sentinel Bot.
      <br />
      Designed for lightweight public monitoring, with emphasis on readable summaries and source visibility.
    </div>
  </main>
</body>
</html>`;
}
