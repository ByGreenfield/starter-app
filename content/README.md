# content/

Words and settings the business changes often, kept apart from code so most edits are low risk.

- `site.json`: the business name, tagline, intro text, contact details and hours.

Services themselves live in the database (the `services` table) so staff can change prices
without a release; the seed in `drizzle/0000_*.sql` creates three examples.
