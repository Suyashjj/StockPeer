-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "maxExperts" INTEGER NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE "ExpertDemand" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpertDemand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpertDemand_stockId_idx" ON "ExpertDemand"("stockId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertDemand_userId_stockId_key" ON "ExpertDemand"("userId", "stockId");

-- AddForeignKey
ALTER TABLE "ExpertDemand" ADD CONSTRAINT "ExpertDemand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertDemand" ADD CONSTRAINT "ExpertDemand_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
