-- Add nullable first, backfill the existing demo user, then enforce NOT NULL —
-- a straight "ADD COLUMN ... NOT NULL" with no default fails against the
-- existing row.
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- bcrypt hash of the demo account's password "StudyDesk123!" (see README).
UPDATE "User" SET "passwordHash" = '$2a$10$5XEgTbYKEWTHdsxgUct5e.XfqODdvsvGP2j7XAJceTgy6EbcSc02m'
WHERE "passwordHash" IS NULL;

ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
