-- DropIndex
DROP INDEX "Collection_isFavorite_idx";

-- DropIndex
DROP INDEX "Collection_userId_idx";

-- DropIndex
DROP INDEX "Item_isFavorite_idx";

-- DropIndex
DROP INDEX "Item_isPinned_idx";

-- DropIndex
DROP INDEX "Item_lastUsedAt_idx";

-- DropIndex
DROP INDEX "Item_userId_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Collection_userId_updatedAt_idx" ON "Collection"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Collection_userId_isFavorite_idx" ON "Collection"("userId", "isFavorite");

-- CreateIndex
CREATE INDEX "Item_userId_isPinned_lastUsedAt_idx" ON "Item"("userId", "isPinned", "lastUsedAt");

-- CreateIndex
CREATE INDEX "Item_userId_isFavorite_updatedAt_idx" ON "Item"("userId", "isFavorite", "updatedAt");

-- CreateIndex
CREATE INDEX "ItemCollection_collectionId_idx" ON "ItemCollection"("collectionId");

-- CreateIndex
CREATE INDEX "ItemTag_tagId_idx" ON "ItemTag"("tagId");
