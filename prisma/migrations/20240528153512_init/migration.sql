/*
  Warnings:

  - You are about to drop the column `penalty` on the `Time` table. All the data in the column will be lost.
  - You are about to drop the column `timeRaw` on the `Time` table. All the data in the column will be lost.
  - Added the required column `penaltySec` to the `Time` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeMillisecond` to the `Time` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeMinute` to the `Time` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeSecond` to the `Time` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Time" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driverId" INTEGER NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "timeMinute" INTEGER NOT NULL,
    "timeSecond" INTEGER NOT NULL,
    "timeMillisecond" INTEGER NOT NULL,
    "penaltySec" INTEGER NOT NULL,
    "notes" TEXT,
    CONSTRAINT "Time_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Time_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Time" ("driverId", "id", "notes", "timestamp", "vehicleId") SELECT "driverId", "id", "notes", "timestamp", "vehicleId" FROM "Time";
DROP TABLE "Time";
ALTER TABLE "new_Time" RENAME TO "Time";
PRAGMA foreign_key_check("Time");
PRAGMA foreign_keys=ON;
