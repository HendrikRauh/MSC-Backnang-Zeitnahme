/*
  Warnings:

  - You are about to drop the column `old` on the `Time` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `TimeStamp` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Time" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "driverId" INTEGER,
    "vehicleId" INTEGER,
    "penalty" INTEGER,
    "notes" TEXT,
    "startTimeId" INTEGER NOT NULL,
    "endTimeId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Time_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Time_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Time_startTimeId_fkey" FOREIGN KEY ("startTimeId") REFERENCES "TimeStamp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Time_endTimeId_fkey" FOREIGN KEY ("endTimeId") REFERENCES "TimeStamp" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Time" ("driverId", "endTimeId", "id", "notes", "penalty", "startTimeId", "vehicleId") SELECT "driverId", "endTimeId", "id", "notes", "penalty", "startTimeId", "vehicleId" FROM "Time";
DROP TABLE "Time";
ALTER TABLE "new_Time" RENAME TO "Time";
CREATE TABLE "new_TimeStamp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL,
    "friendly" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_TimeStamp" ("friendly", "id", "timestamp") SELECT "friendly", "id", "timestamp" FROM "TimeStamp";
DROP TABLE "TimeStamp";
ALTER TABLE "new_TimeStamp" RENAME TO "TimeStamp";
CREATE UNIQUE INDEX "TimeStamp_timestamp_key" ON "TimeStamp"("timestamp");
CREATE UNIQUE INDEX "TimeStamp_friendly_key" ON "TimeStamp"("friendly");
PRAGMA foreign_key_check("Time");
PRAGMA foreign_key_check("TimeStamp");
PRAGMA foreign_keys=ON;
