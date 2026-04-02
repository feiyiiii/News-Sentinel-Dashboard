# News Sentinel Bot

A Node.js monitoring bot that runs every 6 hours and produces a Markdown report covering:

- War developments from major news feeds
- Important technology headlines
- Gold and silver prices
- BTC and ETH price moves
- Optional X monitoring through the official X API
- Optional webhook delivery to Slack, Discord, or a generic JSON endpoint
- Optional WeCom group robot delivery for enterprise WeChat alerts

## Why this structure

This version is designed to be easy to operate:

- No third-party runtime dependencies
- Works with plain Node.js 20+
- Stores state locally so it can compare prices with the previous run
- Writes a human-readable report to `output/latest-report.md`
- Can be triggered by cron, a serverless scheduler, or Codex automation

## Quick start

1. Copy `.env.example` to `.env`
2. Fill in any optional credentials you want to enable
3. Run:

```bash
npm start
```

Or simply double-click:

```text
start.command
```

This will run the bot and open the local dashboard automatically.

## Publish it on the internet

This project can be published as:

- A public GitHub repository
- A public GitHub Pages website
- A scheduled GitHub Actions workflow that refreshes the dashboard every 6 hours

The generated public page is written to:

- `docs/index.html`

Important:

- Do not commit `.env`
- Keep API keys in GitHub repository secrets, not in the repo
- `docs/index.html` is safe to publish because it only contains fetched results, not your keys

## Environment variables

- `X_BEARER_TOKEN`: optional. Required if you want official X scanning.
- `X_QUERIES`: optional. Comma-separated X recent-search queries.
- `WEBHOOK_URL`: optional. If set, the report is pushed after each run.
- `WEBHOOK_FORMAT`: `generic-json`, `slack`, or `discord`.
- `WECHAT_WORK_WEBHOOK_URL`: optional. If set, it takes priority and sends the report to a WeCom group robot.
- `ALPHA_VANTAGE_API_KEY`: optional. Defaults to `demo` for gold/silver spot requests.
- `BTC_ALERT_PERCENT`, `ETH_ALERT_PERCENT`, `GOLD_ALERT_PERCENT`, `SILVER_ALERT_PERCENT`: per-run alert thresholds.
- `STATE_FILE`: path to local state JSON.
- `REPORT_FILE`: path to the generated Markdown report.

## Scheduling every 6 hours

### Option 1: cron

```cron
0 */6 * * * cd /Users/feiyi/Documents/New\ project/news-sentinel-bot && /usr/bin/env node src/index.js >> ./output/cron.log 2>&1
```

### Option 2: Codex automation

Create a recurring automation that runs in `/Users/feiyi/Documents/New project/news-sentinel-bot` every 6 hours and opens the report/output after completion.

### Option 3: GitHub Actions + GitHub Pages

This repo can also run fully in GitHub:

1. Push the project to a GitHub repository
2. Add repository secret `ALPHA_VANTAGE_API_KEY`
3. Optionally add `X_BEARER_TOKEN` and `X_QUERIES`
4. Enable GitHub Pages from the `main` branch and `/docs` folder
5. GitHub Actions will regenerate `docs/index.html` every 6 hours

## Important notes

### X / x.com scanning

Direct anonymous scraping of x.com is not stable and often breaks because of rate limits, sign-in gates, and changing HTML. This bot therefore uses the official X API as an optional integration instead of brittle scraping.

### WeCom / 企业微信

The fastest production path is a WeCom group robot webhook. Create a robot in an internal WeCom group and paste the webhook URL into `WECHAT_WORK_WEBHOOK_URL`. The bot will then send a markdown summary after each run.

### Gold and silver prices

The implementation uses Alpha Vantage's official gold/silver spot endpoint. The default `demo` key is useful for testing, but for stable production monitoring we should switch to your own API key.

### News source stability

RSS feeds can occasionally change or rate-limit. The bot keeps going even if some feeds fail and records those failures in the report.

## Output

- Markdown report: `output/latest-report.md`
- Local dashboard: `output/dashboard.html`
- Public dashboard for GitHub Pages: `docs/index.html`
- State snapshot: `data/state.json`

## Next upgrades I recommend

- Add an LLM summarizer for Chinese executive summaries
- Push alerts to Telegram instead of a generic webhook
- Persist articles and prices to SQLite for charts and trend analysis
- Add a lightweight web dashboard
