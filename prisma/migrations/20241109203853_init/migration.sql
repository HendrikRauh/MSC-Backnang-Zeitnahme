/*
  Warnings:

  - You are about to alter the column `active` on the `Driver` table. The data in that column could be lost. The data in that column will be cast from `Boolean` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Driver" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "drivingClass" TEXT NOT NULL,
    "birthYear" INTEGER,
    "trainingGroup" TEXT NOT NULL,
    "vehicleId" INTEGER,
    "active" INTEGER,
    CONSTRAINT "Driver_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Driver" ("active", "birthYear", "drivingClass", "firstName", "id", "lastName", "trainingGroup", "vehicleId") SELECT "active", "birthYear", "drivingClass", "firstName", "id", "lastName", "trainingGroup", "vehicleId" FROM "Driver";
DROP TABLE "Driver";
ALTER TABLE "new_Driver" RENAME TO "Driver";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
