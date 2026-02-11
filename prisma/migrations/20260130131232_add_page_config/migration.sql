-- CreateTable
CREATE TABLE "PageConfig" (
    "id" SERIAL NOT NULL,
    "pageId" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageConfig_pageId_key" ON "PageConfig"("pageId");

-- CreateIndex
CREATE INDEX "PageConfig_pageId_idx" ON "PageConfig"("pageId");
