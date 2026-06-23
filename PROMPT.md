# Build Prompt: "ShareForecast" — A Live Share-Forecasting Web App

> Copy everything inside this file (or just the **PROMPT** section below) and hand it
> to an AI coding tool (Claude Code, Cursor, v0, Bolt, etc.) or a developer.
> It is written to be self-contained.

---

## PROMPT

Build a production-quality web application called **ShareForecast** that lets users
track stocks, build watchlists with alerts, and view AI-generated price forecasts that
combine **mathematical/statistical modeling** with **current worldwide news analysis**.

### Tech stack
- **Framework:** Next.js (App Router) with TypeScript and React.
- **Styling:** Tailwind CSS + shadcn/ui components. Clean, modern, dark-mode-first dashboard look.
- **Charts:** A live, interactive chart library (e.g. `lightweight-charts` by TradingView, or Recharts) with candlestick + line views.
- **Data fetching:** React Server Components + a lightweight client cache (TanStack Query) for live updates.
- **Deployment target:** GitHub repository → deployable on Vercel with zero config. Keep all secrets in environment variables.

### Market data source
- **Use Yahoo Finance as the only data source**, via the **`yahoo-finance2`** npm package (the Node.js equivalent of Python's `yfinance`). **No API key, no signup, no rate-limit dashboard.** Do not integrate Finnhub, Alpha Vantage, or any other provider.
- It covers both **US and European** markets (e.g. `AAPL`, `BMW.DE`, `AIR.PA`, `VOD.L`) and provides quotes, historical candles, company info, and news — everything this app needs.
- All Yahoo calls must run **server-side** (Next.js API routes / server actions); the `yahoo-finance2` package is Node-only and shouldn't run in the browser.
- **Quotes are delayed ~15 minutes — this is fine and expected.** Forecasts target a 7-day horizon, so intraday precision doesn't matter.
- **"Live" chart data:** Poll the server quote endpoint on a modest interval (e.g. every 30–60s) and update the chart as new data arrives. Show a "last updated" timestamp, a "~15 min delayed" badge, and a live/paused toggle. Degrade gracefully if a request fails (keep last good data, show a notice).

### Core features

**1. Search & ticker pages**
- Search bar to look up any stock by symbol or company name.
- A detail page per ticker showing: live price, daily change (% and absolute), an interactive historical chart (1D / 1W / 1M / 1Y / 5Y ranges), and key stats (volume, market cap, 52-week high/low if available).

**2. Watchlists**
- Users can add/remove tickers to a personal watchlist.
- Watchlist view shows live prices, daily change, and a mini sparkline per ticker.
- Persist watchlists (start with `localStorage` for a no-auth MVP; structure the code so it can later move to a database + user accounts).

**3. Alerts**
- Users can set price alerts per ticker (e.g. "notify when AAPL > $200" or "< $150", or "% move > X in a day").
- When an alert condition is met, show an in-app notification/toast and a visual badge. (Browser notifications optional; email/push noted as a future enhancement.)
- Alerts are checked against the same live polling loop.

**4. AI Forecast (the headline feature)**
Generate a forward-looking forecast for a selected ticker by **combining two signals**:

  - **Mathematical/statistical layer:** Compute a quantitative **7-day forecast** from historical price data (pulled from Yahoo Finance). Use a sensible, explainable approach — e.g. moving averages + linear/polynomial trend regression, plus volatility bands, and optionally a simple time-series model (ARIMA-style or Holt-Winters). Output a projected price range (not a single magic number) with a confidence band over the 7-day horizon.

  - **News/sentiment layer:** Pull recent **worldwide news** relevant to the ticker using Yahoo Finance's news data (available through `yahoo-finance2`). Feed the headlines/summaries to a **Large Language Model (use Anthropic's Claude — the latest model)** to produce a sentiment read and a short qualitative outlook.

  - **Combine them:** Blend the statistical projection with the news sentiment into a single, clearly-labeled forecast card that shows:
    - Projected price range + confidence band, overlaid on the chart as a shaded future region.
    - A short natural-language summary ("why") citing the key news drivers.
    - A sentiment score/label (bullish / neutral / bearish).
    - The forecast horizon and the timestamp it was generated.

  - The LLM call must run **server-side** (API route / server action) so the Claude API key (`ANTHROPIC_API_KEY`) is never exposed to the browser. Use the official `@anthropic-ai/sdk`.

### Important UX & trust requirements
- Show a clear, persistent **disclaimer**: this is not financial advice; forecasts are estimates and can be wrong.
- Always present forecasts as **ranges with uncertainty**, never as guarantees.
- Make data sources and "last updated" times visible.
- Handle loading, empty, and error states everywhere. Be resilient to API rate limits and downtime.

### Code quality & deliverables
- Clean, typed, well-organized code with clear separation: data layer (Yahoo Finance client), domain logic (forecasting math, alert evaluation), and UI.
- A thorough `README.md` covering: what it does, the stack, how to set the one env var (`ANTHROPIC_API_KEY`), how to run locally (`npm install && npm run dev`), and how to deploy to Vercel. Note that market data needs no key.
- `.env.example` (only `ANTHROPIC_API_KEY` is required).
- Basic tests for the forecasting math and alert-evaluation logic.
- Commit the code so it runs from the GitHub repository.

### Suggested build order
1. Project scaffold (Next.js + Tailwind + shadcn/ui) and `.env.example`.
2. Yahoo Finance data client (server-side, via `yahoo-finance2`) with caching.
3. Ticker search + detail page with chart (US + European symbols).
4. Watchlists (localStorage) + live sparklines.
5. Alerts (set, persist, evaluate on the polling loop, notify).
6. Statistical 7-day forecast layer (math + confidence bands on chart).
7. News fetch (Yahoo) + Claude-powered sentiment/outlook, blended into the forecast card.
8. Polish: disclaimers, "~15 min delayed" badge, error/empty states, responsive design, README.

Deliver a working MVP first (steps 1–5), then layer in the forecast (6–8).

---

## Notes & options (for you, the requester)

- **Why Next.js?** It runs cleanly from a GitHub repo, deploys to Vercel for free, and lets the
  Yahoo Finance + Claude calls run server-side so the only key you have stays secret.
- **The only key you need:**
  - **Anthropic API key for Claude** (the news-analysis layer): https://console.anthropic.com
  - **Market data needs NO key** — `yahoo-finance2` works out of the box.
- **Data:** Yahoo Finance only. US + European markets, quotes delayed ~15 min, which is fine for a
  7-day forecast. No rate-limit signup to worry about.
- **European symbols:** use the exchange suffix, e.g. `BMW.DE` (Frankfurt), `AIR.PA` (Paris),
  `VOD.L` (London), `ENEL.MI` (Milan).
- **Want it simpler / no-code?** Paste the **PROMPT** section into v0, Bolt, or Lovable instead.
- **Want me to actually build it** in this repo (not just write the prompt)? Just say the word and
  I'll scaffold the app on this branch.
