-- Additive checkout migration. Existing donations and transactions are preserved.
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "donorPhone" TEXT;

ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "PaymentTransaction" ADD COLUMN IF NOT EXISTS "providerData" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_idempotencyKey_key" ON "PaymentTransaction"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_provider_providerReference_key" ON "PaymentTransaction"("provider", "providerReference");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_provider_providerTransactionId_key" ON "PaymentTransaction"("provider", "providerTransactionId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_paymentMethod_status_idx" ON "PaymentTransaction"("paymentMethod", "status");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_expiresAt_idx" ON "PaymentTransaction"("expiresAt");

CREATE TABLE IF NOT EXISTS "PaymentMethodConfig" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT false,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentMethodConfig_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentMethodConfig_provider_paymentMethod_key" ON "PaymentMethodConfig"("provider", "paymentMethod");
CREATE INDEX IF NOT EXISTS "PaymentMethodConfig_paymentMethod_isEnabled_idx" ON "PaymentMethodConfig"("paymentMethod", "isEnabled");
CREATE INDEX IF NOT EXISTS "PaymentMethodConfig_provider_isEnabled_idx" ON "PaymentMethodConfig"("provider", "isEnabled");
ALTER TABLE "PaymentMethodConfig" ENABLE ROW LEVEL SECURITY;
