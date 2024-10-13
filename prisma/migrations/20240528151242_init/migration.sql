/*
  Warnings:

  - Added the required column `driverId` to the `Time` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicleId` to the `Time` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Time" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driverId" INTEGER NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "timeRaw" TEXT NOT NULL,
    "penalty" INTEGER NOT NULL,
    "notes" TEXT,
    CONSTRAINT "Time_id_fkey" FOREIGN KEY ("id") REFERENCES "Driver" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Time_id_fkey" FOREIGN KEY ("id") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Time" ("id", "notes", "penalty", "timeRaw", "timestamp") SELECT "id", "notes", "penalty", "timeRaw", "timestamp" FROM "Time";
DROP TABLE "Time";
ALTER TABLE "new_Time" RENAME TO "Time";
PRAGMA foreign_key_check("Time");
PRAGMA foreign_keys=ON;
