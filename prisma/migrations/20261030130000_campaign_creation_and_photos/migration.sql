-- Synchroniser les collectes et leurs photos sans supprimer de données.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';

ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_beneficiaryId_fkey";

-- Ajouter d’abord le slug nullable pour préserver les lignes préexistantes.
ALTER TABLE "Campaign"
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'XOF',
  ADD COLUMN "endDate" TIMESTAMP(3),
  ADD COLUMN "shortDescription" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "startDate" TIMESTAMP(3),
  ALTER COLUMN "beneficiaryId" DROP NOT NULL;

UPDATE "Campaign" SET "slug" = 'collecte-' || "id" WHERE "slug" IS NULL;
ALTER TABLE "Campaign" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

CREATE TABLE "CampaignPhoto" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CampaignPhoto_pkey" PRIMARY KEY ("id")
);

-- Les photos restent gérées par le serveur administrateur, pas par la Data API anonyme.
ALTER TABLE "CampaignPhoto" ENABLE ROW LEVEL SECURITY;

CREATE INDEX "CampaignPhoto_campaignId_idx" ON "CampaignPhoto"("campaignId");
CREATE UNIQUE INDEX "CampaignPhoto_campaignId_position_key" ON "CampaignPhoto"("campaignId", "position");
CREATE INDEX "AidRequest_beneficiaryId_idx" ON "AidRequest"("beneficiaryId");
CREATE INDEX "Campaign_startDate_endDate_idx" ON "Campaign"("startDate", "endDate");
CREATE INDEX "Campaign_publishedAt_idx" ON "Campaign"("publishedAt");
CREATE INDEX "Donation_currency_status_idx" ON "Donation"("currency", "status");
CREATE INDEX "HospitalPayment_paidAt_idx" ON "HospitalPayment"("paidAt");

ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_beneficiaryId_fkey"
  FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CampaignPhoto" ADD CONSTRAINT "CampaignPhoto_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
