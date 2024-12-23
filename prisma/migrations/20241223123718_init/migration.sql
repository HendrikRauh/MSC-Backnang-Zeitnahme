/*
  Warnings:

  - Made the column `driverId` on table `Time` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicleId` on table `Time` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Time" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "driverId" INTEGER NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "penalty" INTEGER,
    "notes" TEXT,
    "startTimeId" INTEGER NOT NULL,
    "endTimeId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Time_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Time_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Time_startTimeId_fkey" FOREIGN KEY ("startTimeId") REFERENCES "TimeStamp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Time_endTimeId_fkey" FOREIGN KEY ("endTimeId") REFERENCES "TimeStamp" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Time" ("active", "driverId", "endTimeId", "id", "notes", "penalty", "startTimeId", "vehicleId") SELECT "active", "driverId", "endTimeId", "id", "notes", "penalty", "startTimeId", "vehicleId" FROM "Time";
DROP TABLE "Time";
ALTER TABLE "new_Time" RENAME TO "Time";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
