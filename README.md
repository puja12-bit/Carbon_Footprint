Carbon Copilot AI
Real-time carbon footprint estimator — see your CO₂ impact and greener alternatives as you type, like GitHub Copilot for sustainability.

What it does
Carbon Copilot AI estimates the CO₂ footprint of any everyday action — flying, driving, eating, shopping — and instantly surfaces greener alternatives ranked by impact. It works as you type, debouncing your input and returning results in under 500 ms.

Feature	Description
Live Radar	Type any action → instant CO₂ estimate + alternatives
Dashboard	Emission trends, category breakdown, weekly/monthly totals
History	Timeline of all logged actions with category filters
Achievements	Gamified progress badges (First Step, Carbon Cutter, Planet Guardian…)
Profile	Personalise diet, commute, budget sensitivity settings


Tech Stack
Frontend
React 18 + Vite — fast HMR, code-split bundles
TypeScript 5.9 — strict mode, zero any
Tailwind CSS v4 + shadcn/ui — dark forest-green + electric-teal theme
TanStack Query — server state, caching, background refetch
Recharts — emission trend and category breakdown charts
React Hook Form + Zod — type-safe form validation
Backend
Express 5 — async-native request handling
PostgreSQL + Drizzle ORM — typed queries, schema-first migrations
Helmet — CSP, HSTS, X-Frame-Options, and 5 more security headers
express-rate-limit — global 300 req/15 min + 60 req/min on estimate endpoint
Pino — structured JSON logging
Contract & Codegen
OpenAPI 3.0 spec is the single source of truth
Orval generates React Query hooks + Zod validation schemas automatically
Run pnpm --filter @workspace/api-spec run codegen after any API change
