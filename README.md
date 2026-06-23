# 📈 ShareForecast

A website to **track stocks, build watchlists with price alerts, and view 7-day
forecasts** that combine a statistical price model with optional AI news
analysis. Built with Next.js, deployable for free.

> ⚠️ **Not financial advice.** Forecasts are statistical estimates and can be
> wrong. Market data is delayed ~15 minutes.

## Features

- 🔎 **Smart search** — type a company name or symbol (even misspelled) and pick
  from a live dropdown. Global coverage (US, Europe, Asia, ETFs, crypto…).
- 📊 **Interactive charts** — 1D / 1W / 1M / 1Y / 5Y price history.
- ⭐ **Watchlist** — live quotes + sparklines, saved in your browser.
- 🔔 **Price alerts** — get an in-app (and optional browser) notification when a
  stock rises above / falls below your target. Checked every minute.
- 🤖 **7-day forecast** — a trend + volatility model projects a price range with
  a 90% confidence band. When an Anthropic API key is configured, recent news
  headlines are read by Claude to add a sentiment read and short outlook that
  nudges the projection.
- 🌙 **Dark / light mode** toggle.

## Tech

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Recharts** for charts
- **yahoo-finance2** for market data (no API key required)
- **@anthropic-ai/sdk** for the optional news layer

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — only needed for the AI news layer
npm run dev
```

Open http://localhost:3000.

### Environment variables

Market data needs **no key**. The only optional variable enables the AI news layer:

| Variable | Required? | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Optional | Enables Claude-powered news sentiment in forecasts. Without it, forecasts use the statistical model only. Get one at https://console.anthropic.com |
| `ANTHROPIC_MODEL` | Optional | Override the Claude model. |

## Tests

```bash
npm test   # runs the forecast-math invariant tests
```

## Deploying

This is a **server-rendered Next.js app** (it has `/api/*` routes that fetch
from Yahoo Finance and call Claude on the server). It therefore needs a host
that can run Node — **GitHub Pages will not work** (Pages only serves static
files).

**Recommended: Vercel (free).**

1. Push this repo to GitHub.
2. Go to https://vercel.com, "Add New → Project", and import the repo.
3. (Optional) add `ANTHROPIC_API_KEY` under Project → Settings → Environment Variables.
4. Deploy. Vercel auto-detects Next.js — no config needed.

Other Node-capable hosts (Netlify, Render, Railway, Fly.io) also work.

### A note on Yahoo rate limits

Yahoo Finance sometimes rate-limits requests from shared cloud IPs (HTTP 429).
If you see empty data on a deployed instance, it's usually this — running
locally or retrying typically resolves it. For heavy use, add a caching layer
or a paid data provider.
