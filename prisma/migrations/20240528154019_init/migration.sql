-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Time" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driverId" INTEGER,
    "vehicleId" INTEGER,
    "timeMinute" INTEGER NOT NULL,
    "timeSecond" INTEGER NOT NULL,
    "timeMillisecond" INTEGER NOT NULL,
    "penaltySec" INTEGER,
    "notes" TEXT,
    CONSTRAINT "Time_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Time_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Time" ("driverId", "id", "notes", "penaltySec", "timeMillisecond", "timeMinute", "timeSecond", "timestamp", "vehicleId") SELECT "driverId", "id", "notes", "penaltySec", "timeMillisecond", "timeMinute", "timeSecond", "timestamp", "vehicleId" FROM "Time";
DROP TABLE "Time";
ALTER TABLE "new_Time" RENAME TO "Time";
PRAGMA foreign_key_check("Time");
PRAGMA foreign_keys=ON;
