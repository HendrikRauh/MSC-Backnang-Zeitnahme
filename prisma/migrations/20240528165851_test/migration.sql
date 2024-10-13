/*
  Warnings:

  - You are about to drop the column `timestamp` on the `TimeStamp` table. All the data in the column will be lost.
  - Added the required column `endTimeId` to the `Time` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTimeId` to the `Time` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimeStamp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
);
INSERT INTO "new_TimeStamp" ("id") SELECT "id" FROM "TimeStamp";
DROP TABLE "TimeStamp";
ALTER TABLE "new_TimeStamp" RENAME TO "TimeStamp";
CREATE TABLE "new_Time" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "driverId" INTEGER,
    "vehicleId" INTEGER,
    "penaltySec" INTEGER,
    "notes" TEXT,
    "startTimeId" INTEGER NOT NULL,
    "endTimeId" INTEGER NOT NULL,
    CONSTRAINT "Time_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Time_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Time_startTimeId_fkey" FOREIGN KEY ("startTimeId") REFERENCES "TimeStamp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Time_endTimeId_fkey" FOREIGN KEY ("endTimeId") REFERENCES "TimeStamp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Time" ("driverId", "id", "notes", "penaltySec", "vehicleId") SELECT "driverId", "id", "notes", "penaltySec", "vehicleId" FROM "Time";
DROP TABLE "Time";
ALTER TABLE "new_Time" RENAME TO "Time";
PRAGMA foreign_key_check("TimeStamp");
PRAGMA foreign_key_check("Time");
PRAGMA foreign_keys=ON;
