ALTER TABLE "Campaign"
ADD COLUMN "initialCollectedAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "initialDonorCount" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "Campaign_initialCollectedAmount_nonnegative" CHECK ("initialCollectedAmount" >= 0),
ADD CONSTRAINT "Campaign_initialDonorCount_nonnegative" CHECK ("initialDonorCount" >= 0);
