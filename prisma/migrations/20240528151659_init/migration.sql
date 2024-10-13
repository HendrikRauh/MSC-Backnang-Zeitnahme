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
    CONSTRAINT "Time_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Time_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Time" ("driverId", "id", "notes", "penalty", "timeRaw", "timestamp", "vehicleId") SELECT "driverId", "id", "notes", "penalty", "timeRaw", "timestamp", "vehicleId" FROM "Time";
DROP TABLE "Time";
ALTER TABLE "new_Time" RENAME TO "Time";
PRAGMA foreign_key_check("Time");
PRAGMA foreign_keys=ON;
