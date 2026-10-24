import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { parse } from 'yaml';
import { protectedTables, protectedTablesWithData } from '../../scripts/lib/seed-guard.mjs';

const dict = parse(readFileSync(new URL('../../data/dictionary.yaml', import.meta.url), 'utf8'));

describe('seed guard: protected tables', () => {
  it('names the tables with personal data and nothing else', () => {
    expect(protectedTables(dict)).toEqual(['customers', 'bookings']);
    expect(protectedTables({ tables: { t: { columns: { a: { description: 'x' } } } } })).toEqual([]);
  });
});

const url = process.env.DATABASE_URL;
const describeDb = url ? describe : describe.skip;

describeDb('seed guard against the database', () => {
  const sql = postgres(url ?? 'postgres://unused', { max: 1, prepare: false });
  beforeAll(async () => {
    await sql`truncate activity, bookings, customers restart identity cascade`;
  });
  afterAll(async () => {
    await sql`truncate activity, bookings, customers restart identity cascade`;
    await sql.end();
  });

  it('passes an empty preview database and refuses one that holds customers', async () => {
    expect(await protectedTablesWithData(sql, dict)).toEqual([]);
    await sql`insert into customers (email, full_name) values ('real@example.com', 'Real Person')`;
    expect(await protectedTablesWithData(sql, dict)).toEqual(['customers']);
    expect(
      await protectedTablesWithData(sql, { tables: { nope: { columns: { e: { sensitive: true } } } } }),
    ).toEqual([]);
  });
});
