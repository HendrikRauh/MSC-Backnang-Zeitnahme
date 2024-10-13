/*
  Warnings:

  - You are about to drop the `TimeStamps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `timeMillisecond` on the `Time` table. All the data in the column will be lost.
  - You are about to drop the column `timeMinute` on the `Time` table. All the data in the column will be lost.
  - You are about to drop the column `timeSecond` on the `Time` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Time` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TimeStamps";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "TimeStamp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Time" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "driverId" INTEGER,
    "vehicleId" INTEGER,
    "penaltySec" INTEGER,
    "notes" TEXT,
    CONSTRAINT "Time_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Time_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Time" ("driverId", "id", "notes", "penaltySec", "vehicleId") SELECT "driverId", "id", "notes", "penaltySec", "vehicleId" FROM "Time";
DROP TABLE "Time";
ALTER TABLE "new_Time" RENAME TO "Time";
PRAGMA foreign_key_check("Time");
PRAGMA foreign_keys=ON;
