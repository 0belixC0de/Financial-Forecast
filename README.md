# 📈 ShareForecast

A **static website** to track stocks, set price alerts, and view 7-day price
forecasts across **US & European markets**. Runs entirely in the browser — no
server needed — so it hosts for free on **GitHub Pages**.

> ⚠️ **Not financial advice.** Forecasts are statistical estimates from past
> prices and can be wrong.

## Features

- 🔎 **Smart search** — type a company name or symbol (US, Germany, France, UK,
  Italy, …) and pick from a live dropdown.
- 📊 **Interactive charts** — 1D / 1W / 1M / 1Y / 5Y price history.
- ⭐ **Watchlist** — live quotes, saved in your browser.
- 🔔 **Price alerts** — in-app (and optional browser) notification when a stock
  rises above / falls below your target.
- 🤖 **7-day forecast** — a trend + volatility model projects a price range with
  a 90% confidence band, nudged by a transparent **price-momentum** signal.
- 🌙 **Dark / light** theme toggle.

## How data works

Market data comes from **[Twelve Data](https://twelvedata.com)**, which is
free and works directly from the browser (so it's compatible with static
hosting). You add your own free API key the first time you open the site —
it's stored **only in your browser** (localStorage) and never committed to the
repo or sent anywhere else.

Get a key (≈10 seconds, no credit card): https://twelvedata.com/register

> **Free-tier limits:** 8 requests/min, 800/day. The app polls conservatively,
> but if you see a "rate limit" message, just wait a moment.

## Tech

- **Vite + React + TypeScript**
- **Tailwind CSS** for styling
- **Recharts** for charts
- **Twelve Data** REST API (client-side)

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173/Financial-Forecast/
npm test         # forecast-math unit tests
npm run build    # production build into dist/
```

## Deploy on GitHub Pages (automatic)

This repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`) that
builds and publishes the site on every push to `main`.

**One-time setup:**

1. Push to GitHub (already done if you're reading this on GitHub).
2. In your repo: **Settings → Pages → Build and deployment → Source = "GitHub Actions"**.
3. That's it. The next push to `main` deploys automatically; your site appears at
   **https://&lt;your-username&gt;.github.io/Financial-Forecast/**

When the page loads, click **API key** (top right) and paste your free Twelve
Data key.

> **Forked or renamed the repo?** The site's base path is the repo name
> (`/Financial-Forecast/`). If your repo has a different name, set the
> `VITE_BASE` env var (e.g. `VITE_BASE=/my-repo/`) — or it's read automatically
> from `vite.config.ts`.
