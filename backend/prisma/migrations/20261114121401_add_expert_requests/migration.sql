-- CreateTable
CREATE TABLE "ExpertRequest" (
    "id" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "note" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpertRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpertRequest_status_createdAt_idx" ON "ExpertRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ExpertRequest_expertId_idx" ON "ExpertRequest"("expertId");

-- CreateIndex
CREATE INDEX "ExpertRequest_stockId_idx" ON "ExpertRequest"("stockId");

-- AddForeignKey
ALTER TABLE "ExpertRequest" ADD CONSTRAINT "ExpertRequest_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertRequest" ADD CONSTRAINT "ExpertRequest_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
