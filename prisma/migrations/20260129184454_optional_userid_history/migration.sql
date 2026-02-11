-- DropForeignKey
ALTER TABLE "ClientHistory" DROP CONSTRAINT "ClientHistory_userId_fkey";

-- AlterTable
ALTER TABLE "ClientHistory" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ClientHistory" ADD CONSTRAINT "ClientHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
