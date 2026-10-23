import { sql } from 'drizzle-orm';
import { integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * The app's data. Every table and column here has a matching entry in data/dictionary.yaml
 * (CI fails otherwise), which is how the platform knows what is personal data and how to
 * snapshot each table. Schema changes go through migrations: edit this file, run
 * `pnpm db:generate --name <change>`, commit the SQL. Expand first, contract later.
 */

/** What the business offers, as shown on the booking page. */
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  priceCents: integer('price_cents').notNull().default(0),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  active: integer('active').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** People who booked. Contact details are personal data (see the dictionary). */
export const customers = pgTable(
  'customers',
  {
    id: serial('id').primaryKey(),
    email: text('email').notNull(),
    fullName: text('full_name').notNull(),
    phone: text('phone'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('customers_email_idx').on(t.email)],
);

export const BOOKING_STATUSES = ['requested', 'confirmed', 'done', 'cancelled'] as const;

/** A request for a service at a time. */
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id),
  serviceId: integer('service_id')
    .notNull()
    .references(() => services.id),
  requestedFor: timestamp('requested_for', { withTimezone: true }).notNull(),
  status: text('status', { enum: BOOKING_STATUSES }).notNull().default('requested'),
  message: text('message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Append-only log of what happened (bookings made, status changes). Sampled in snapshots. */
export const activity = pgTable('activity', {
  id: serial('id').primaryKey(),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  kind: text('kind').notNull(),
  bookingId: integer('booking_id').references(() => bookings.id),
  detail: jsonb('detail')
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
});
