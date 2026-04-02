import { config } from './config.js';
import { writeJson, readJson, writeText } from './lib/utils.js';
import { fetchCryptoPrices, fetchMetalPrices } from './providers/prices.js';
import { fetchNews } from './providers/news.js';
import { fetchXSignals } from './providers/x.js';
import { buildMarkdownReport } from './report.js';
import { buildDashboardHtml } from './dashboard.js';
import { buildRobotsTxt, buildSitemapXml } from './seo.js';
import { sendWebhook } from './notify.js';

function buildAlerts(prices, thresholds) {
  const alerts = [];
  const specs = [
    { key: 'BTC', label: 'BTC', threshold: thresholds.btcPercent },
    { key: 'ETH', label: 'ETH', threshold: thresholds.ethPercent },
    { key: 'GOLD', label: 'Gold', threshold: thresholds.goldPercent },
    { key: 'SILVER', label: 'Silver', threshold: thresholds.silverPercent },
  ];

  for (const spec of specs) {
    const item = prices[spec.key];
    if (item?.runChange != null && Math.abs(item.runChange) >= spec.threshold) {
      const direction = item.runChange > 0 ? 'up' : 'down';
      alerts.push(`${spec.label} moved ${direction} ${item.runChange.toFixed(2)}% since the last run.`);
    }
  }

  return alerts;
}

function mergePricesWithFallback(previousPrices, freshPrices) {
  const merged = { ...freshPrices };
  const keys = ['BTC', 'ETH', 'GOLD', 'SILVER'];

  for (const key of keys) {
    if (merged[key]) continue;
    if (!previousPrices[key]) continue;

    merged[key] = {
      ...previousPrices[key],
      stale: true,
    };
  }

  return merged;
}

async function main() {
  const runAt = new Date();
  const previousState = readJson(config.paths.stateFile, {
    lastRunAt: null,
    prices: {},
  });

  const errors = [];

  const [cryptoResult, metalsResult, newsResult, xResult] = await Promise.allSettled([
    fetchCryptoPrices(previousState.prices || {}),
    fetchMetalPrices(previousState.prices || {}, config.alphaVantage.apiKey),
    fetchNews(config),
    fetchXSignals(config),
  ]);

  const crypto = cryptoResult.status === 'fulfilled' ? cryptoResult.value : {};
  if (cryptoResult.status === 'rejected') errors.push(`Crypto: ${cryptoResult.reason.message}`);

  const metals = metalsResult.status === 'fulfilled' ? metalsResult.value : {};
  if (metalsResult.status === 'rejected') errors.push(`Metals: ${metalsResult.reason.message}`);

  const news = newsResult.status === 'fulfilled' ? newsResult.value : { wars: [], tech: [], errors: [] };
  if (newsResult.status === 'rejected') errors.push(`News: ${newsResult.reason.message}`);

  const x = xResult.status === 'fulfilled' ? xResult.value : { enabled: false, items: [], errors: [] };
  if (xResult.status === 'rejected') errors.push(`X: ${xResult.reason.message}`);

  const prices = mergePricesWithFallback(previousState.prices || {}, { ...crypto, ...metals });
  const alerts = buildAlerts(prices, config.alerts);
  const allErrors = [...errors, ...(news.errors || []), ...(x.errors || [])];

  const report = buildMarkdownReport({
    runAt,
    timezone: config.timezone,
    alerts,
    prices,
    news,
    x,
    errors: allErrors,
  });
  const dashboardHtml = buildDashboardHtml({
    runAt,
    timezone: config.timezone,
    alerts,
    prices,
    news,
    x,
    errors: allErrors,
    publicSite: config.publicSite,
  });
  const robotsTxt = buildRobotsTxt(config.publicSite.siteUrl);
  const sitemapXml = buildSitemapXml(config.publicSite.siteUrl, runAt);

  writeText(config.paths.reportFile, report);
  writeText(config.paths.reportFile.replace(/latest-report\.md$/, 'dashboard.html'), dashboardHtml);
  writeText(config.paths.publicDashboardFile, dashboardHtml);
  writeText(config.paths.publicRobotsFile, robotsTxt);
  writeText(config.paths.publicSitemapFile, sitemapXml);
  writeJson(config.paths.stateFile, {
    lastRunAt: runAt.toISOString(),
    prices,
  });

  let webhookStatus = { delivered: false, reason: 'not attempted' };
  try {
    webhookStatus = await sendWebhook(config, report, alerts);
  } catch (error) {
    allErrors.push(`Webhook: ${error.message}`);
  }

  const summary = {
    runAt: runAt.toISOString(),
    reportFile: config.paths.reportFile,
    dashboardFile: config.paths.reportFile.replace(/latest-report\.md$/, 'dashboard.html'),
    publicDashboardFile: config.paths.publicDashboardFile,
    alertsCount: alerts.length,
    warItems: news.wars.length,
    techItems: news.tech.length,
    xItems: x.items.length,
    webhook: webhookStatus,
    errors: allErrors,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
