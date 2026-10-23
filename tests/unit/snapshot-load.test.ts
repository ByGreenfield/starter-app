import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { load } from '../../scripts/lib/snapshot-load.mjs';

/**
 * Needs DATABASE_URL with migrations applied (CI has it; `pnpm db:migrate` locally). Loads a tiny
 * snapshot the way a preview build would and checks rows, column matching and sequences.
 */
const url = process.env.DATABASE_URL;
const describeDb = url ? describe : describe.skip;

describeDb('snapshot load', () => {
  const sql = postgres(url ?? 'postgres://unused', { max: 1, prepare: false });
  beforeAll(async () => {
    await sql`truncate activity, bookings, customers, services restart identity cascade`;
  });
  afterAll(async () => {
    await sql`truncate activity, bookings, customers restart identity cascade`;
    await sql.end();
  });

  it('fills tables parents first, skips unknown columns and resets sequences', async () => {
    const lines = [
      {
        type: 'header',
        format: 'swarm-snapshot',
        version: 1,
        siteId: 's',
        at: 'now',
        scrubbed: true,
        commitSha: null,
        tables: ['services', 'customers', 'bookings', 'old_table'],
      },
      {
        type: 'table',
        name: 'services',
        columns: [
          { name: 'id', type: 'integer', serial: true },
          { name: 'slug', type: 'text', serial: false },
          { name: 'name', type: 'text', serial: false },
          { name: 'legacy_code', type: 'text', serial: false },
        ],
        primaryKey: ['id'],
      },
      { type: 'rows', table: 'services', rows: [['7', 'haircut', 'Haircut', 'X1']] },
      { type: 'end', table: 'services', count: 1 },
      {
        type: 'table',
        name: 'customers',
        columns: [
          { name: 'id', type: 'integer', serial: true },
          { name: 'email', type: 'text', serial: false },
          { name: 'full_name', type: 'text', serial: false },
        ],
        primaryKey: ['id'],
      },
      { type: 'rows', table: 'customers', rows: [['3', 'user-abc@example.test', 'Avery Baker']] },
      { type: 'end', table: 'customers', count: 1 },
      {
        type: 'table',
        name: 'bookings',
        columns: [
          { name: 'id', type: 'integer', serial: true },
          { name: 'customer_id', type: 'integer', serial: false },
          { name: 'service_id', type: 'integer', serial: false },
          { name: 'requested_for', type: 'timestamp with time zone', serial: false },
          { name: 'status', type: 'text', serial: false },
        ],
        primaryKey: ['id'],
      },
      { type: 'rows', table: 'bookings', rows: [['10', '3', '7', '2026-10-20 10:00:00+00', 'confirmed']] },
      { type: 'end', table: 'bookings', count: 1 },
      {
        type: 'table',
        name: 'old_table',
        columns: [{ name: 'id', type: 'integer', serial: true }],
        primaryKey: ['id'],
      },
      { type: 'rows', table: 'old_table', rows: [['1']] },
      { type: 'footer', counts: {} },
    ];
    const result = await load(sql, lines);
    expect(result.loaded).toEqual({ services: 1, customers: 1, bookings: 1 });
    expect(result.missingTables).toEqual(['old_table']);
    const [next] =
      await sql`insert into customers (email, full_name) values ('new@example.test', 'New') returning id`;
    expect(next?.id).toBe(4);
    const [b] = await sql`select status, requested_for from bookings where id = 10`;
    expect(b?.status).toBe('confirmed');
    expect(new Date(b?.requested_for as string).toISOString()).toBe('2026-10-20T10:00:00.000Z');
  });
});
