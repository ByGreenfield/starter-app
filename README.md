# starter-app

Greenfield Dev's template for a small-business web app with a database: Next.js (App Router) +
Postgres + Drizzle, hosted on Render, managed through the [Greenfield Swarm](https://swarm.greenfield.dev)
control plane. Sites are created from this repo (it is a GitHub template) and tagged by version.

What it ships with:

- A booking flow (services, a request form, a thanks page) as a worked example of data the business owns.
- `src/db/schema.ts` + `drizzle/` migrations, applied by Render's pre-deploy command before each release.
- `data/dictionary.yaml`: every table and column in business words, personal data marked. The control
  plane uses it to answer questions about the data safely and to scrub the nightly snapshot.
- Preview environments per pull request with their own database, seeded from the scrubbed production
  snapshot by `scripts/seed-preview.mjs`, so reviews happen on real-shaped data with fake personal details.
- CI: `pnpm check` on every PR, plus `migration-check`, which labels PRs `migration:additive` or
  `migration:destructive`; the control plane routes destructive releases to a stricter approver and
  takes a backup first.
- `agent-instructions.md` -> `CLAUDE.md` / `AGENTS.md`: the rules coding agents follow here.

## Local development

```sh
cp .env.example .env            # point DATABASE_URL at a local Postgres
pnpm install
pnpm db:migrate
pnpm dev
```

`pnpm check` runs everything CI runs (needs the database). The smoke suite starts the production build
on port 3100 unless `BASE_URL` points it at a deployment.

## Not yet in this version

Sign-in for an admin area, payments (Stripe) and a background worker are planned for a later tagged
version; a site born on `starter-app@1.0` upgrades through the control plane's `upgrade_template` tool
when that exists. Nothing secret may ever land in this repo: it is public, as GitHub templates must be
to be used from another organization.
