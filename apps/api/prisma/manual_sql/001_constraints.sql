-- Run this AFTER `prisma migrate dev` has created the base tables.
-- These are the DB-level integrity guarantees referenced in the design blueprint.
-- psql "$DATABASE_URL" -f prisma/manual_sql/001_constraints.sql

-- 1) Only one ACTIVE allocation per asset at a time (prevents double-allocation
--    even under concurrent requests; the app layer only gives the friendly error).
CREATE UNIQUE INDEX IF NOT EXISTS one_active_allocation_per_asset
ON "AssetAllocation" ("assetId")
WHERE status = 'ACTIVE';

-- 2) No overlapping bookings for the same asset (matches spec example exactly:
--    a booking ending at 10:00 does NOT conflict with one starting at 10:00).
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS period tsrange
  GENERATED ALWAYS AS (tsrange("startTime", "endTime", '[)')) STORED;

ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS no_overlapping_bookings;
ALTER TABLE "Booking" ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING gist ("assetId" WITH =, period WITH &&)
  WHERE (status IN ('UPCOMING', 'ONGOING'));
