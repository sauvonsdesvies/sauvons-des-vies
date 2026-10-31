-- Add publication tables without changing existing records.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "authorName" TEXT NOT NULL DEFAULT 'Fondation Sauvons des Vies',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publicationDate" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationPhoto" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Publication_slug_key" ON "Publication"("slug");

-- CreateIndex
CREATE INDEX "Publication_status_publicationDate_idx" ON "Publication"("status", "publicationDate");

-- CreateIndex
CREATE INDEX "Publication_language_status_idx" ON "Publication"("language", "status");

-- CreateIndex
CREATE INDEX "Publication_category_idx" ON "Publication"("category");

-- CreateIndex
CREATE INDEX "Publication_publishedAt_idx" ON "Publication"("publishedAt");

-- CreateIndex
CREATE INDEX "Publication_createdAt_idx" ON "Publication"("createdAt");

-- CreateIndex
CREATE INDEX "PublicationPhoto_publicationId_idx" ON "PublicationPhoto"("publicationId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationPhoto_publicationId_position_key" ON "PublicationPhoto"("publicationId", "position");

-- AddForeignKey
ALTER TABLE "PublicationPhoto" ADD CONSTRAINT "PublicationPhoto_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Metadata accessible through the admin server only.
ALTER TABLE "Publication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PublicationPhoto" ENABLE ROW LEVEL SECURITY;
COMMIT;
