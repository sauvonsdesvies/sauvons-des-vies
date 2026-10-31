-- Mise à jour ciblée des journaux, sans modification des publications existantes.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';
ALTER TABLE "Publication" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE INDEX "Publication_archivedAt_idx" ON "Publication"("archivedAt");
COMMIT;
