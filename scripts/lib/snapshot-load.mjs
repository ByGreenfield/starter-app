// Loads a Swarm snapshot (JSON lines, see the control plane's src/snapshot/format.ts) into the
// current schema. Shared by seed-preview and its test.
/** Loads snapshot lines into the current schema: tables emptied first, columns matched by name, sequences reset. */
export async function load(sql, lines) {
  const result = { loaded: {}, missingTables: [] };
  const header = lines.find((l) => l.type === 'header');
  const tables = header?.tables ?? [];
  await sql.begin(async (tx) => {
    const cols = await tx`
      select table_name, column_name, format_type(a.atttypid, a.atttypmod) as type,
             (a.attidentity <> '' or coalesce(pg_get_expr(d.adbin, d.adrelid), '') like 'nextval(%') as serial
      from information_schema.columns c
      join pg_attribute a on a.attrelid = (quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass and a.attname = c.column_name
      left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
      where c.table_schema = 'public'`;
    const target = new Map();
    for (const c of cols) {
      if (!target.has(c.table_name)) target.set(c.table_name, new Map());
      target.get(c.table_name).set(c.column_name, c);
    }
    const present = tables.filter((t) => target.has(t));
    if (present.length) await tx.unsafe(`truncate ${present.map(q).join(', ')} cascade`);
    let current = null;
    for (const line of lines) {
      if (line.type === 'table') {
        const t = target.get(line.name);
        if (!t) {
          result.missingTables.push(line.name);
          current = null;
          continue;
        }
        const keep = line.columns.map((c, i) => (t.has(c.name) ? i : -1)).filter((i) => i >= 0);
        current = {
          name: line.name,
          keep,
          names: keep.map((i) => line.columns[i].name),
          types: keep.map((i) => t.get(line.columns[i].name).type),
        };
        result.loaded[line.name] = 0;
      } else if (line.type === 'rows' && current && current.name === line.table && current.keep.length) {
        for (let s = 0; s < line.rows.length; s += 200) {
          const chunk = line.rows.slice(s, s + 200);
          const params = [];
          const tuples = chunk.map(
            (row) =>
              `(${current.keep
                .map((i, k) => {
                  params.push(row[i] ?? null);
                  return `$${params.length}::${current.types[k]}`;
                })
                .join(', ')})`,
          );
          await tx.unsafe(
            `insert into ${q(current.name)} (${current.names.map(q).join(', ')}) values ${tuples.join(', ')}`,
            params,
          );
          result.loaded[current.name] += chunk.length;
        }
      }
    }
    for (const [table, columns] of target) {
      if (!present.includes(table)) continue;
      for (const [name, c] of columns) {
        if (!c.serial) continue;
        await tx.unsafe(
          `select setval(pg_get_serial_sequence($1, $2), coalesce((select max(${q(name)}) from ${q(table)}), 0) + 1, false)`,
          [q(table), name],
        );
      }
    }
  });
  return result;
}

function q(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}
