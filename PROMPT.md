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
- Use **Finnhub** (https://finnhub.io) as the **primary** free financial-data API. Its free tier allows ~60 API calls/min and — crucially — a **real-time WebSocket** for US stock trades, which is ideal for live charts. Use **Yahoo Finance** (`yahoo-finance2` npm package, no key) and/or **Alpha Vantage** as fallbacks for historical candles if a Finnhub endpoint isn't available on the free tier.
- All API keys must be read from environment variables (`FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`, etc.). Never hard-code them.
- Provide a `.env.example` file listing every required variable.
- **Live chart data:** Subscribe to the Finnhub **WebSocket** (`wss://ws.finnhub.io?token=FINNHUB_API_KEY`) for real-time trade updates and push them onto the chart as they arrive. Show a "last updated" timestamp and a live/paused indicator. Fall back to polling the REST quote endpoint if the socket drops, and degrade gracefully (cache last good data, show a notice) when rate-limited. Note that the WebSocket needs a client-side connection — keep the token handling sensible (it's a publishable browser key on the free tier, but document this).

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

  - **Mathematical/statistical layer:** Compute a quantitative forecast from historical price data. Use a sensible, explainable approach — e.g. moving averages + linear/polynomial trend regression, plus volatility bands, and optionally a simple time-series model (ARIMA-style or Holt-Winters). Output a projected price range (not a single magic number) with a confidence band over a chosen horizon (e.g. 7 / 30 days).

  - **News/sentiment layer:** Pull recent **worldwide news** relevant to the ticker, its sector, and macro conditions (Finnhub has a free company-news endpoint; Alpha Vantage's NEWS_SENTIMENT or NewsAPI/GNews also work — key in env vars). Feed the headlines/summaries to a **Large Language Model (use Anthropic's Claude — the latest model)** to produce a sentiment read and a short qualitative outlook.

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
- Clean, typed, well-organized code with clear separation: data layer (API clients), domain logic (forecasting math, alert evaluation), and UI.
- A thorough `README.md` covering: what it does, the stack, how to get the free API keys, how to set env vars, how to run locally (`npm install && npm run dev`), and how to deploy to Vercel.
- `.env.example` with every variable.
- Basic tests for the forecasting math and alert-evaluation logic.
- Commit the code so it runs from the GitHub repository.

### Suggested build order
1. Project scaffold (Next.js + Tailwind + shadcn/ui) and `.env.example`.
2. Market-data client (Alpha Vantage / Yahoo) with caching + rate-limit handling.
3. Ticker search + detail page with live chart.
4. Watchlists (localStorage) + live sparklines.
5. Alerts (set, persist, evaluate on the polling loop, notify).
6. Statistical forecast layer (math + confidence bands on chart).
7. News fetch + Claude-powered sentiment/outlook, blended into the forecast card.
8. Polish: disclaimers, error/empty states, responsive design, README.

Deliver a working MVP first (steps 1–5), then layer in the forecast (6–8).

---

## Notes & options (for you, the requester)

- **Why Next.js?** It runs cleanly from a GitHub repo, deploys to Vercel for free, and lets the
  Claude/news API calls run server-side so your keys stay secret.
- **Free API keys you'll need:**
  - **Finnhub (primary, recommended for live data):** https://finnhub.io — sign up with email, key shown instantly. Free tier: ~60 calls/min + real-time WebSocket for US stocks.
  - (Optional fallback) Yahoo Finance via the `yahoo-finance2` npm package — no key needed.
  - (Optional fallback) Alpha Vantage: https://www.alphavantage.co/support/#api-key
  - A news source — Finnhub's company-news endpoint is free; Alpha Vantage `NEWS_SENTIMENT` or NewsAPI/GNews also work.
  - Anthropic API key for Claude (the news-analysis layer): https://console.anthropic.com
- **Rate limits:** Finnhub's free tier (~60 calls/min + WebSocket) is far better for live charts than
  Alpha Vantage (~25 requests/day). The WebSocket gives genuine real-time updates without burning REST calls.
- **About getting the key:** I can't create the account or fetch the key for you — it requires signing up
  with your email and accepting the provider's terms. Finnhub signup takes ~30 seconds; paste the key into
  your env vars (and into Vercel's environment settings when you deploy).
- **Want it simpler / no-code?** Paste the **PROMPT** section into v0, Bolt, or Lovable instead.
- **Want me to actually build it** in this repo (not just write the prompt)? Just say the word and
  I'll scaffold the app on this branch.
