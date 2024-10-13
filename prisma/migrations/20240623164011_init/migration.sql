/*
  Warnings:

  - You are about to drop the `activeDrivers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "activeDrivers_driverId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "activeDrivers";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Driver" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "drivingClass" TEXT NOT NULL,
    "birthYear" INTEGER,
    "trainingGroup" TEXT NOT NULL,
    "vehicleId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Driver_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Driver" ("birthYear", "drivingClass", "firstName", "id", "lastName", "trainingGroup") SELECT "birthYear", "drivingClass", "firstName", "id", "lastName", "trainingGroup" FROM "Driver";
DROP TABLE "Driver";
ALTER TABLE "new_Driver" RENAME TO "Driver";
PRAGMA foreign_key_check("Driver");
PRAGMA foreign_keys=ON;
