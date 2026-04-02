import { formatNumber, formatPercent, formatTimestamp } from './lib/utils.js';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderLang(en, zh) {
  return `<span class="lang lang-en">${escapeHtml(en)}</span><span class="lang lang-zh">${escapeHtml(zh)}</span>`;
}

function renderHtmlLang(enHtml, zhHtml) {
  return `<span class="lang lang-en">${enHtml}</span><span class="lang lang-zh">${zhHtml}</span>`;
}

function renderPriceCard(item, englishLabel, chineseLabel) {
  if (!item) {
    return `
      <section class="card price-card">
        <h3>${renderLang(englishLabel, chineseLabel)}</h3>
        <p class="muted">${renderLang('Data unavailable', '暂无数据')}</p>
      </section>
    `;
  }

  const runChange = item.runChange == null ? 'n/a' : formatPercent(item.runChange);
  const dayChange = item.change24h == null ? 'n/a' : formatPercent(item.change24h);
  const tone = item.runChange > 0 ? 'up' : item.runChange < 0 ? 'down' : 'flat';

  return `
    <section class="card price-card ${tone}">
      <h3>${renderLang(englishLabel, chineseLabel)}</h3>
      <div class="price">$${formatNumber(item.price)}</div>
      <p>${renderLang('Since last run', '较上次运行')}: <strong>${escapeHtml(runChange)}</strong></p>
      <p>24h: <strong>${escapeHtml(dayChange)}</strong></p>
      <p class="muted">${renderLang('Source', '来源')}: ${escapeHtml(item.source)}</p>
    </section>
  `;
}

function renderSummaryCard(englishTitle, chineseTitle, value, englishNote, chineseNote) {
  return `
    <section class="card stat-card">
      <p class="eyebrow">${renderLang(englishTitle, chineseTitle)}</p>
      <div class="stat-value">${escapeHtml(String(value))}</div>
      <p class="muted">${renderLang(englishNote, chineseNote)}</p>
    </section>
  `;
}

function renderLiveCounterCard(goatcounterEnabled) {
  const value = goatcounterEnabled
    ? renderHtmlLang('<span id="live-total-visits-en">Loading...</span>', '<span id="live-total-visits-zh">加载中...</span>')
    : renderLang('Disabled', '未启用');
  const note = goatcounterEnabled
    ? renderLang('Near-real-time public visits via GoatCounter', '通过 GoatCounter 展示接近实时的公开访问量')
    : renderLang('Set GOATCOUNTER_ENDPOINT to enable public visit stats', '设置 GOATCOUNTER_ENDPOINT 以启用公开访问量统计');

  return `
    <section class="card stat-card">
      <p class="eyebrow">${renderLang('Public Visits', '公开访问量')}</p>
      <div class="stat-value">${value}</div>
      <p class="muted">${note}</p>
    </section>
  `;
}

function renderNewsList(englishTitle, chineseTitle, items, timezone) {
  const content = items.length === 0
    ? `<li>${renderLang('No items in this run.', '本轮暂无内容。')}</li>`
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
      <h2>${renderLang(englishTitle, chineseTitle)}</h2>
      <ul class="news-list">${content}</ul>
    </section>
  `;
}

function renderXList(items, timezone) {
  const content = items.length === 0
    ? `<li>${renderLang('X is not configured yet.', 'X 功能暂未配置。')}</li>`
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
      <h2>${renderLang('X Signals', 'X 信号')}</h2>
      <ul class="news-list">${content}</ul>
    </section>
  `;
}

function renderErrors(errors) {
  const content = errors.length === 0
    ? `<li>${renderLang('No errors in this run.', '本轮无错误。')}</li>`
    : errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('');

  return `
    <section class="card">
      <h2>${renderLang('Status / Missing Setup', '状态 / 待完善配置')}</h2>
      <ul class="error-list">${content}</ul>
    </section>
  `;
}

