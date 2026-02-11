/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `NewClient` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "NewClient" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "NewClient_slug_key" ON "NewClient"("slug");
