-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimeStamps" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_TimeStamps" ("id", "timestamp") SELECT "id", "timestamp" FROM "TimeStamps";
DROP TABLE "TimeStamps";
ALTER TABLE "new_TimeStamps" RENAME TO "TimeStamps";
PRAGMA foreign_key_check("TimeStamps");
PRAGMA foreign_keys=ON;
