// Classifies the migrations a change adds (design doc "Schema changes and destructive migrations"):
//   additive    new tables, nullable columns, indexes, defaults, widening types
//   destructive DROP, TRUNCATE, removing or renaming a column, NOT NULL without a default,
//               narrowing a type, DELETE / UPDATE of rows
// In CI the result becomes the PR label migration:additive or migration:destructive, which the
// control plane reads to decide who may approve the release. Locally it just prints.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const DESTRUCTIVE = [
  /\bdrop\s+(table|column|index|constraint|type|schema|sequence|view)\b/i,
  /\balter\s+table\b[^;]*\bdrop\b/i,
  /\btruncate\b/i,
  /\brename\s+(column|to)\b/i,
  /\balter\s+column\b[^;]*\bset\s+not\s+null\b/i,
  /\balter\s+column\b[^;]*\btype\b/i,
  /^\s*delete\s+from\b/im,
  /^\s*update\s+\S+\s+set\b/im,
];

export function classify(sqlText) {
  const statements = sqlText
    .split(/--> statement-breakpoint|;/)
    .map((s) => s.replace(/--.*$/gm, '').trim())
    .filter(Boolean);
  const reasons = [];
  for (const s of statements) {
    for (const re of DESTRUCTIVE) {
      if (re.test(s)) {
        // "set not null" right after "add column ... default" is safe: the default fills every row.
        if (/set\s+not\s+null/i.test(s) && /default/i.test(s)) continue;
        reasons.push(s.split('\n')[0].slice(0, 100));
        break;
      }
    }
  }
  return { destructive: reasons.length > 0, reasons };
}

export function changedMigrations(base = process.env.MIGRATION_BASE ?? 'origin/main') {
  try {
    const out = execSync(`git diff --name-only --diff-filter=A ${base}...HEAD -- drizzle/*.sql`, {
      encoding: 'utf8',
    });
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const files = changedMigrations();
  if (files.length === 0) {
    console.log('no new migrations');
    console.log('label=none');
    process.exit(0);
  }
  const all = files.map((f) => classify(readFileSync(f, 'utf8')));
  const destructive = all.some((c) => c.destructive);
  for (const [i, f] of files.entries()) {
    console.log(
      `${f}: ${all[i].destructive ? 'DESTRUCTIVE' : 'additive'}${all[i].reasons.length ? ' (' + all[i].reasons.join('; ') + ')' : ''}`,
    );
  }
  console.log(`label=${destructive ? 'migration:destructive' : 'migration:additive'}`);
}
