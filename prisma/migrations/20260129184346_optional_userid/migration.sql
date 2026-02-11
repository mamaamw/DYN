-- DropForeignKey
ALTER TABLE "NewClient" DROP CONSTRAINT "NewClient_userId_fkey";

-- AlterTable
ALTER TABLE "NewClient" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "NewClient" ADD CONSTRAINT "NewClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
