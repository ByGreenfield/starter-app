# Working on this app

This is a **Greenfield starter-app** site: a Next.js app with its own Postgres database (Drizzle ORM), hosted on Render, managed through the Greenfield Swarm control plane. It is a booking app for a small business. The owner and their staff describe changes in plain language; you make them.

## Purpose and audience

Read `content/site.json` first: it names the business and says what the app is for. Customers use it on their phones to ask for a booking; the business reads its data through the control plane. Keep pages fast, readable and simple.

## Where things live

- `content/`: the business name, tagline, intro text, contact details and hours. Most wording edits happen here.
- `src/db/schema.ts`: the tables (Drizzle). `drizzle/`: the migrations that build them. `data/dictionary.yaml`: every table and column in business words, with personal-data columns marked.
- `src/app/`: pages and API routes (Next.js App Router). `src/lib/`: server actions and loaders. `src/components/`: UI.
- `scripts/`: migrate, preview seeding, dictionary and migration checks. Do not change them without a platform role.
- `tests/`: Vitest unit tests and the Playwright smoke suite.

## How to work

1. Work on a branch. If your session already gave you one (cloud sessions create `claude/...` branches), use it; otherwise name it `change/<short-slug>`. Never push to `main` or `staging`.
2. Make the change. Prefer `content/` for words; prefer data changes through the control plane's data tools over code when the request is about one customer's or one booking's details.
3. Run `pnpm check`. It runs everything CI runs: format, lint, typecheck, the dictionary check, unit tests, the build and the smoke suite. It needs a local Postgres (`DATABASE_URL`, see `.env.example`) with migrations applied (`pnpm db:migrate`). Fix what fails before opening the PR.
4. Open a pull request with:
   - a one-paragraph summary in plain language a business owner understands (what changed and why, no file names),
   - a `## What to look at` section listing the pages to check on the preview link.
5. Render builds a preview for the PR automatically, with its own database seeded from a scrubbed copy of production, so it looks like the real thing with fake personal details. The owner reviews it there and releases it through the control plane. You do not deploy.

## Changing the database

- Edit `src/db/schema.ts`, then run `pnpm db:generate --name <short-name>` and commit the SQL it writes under `drizzle/`. Never edit a migration that is already on `main`.
- Add every new table and column to `data/dictionary.yaml` in the business's words. Mark anything personal (`sensitive: true` with a `pii_kind`). CI fails when the dictionary is behind.
- **Expand, then contract.** Never remove or rename a column, table or set of rows in the same change that adds its replacement. Add the new thing, backfill, switch the code, ship. The removal comes later as its own small `cleanup` change. CI labels such changes `migration:destructive`, which routes the release to a stricter approver and takes a backup first; say in the PR summary, in plain words, what data goes away.
- New `NOT NULL` columns need a default. Prefer nullable columns and soft deletes (a `retired_at` column) over drops.

## Rules

- Do not edit `render.yaml`, `.github/workflows/`, `.mcp.json`, `scripts/`, the `sensitive` flags in `data/dictionary.yaml`, or this file's generated copies (`CLAUDE.md`, `AGENTS.md`) unless the person asking holds a platform role; say so and stop if asked.
- Do not add secrets, API keys or tokens anywhere in the repo. Configuration that needs a secret is a platform task.
- Never write SQL that reads or changes production data from a change; the control plane's data tools do that with permissions and an undo. Code reads and writes only what the app needs to work.
- Do not change the app's structure (new pages, removed pages, navigation) without saying so explicitly in the PR summary.
- Keep dependencies as they are unless the change needs a new one, and say so in the PR.

## Talking to the control plane

The repo's `.mcp.json` points at the Greenfield Swarm MCP server, and cloud sessions get it as the Greenfield Swarm connector instead. Use whichever is connected to check site status, describe the data, find preview links, and request releases. If neither is connected, finish the PR and say so in one sentence; the owner can ask for the preview or release in their Claude chat, where the connector is installed. Do not mention the connection problem more than once.

## Useful commands

- `pnpm dev`: local app at http://localhost:3000 (needs `DATABASE_URL`)
- `pnpm db:migrate`: apply migrations to the local database
- `pnpm db:generate --name <change>`: write a migration from schema changes
- `pnpm check`: everything CI runs
- `pnpm migration:check`: say whether the branch's new migrations are additive or destructive
- `pnpm gen:agents`: regenerate `CLAUDE.md` and `AGENTS.md` from `agent-instructions.md`
