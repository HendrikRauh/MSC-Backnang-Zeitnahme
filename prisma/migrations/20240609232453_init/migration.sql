/*
  Warnings:

  - A unique constraint covering the columns `[driverId]` on the table `activeDrivers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "activeDrivers_driverId_key" ON "activeDrivers"("driverId");
