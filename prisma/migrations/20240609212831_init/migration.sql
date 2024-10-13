-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_currentDrivers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "driverId" INTEGER NOT NULL,
    "vehicleId" INTEGER,
    CONSTRAINT "currentDrivers_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "currentDrivers_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_currentDrivers" ("driverId", "id", "vehicleId") SELECT "driverId", "id", "vehicleId" FROM "currentDrivers";
DROP TABLE "currentDrivers";
ALTER TABLE "new_currentDrivers" RENAME TO "currentDrivers";
PRAGMA foreign_key_check("currentDrivers");
PRAGMA foreign_keys=ON;
