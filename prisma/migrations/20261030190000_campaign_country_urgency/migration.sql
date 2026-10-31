BEGIN;
SET LOCAL lock_timeout = '10s';
ALTER TABLE "Campaign" ADD COLUMN "countryCode" TEXT;
ALTER TABLE "Campaign" ADD COLUMN "isUrgent" BOOLEAN NOT NULL DEFAULT false;
COMMIT;
