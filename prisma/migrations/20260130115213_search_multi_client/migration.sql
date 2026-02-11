/*
  Warnings:

  - You are about to drop the column `newClientId` on the `Search` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[generalReference,detailedReference]` on the table `Search` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Search" DROP CONSTRAINT "Search_newClientId_fkey";

-- AlterTable
ALTER TABLE "Search" DROP COLUMN "newClientId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSeen" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SearchClient" (
    "id" SERIAL NOT NULL,
    "searchId" INTEGER NOT NULL,
    "newClientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewClientCategory" (
    "id" SERIAL NOT NULL,
    "newClientId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewClientCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedFilter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "filters" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedFilter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchClient_searchId_newClientId_key" ON "SearchClient"("searchId", "newClientId");

-- CreateIndex
CREATE UNIQUE INDEX "NewClientCategory_newClientId_categoryId_key" ON "NewClientCategory"("newClientId", "categoryId");

-- CreateIndex
CREATE INDEX "SavedFilter_userId_idx" ON "SavedFilter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Search_generalReference_detailedReference_key" ON "Search"("generalReference", "detailedReference");

-- AddForeignKey
ALTER TABLE "SearchClient" ADD CONSTRAINT "SearchClient_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "Search"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchClient" ADD CONSTRAINT "SearchClient_newClientId_fkey" FOREIGN KEY ("newClientId") REFERENCES "NewClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewClientCategory" ADD CONSTRAINT "NewClientCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewClientCategory" ADD CONSTRAINT "NewClientCategory_newClientId_fkey" FOREIGN KEY ("newClientId") REFERENCES "NewClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedFilter" ADD CONSTRAINT "SavedFilter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
