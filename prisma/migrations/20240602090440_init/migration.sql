/*
  Warnings:

  - A unique constraint covering the columns `[friendly]` on the table `TimeStamp` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TimeStamp" ADD COLUMN "friendly" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TimeStamp_friendly_key" ON "TimeStamp"("friendly");
