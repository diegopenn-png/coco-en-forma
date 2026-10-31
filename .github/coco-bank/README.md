# Coco Bank — investment learning simulator

## Release 4.0.0 · 31 October 2026

Diego requested a monthly virtual allowance for investing, with no household expenses or target. The current experience replaces the previous household bank.

- Four sections: My money, Invest, Portfolio, Learn. Existing Coco artwork and authenticated iframe bridge remain.
- Exactly 20 listed companies, each with business description, valuation explanation, possible upside/downside drivers and issuer source. Waymo is discussed under Alphabet; no invented Waymo ticker.
- Two equity ETFs (VT, VOO), two Treasury ETFs (IEF, SGOV), and an educational fixed-term deposit using the ECB €STR reference. Bond funds are explicitly distinguished from individual bonds and guarantees.
- BTC prices and selling remain for legacy holdings only; no new purchases in the child catalogue.
- A short understanding question and an investment reason precede purchases. Reasons are retained in a capped decision journal. No activity/return leaderboard or trading rewards.
- Hypothetical compound-growth laboratory is isolated from the portfolio, with variable positive, zero or negative assumptions. No promised return.

## Money and migration

UI amounts are euros; the internal action API retains the older CB unit conversion (1 CB = €10), and stored money is integer euro cents. Auth is scoped to the server-verified account UUID, with parental PIN for assignment changes. Monthly allowances are issued once per original payroll anniversary. Orders reserve cash and wait for a later observation, with freshness checks.

On authenticated access or daily settlement, previous household settings and receipts are archived once; outstanding bills no longer apply. Previously paid bills are not refunded. Cash, holdings, deposits, orders, payroll history and the ledger are retained. No account reset or user impersonation is performed.

## Market data

Snapshots are stored in the existing D1 market_snapshots table. The Worker refreshes at 12:00 and 22:15 UTC daily. Yahoo Finance daily raw closes cover the 20 equities and four ETFs, and the ECB supplies currencies and €STR. BTC legacy prices use Coinbase. Source identifiers, observation timestamps and fetch times are retained. Missing/stale data disable new operations; no synthetic market fallback. The UI labels these as reference prices, not live executions.

The fixed-term product is a simulation at an ECB reference rate, not a retail bank quote. Funds use real ETF prices. Fractional trades omit brokerage commissions and taxes, while fund operating costs are embedded in prices. Dividends are simplified to ex-dividend processing with available FX; full brokerage tax/record-date handling is outside the simulation. Provider endpoints remain the existing integrations; no paid feed or subscription was activated.

## Validation

Run `node --test .github/coco-bank/test/*.test.mjs`. The legacy financial tests remain regression coverage. Current UI tests cover the investing journey, 20-company catalogue, all asset groups, disabled old expenses, migration and compounding.

`COCO_JSDOM_PATH=/path/to/jsdom node .github/coco-bank/test/ui-flow.cjs` exercises real serialized DOM forms with synthetic auth/state: create account, parental PIN, one-step setup, receive allowance, company quiz, buy/cancel, deposit, laboratory, previous screen and main menu. It does not prove physical-device rendering. Chromium download was unavailable in this runtime.

Company source URLs are embedded in the catalogue. Learning sources: Investor.gov introduction to investing, diversification and compound-interest calculator; Vanguard ETF profiles; iShares fund documentation; Alphabet/Waymo issuer disclosures. Possible price drivers are educational scenarios, not current-news attribution or forecasts.
