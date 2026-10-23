import { describe, expect, it } from 'vitest';
import { classify } from '../../scripts/migration-check.mjs';

describe('migration classification', () => {
  it('calls additive changes additive', () => {
    const sql = `CREATE TABLE "notes" ("id" serial PRIMARY KEY, "body" text);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "source" text DEFAULT 'web';
--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" ("status");`;
    expect(classify(sql)).toEqual({ destructive: false, reasons: [] });
  });

  it('flags drops, renames, truncation, narrowing and row changes', () => {
    for (const s of [
      'ALTER TABLE "customers" DROP COLUMN "phone";',
      'DROP TABLE "activity";',
      'ALTER TABLE "bookings" RENAME COLUMN "message" TO "note";',
      'TRUNCATE "activity";',
      'ALTER TABLE "bookings" ALTER COLUMN "message" SET NOT NULL;',
      'ALTER TABLE "services" ALTER COLUMN "price_cents" TYPE smallint;',
      'DELETE FROM "bookings" WHERE status = \'cancelled\';',
      'UPDATE "bookings" SET status = \'done\';',
    ]) {
      expect(classify(s).destructive, s).toBe(true);
    }
  });

  it('allows NOT NULL when a default fills the rows', () => {
    expect(
      classify('ALTER TABLE "bookings" ADD COLUMN "source" text DEFAULT \'web\' NOT NULL;').destructive,
    ).toBe(false);
  });
});
