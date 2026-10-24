// The one thing seed-preview must never do is wipe production. A preview database is empty when
// it is born (migrations only), and after the first seed it carries the _swarm_seed marker. So a
// database with no marker whose personal-data tables already hold rows is not a preview, whatever
// the environment variables say.

/** Tables the dictionary marks as holding personal data (any column with sensitive: true). */
export function protectedTables(dict) {
  return Object.entries(dict?.tables ?? {})
    .filter(([, t]) => Object.values(t?.columns ?? {}).some((c) => c?.sensitive === true))
    .map(([name]) => name);
}

/** Those protected tables that exist in the database and have at least one row. */
export async function protectedTablesWithData(sql, dict) {
  const busy = [];
  for (const name of protectedTables(dict)) {
    const exists = await sql`
      select 1 from information_schema.tables where table_schema = 'public' and table_name = ${name}`;
    if (exists.length === 0) continue;
    const [{ n }] = await sql.unsafe(`select count(*)::int as n from "${name.replace(/"/g, '""')}"`);
    if (n > 0) busy.push(name);
  }
  return busy;
}
