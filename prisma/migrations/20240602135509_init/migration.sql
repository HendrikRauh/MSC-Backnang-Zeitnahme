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
    CONSTRAINT "Time_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Time_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Time_startTimeId_fkey" FOREIGN KEY ("startTimeId") REFERENCES "TimeStamp" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Time_endTimeId_fkey" FOREIGN KEY ("endTimeId") REFERENCES "TimeStamp" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Time" ("driverId", "endTimeId", "id", "notes", "penalty", "startTimeId", "vehicleId") SELECT "driverId", "endTimeId", "id", "notes", "penalty", "startTimeId", "vehicleId" FROM "Time";
DROP TABLE "Time";
ALTER TABLE "new_Time" RENAME TO "Time";
PRAGMA foreign_key_check("Time");
PRAGMA foreign_keys=ON;
