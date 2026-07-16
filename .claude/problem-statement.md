# Project: Pulse (part of Stock Radar)

## 1. Vision / goal
Build a systematic screener for NSE-listed stocks that identifies stocks/industries showing
early signs of an uptrend — before the move is obvious to the broader market — using
technical, fundamental, and shareholding data already collected. The system defines fixed,
testable rules for **entry, target, and exit**, and must be backtestable against historical
data before any rule is trusted for real decisions. This is a personal decision-support tool,
not a recommendation engine for others; single user, no login required.

Explicitly **not** the goal: acting on non-public information ahead of other market
participants. "Early" means detecting public data footprints (delivery %, ADX build-up,
institutional stake changes, breadth) sooner than a casual chart glance would — not insider
information.

## 2. Existing data (already collected, already in MySQL)
Four tables already populated for ~750 stocks (NIFTY 50 + Next 50 + Midcap 150 +
Smallcap 250 + Microcap 250), Node.js 20 ingestion already built:

| Table | Contents |
|---|---|
| `list_of_stocks` | symbol, company name, `industry` (reliably populated), `sector` (sparse/unused), index membership, F&O flag |
| `financial_results` | quarterly/annual results — sales, profit, EPS, etc. Last 3 years |
| `shareholding` | promoter/FII/DII/public % by period. Last 3 years |
| `stock_prices` | daily OHLC, volume, delivery qty/%, no. of trades. Since 2022 |

**Grouping key = `industry`, not `sector`** (sector column is sparse/unreliable in this dataset).
**No news/sentiment data exists yet** — explicitly deferred to a later phase; too complex to
tag (government + global + corporate-announcement sources) for this phase.

## 3. Core decisions the system must make
1. **Industry selection** — rank all ~147 industries by relative strength (RS) vs. a broad
   benchmark, using excess return over 1M/3M/6M periods, confirmed by breadth (% of
   constituent stocks above 50/200 DMA). Only look at stocks within top-ranked industries.
2. **Entry** — a stock qualifies for entry only when trend (price > 50DMA > 200DMA), strength
   (ADX(14) > 20 and rising), volume/delivery confirmation, and industry RS rank (top
   quartile) all agree.
3. **Target** — price target set relative to volatility (ATR-multiple) and/or the nearest
   resistance level (52-week high), expressed as a risk-multiple (R) so it's comparable
   across all stocks regardless of price level.
4. **Exit** — triggered independently of target: hard stop (entry − 2×ATR), trend break
   (close < 50DMA), or trailing stop (highest close since entry − 2.5×ATR).
5. **Pattern analysis** — avoided as subjective visual chart-pattern matching (cup-and-handle
   etc.); replaced with quantifiable proxies: ATR/price contraction (tightening base), higher
   highs/higher lows structure, and breakout above N-day high with volume confirmation.
6. **Trend direction** — uptrend/downtrend determined the same way at both the stock level
   and the industry level, via 50/200 DMA relationship and ADX for strength of that direction.

A three-tier signal system implements this: **WATCH** (early, pre-breakout — the
"before the crowd" list), **ENTRY** (all four confirmation filters met), **EXIT** (any one
exit trigger fires against an open position).

## 4. Backend requirements
- **Stack:** Node.js 20 + TypeScript, Express 5, TypeORM, MySQL2, node-cron. Existing
  project name: `stock-radar`. New module name: **Pulse**.
- **New TypeORM entities:** `TechnicalIndicator`, `IndustryPerformance`, `Signal`,
  `BacktestTrade` — store computed indicators (SMA/EMA/RSI/MACD/ADX/ATR), industry RS
  rank/rating (with previous-day rank stored for delta display), and generated signals.
- **Daily pipeline, three sequential stages** (kept separate for dependency ordering and
  failure isolation, but exposed as **one API endpoint**, `POST /api/pulse/jobs/run-daily`,
  that awaits all three in sequence): `computeIndicators` → `rankIndustries` →
  `generateSignals`. Same scheduler function used by both `node-cron` (automatic, post
  NSE market close) and the manual API trigger.
- **REST API** (`/api/pulse/...`, no auth): ranked industries (top N + full list), stock
  screener list filtered by industry, stock detail (financials/shareholding/signal history —
  no price chart yet), today's new signals, current watchlist.
- **Backtesting:** replay the same rule functions used live against 2022+ history, backfilled
  day-by-day (no lookahead bias), including transaction cost assumptions and avoiding
  survivorship bias (via `is_active`/`previous_indices`). Compute win rate, average
  R-multiple, profit factor, max drawdown, segmented by year and industry before any rule
  set is trusted for live decisions.
- **Folder convention (assumed, pending confirmation against actual repo):**
  `src/pulse/{entity,service,job,controller}`.

## 5. Frontend requirements
- **Stack:** Angular 20, Bootstrap 5, Bootstrap Icons, ngx-bootstrap (Modal, Tabs,
  Datepicker) — all already in the existing project. New **standalone feature**,
  `features/pulse` — explicitly **not** reusing the existing `momentum`,
  `quarter-results`, or `shareholding` features (different purpose), but following the
  same folder convention they use (`models/pages/services`, a `*.routes.ts` file).
- **Dashboard layout, top to bottom:**
  1. Date picker (defaults to latest trading day; lets the whole dashboard be viewed as of
     any past date — single control, not two separate "today vs history" screens)
  2. "New Signals Today" panel — WATCH/ENTRY/EXIT signals fired on the selected date
  3. Top 10 industries by RS rank, each showing a rank-change delta (▲/▼) vs. the prior
     day; a "View all 147 →" link opens the full sortable/searchable list — not shown by
     default since 147 cards at once isn't usable
  4. Stock table filtered by the selected industry — symbol, latest signal badge, ADX,
     RSI, above/below 50 & 200 DMA flags; rows with a signal from the last 2 days get a
     "NEW" badge
- **Stock detail modal** (ngx-bootstrap Modal + Tabs), opened on row click, three tabs:
  Financials, Shareholding trend (FII/DII highlighted), Signal history. **No price chart in
  this phase** (deferred — `highcharts-angular` already available for later).
- No NgRx — plain component state + a service with `BehaviorSubject`s for selected date
  and selected industry filter is sufficient at this scale.

## 6. Explicitly deferred (not in current scope)
- News/sentiment ingestion and tagging (government/global/corporate-announcement sources)
- Price chart tab in the stock detail modal
- Authentication / multi-user support
- Watchlist / saved filters

## 7. Open items
- Actual backend `src/` folder tree not yet confirmed (current spec uses an assumed
  conventional TypeORM layout)
- Target-price logic (ATR-multiple / resistance-based) discussed but not yet written into
  the formal signal-generation section of the backend spec
