-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fileId" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "fileType" TEXT;
