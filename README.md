# TrustOps AI — Reliability UX

Reviewer console for the seven approved screens: Overview, Applications, Trace Explorer, Trace Detail, RAG Diagnostics, Failure & RCA, Release Quality Gate. Next.js App Router, TypeScript, Tailwind CSS v4.

## Run

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # contract, API and component tests
pnpm typecheck && pnpm lint
```

## Data source

By default the app reads reviewed **fixtures** (`src/mocks/fixtures`) through the same typed contract the backend will serve, and the header shows a "Fixture data" badge. Set `TRUSTOPS_API_URL` to call the live platform API (`/api/v1/...`); the badge switches to "Live API".

## Structure

| Path | Purpose |
|---|---|
| `src/app` | `/` is the landing page. The console lives in the `(console)` group: `/overview`, `/applications`, `/traces`, `/traces/[traceId]` (+ `/rag`, `/investigation`), `/release-gates/[runId]` |
| `src/types` | Typed view models (`Measurement`, trace events, graph, gate, review) |
| `src/lib/api` | Transport, stable error model (`ApiError`), `settle()` for explicit screen states |
| `src/mocks` | Fixtures, mock handlers (filter/sort/pagination contract), append-only review store |
| `src/features/*` | One folder per screen plus shared evidence and review features |
| `src/components` | App shell/navigation and small UI primitives |
| `tests` | `contracts/` fixture invariants, `api/` handler behaviour, `components/` semantics |

## Principles

- The UI renders backend values; it never recomputes scores, rankings, graphs or decisions.
- Status is always icon + text + colour. "Not evaluated", "evaluator failed" and "not applicable" are never rendered as zero.
- Human review is append-only and never overwrites the machine decision; permissions are enforced by the backend, the UI only mirrors them.
- Filters live in the URL, so views are shareable and survive Back.
