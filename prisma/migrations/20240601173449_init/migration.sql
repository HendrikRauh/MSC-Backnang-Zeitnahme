/*
  Warnings:

  - A unique constraint covering the columns `[timestamp]` on the table `TimeStamp` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TimeStamp_timestamp_key" ON "TimeStamp"("timestamp");