export function buildDashboardHtml({ runAt, timezone, alerts, prices, news, x, errors, publicSite }) {
  const generatedAt = formatTimestamp(runAt, timezone);
  const totalSignals = news.wars.length + news.tech.length;
  const trackedMarkets = ['BTC', 'ETH', 'GOLD', 'SILVER'].filter((key) => prices[key]).length;
  const canonicalUrl = publicSite.siteUrl;
  const goatcounterEnabled = Boolean(publicSite.goatcounterEndpoint);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: publicSite.title,
    url: canonicalUrl,
    description: publicSite.description,
    inLanguage: ['en', 'zh-CN'],
  };
  const alertsHtml = alerts.length === 0
    ? `<li>${renderLang('No threshold alerts in this run.', '本轮未触发阈值告警。')}</li>`
    : alerts.map((alert) => `<li>${escapeHtml(alert)}</li>`).join('');

  const analyticsScript = goatcounterEnabled ? `
  <script data-goatcounter="${escapeHtml(publicSite.goatcounterEndpoint)}" async src="https://gc.zgo.at/count.js"></script>
  <script>
    (function() {
      var enTarget = document.getElementById('live-total-visits-en');
      var zhTarget = document.getElementById('live-total-visits-zh');
      var endpoint = ${JSON.stringify(publicSite.goatcounterEndpoint)};
      function setText(enValue, zhValue) {
        if (enTarget) enTarget.textContent = enValue;
        if (zhTarget) zhTarget.textContent = zhValue;
      }
      try {
        var url = new URL(endpoint);
        fetch(url.origin + '/counter/TOTAL.json')
          .then(function(response) { return response.json(); })
          .then(function(data) {
            var count = data.count || '0';
            setText(String(count), String(count));
          })
          .catch(function() {
            setText('Unavailable', '暂不可用');
          });
      } catch (error) {
        setText('Unavailable', '暂不可用');
      }
    })();
  </script>` : '';

  return `<!doctype html>
<html lang="zh-CN" data-lang="zh">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(publicSite.title)} | Public Monitoring Dashboard | 公开监控看板</title>
  <meta name="description" content="${escapeHtml(`${publicSite.description} 面向公开访问的战争、科技、加密货币与贵金属监控看板。`)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(publicSite.title)} | Public Monitoring Dashboard | 公开监控看板" />
  <meta property="og:description" content="${escapeHtml(`${publicSite.description} 面向公开访问的战争、科技、加密货币与贵金属监控看板。`)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:site_name" content="${escapeHtml(publicSite.title)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(publicSite.title)} | Public Monitoring Dashboard | 公开监控看板" />
  <meta name="twitter:description" content="${escapeHtml(`${publicSite.description} 面向公开访问的战争、科技、加密货币与贵金属监控看板。`)}" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
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
    html[data-lang="zh"] .lang-en,
    html[data-lang="en"] .lang-zh {
      display: none;
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
      position: relative;
    }
    .language-toggle {
      position: absolute;
      right: 24px;
      top: 24px;
      display: flex;
      gap: 8px;
    }
    .lang-button {
      border: 1px solid rgba(255,255,255,0.26);
      background: rgba(255,255,255,0.12);
      color: white;
      border-radius: 999px;
      padding: 8px 14px;
      cursor: pointer;
      font: inherit;
    }
    .lang-button.is-active {
      background: rgba(255,255,255,0.24);
      border-color: rgba(255,255,255,0.55);
    }
    .hero h1 {
      margin: 0 0 8px;
      font-size: clamp(28px, 4vw, 44px);
      line-height: 1.05;
      padding-right: 140px;
    }
    .hero p {
      margin: 6px 0;
      color: rgba(255,255,255,0.86);
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
    h2, h3 { margin-top: 0; }
    ul { margin: 0; padding-left: 20px; }
    li { margin-bottom: 10px; }
    a { color: #0f4f87; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .kicker {
      max-width: 760px;
      font-size: 17px;
      line-height: 1.6;
    }
    .disclaimer { border-left: 6px solid #d9a441; }
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
    @media (max-width: 720px) {
      .language-toggle {
        position: static;
        margin-bottom: 16px;
      }
      .hero h1 {
        padding-right: 0;
      }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <div class="language-toggle" aria-label="Language switcher">
        <button class="lang-button" data-set-lang="zh">中文</button>
        <button class="lang-button" data-set-lang="en">EN</button>
      </div>
      <h1>News Sentinel</h1>
      <p class="kicker">${renderLang(
        'A public monitoring dashboard for major war developments, high-signal technology news, crypto snapshots, and precious metals tracking.',
        '一个面向公开访问的监控看板，聚焦战争动态、重要科技新闻、加密货币快照与贵金属追踪。'
      )}</p>
      <p>${renderLang('Last updated', '最后更新')}: ${escapeHtml(generatedAt)} (${escapeHtml(timezone)})</p>
      <span class="pill">${renderLang('Updated every 6 hours', '每 6 小时更新')}</span>
      <span class="pill">${renderLang('Public dashboard', '公开看板')}</span>
      <span class="pill">${renderLang('Source-linked headlines', '附原始来源链接')}</span>
    </section>

    <section class="card summary">
      <h2>${renderLang('Alerts', '告警')}</h2>
      <ul>${alertsHtml}</ul>
    </section>

    <section class="summary">
      <div class="summary-grid">
        ${renderSummaryCard('Tracked Markets', '监控市场', trackedMarkets, 'BTC, ETH, Gold, and Silver snapshots', 'BTC、ETH、黄金与白银快照')}
        ${renderSummaryCard('News Signals', '新闻信号', totalSignals, 'Combined war and technology headlines in this update', '本轮战争与科技头条合计')}
        ${renderSummaryCard('War Headlines', '战争头条', news.wars.length, 'Highest-priority conflict-related stories', '优先级最高的冲突相关动态')}
        ${renderSummaryCard('Tech Headlines', '科技头条', news.tech.length, 'Highest-priority technology stories', '优先级最高的科技动态')}
        ${renderLiveCounterCard(goatcounterEnabled)}
      </div>
    </section>

    <section class="prices">
      <div class="price-grid">
        ${renderPriceCard(prices.BTC, 'Bitcoin', '比特币')}
        ${renderPriceCard(prices.ETH, 'Ethereum', '以太坊')}
        ${renderPriceCard(prices.GOLD, 'Gold', '黄金')}
        ${renderPriceCard(prices.SILVER, 'Silver', '白银')}
      </div>
    </section>

    <section class="lists">
      <div class="lists-grid">
        ${renderNewsList('War Developments', '战争动态', news.wars, timezone)}
        ${renderNewsList('Technology News', '科技新闻', news.tech, timezone)}
        ${renderXList(x.items, timezone)}
        ${renderErrors(errors)}
      </div>
    </section>

    <section class="card disclaimer">
      <h2>${renderLang('Public Notes', '公开说明')}</h2>
      <ul>
        <li>${renderLang('This page is an automated public snapshot, not investment advice or war-zone verification.', '本页面为自动化公开快照，不构成投资建议，也不构成战区事实核验。')}</li>
        <li>${renderLang('Each headline links to its original source for direct reading and independent judgment.', '每条头条都附有原始来源链接，方便直接阅读并独立判断。')}</li>
        <li>${renderLang('X monitoring is currently disabled in the public version to avoid unstable API credit usage.', '为避免不稳定的 API 积分消耗，公开版当前关闭了 X 监控。')}</li>
      </ul>
    </section>

    <div class="footer">
      ${renderLang('Public page generated by News Sentinel Bot.', '本公开页面由 News Sentinel Bot 自动生成。')}
      <br />
      ${renderLang('Designed for lightweight public monitoring, with emphasis on readable summaries and source visibility.', '面向轻量化公开监控场景，强调易读摘要与来源可追溯性。')}
    </div>
  </main>
  <script>
    (function() {
      var html = document.documentElement;
      var storageKey = 'news-sentinel-lang';
      var saved = localStorage.getItem(storageKey);
      var browserLang = (navigator.language || '').toLowerCase();
      var initial = saved || (browserLang.startsWith('zh') ? 'zh' : 'en');
      function applyLang(lang) {
        html.setAttribute('data-lang', lang);
        html.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
        document.querySelectorAll('[data-set-lang]').forEach(function(button) {
          button.classList.toggle('is-active', button.getAttribute('data-set-lang') === lang);
        });
      }
      document.querySelectorAll('[data-set-lang]').forEach(function(button) {
        button.addEventListener('click', function() {
          var lang = button.getAttribute('data-set-lang');
          localStorage.setItem(storageKey, lang);
          applyLang(lang);
        });
      });
      applyLang(initial);
    })();
  </script>
  ${analyticsScript}
</body>
</html>`;
}
