/*
  Warnings:

  - Added the required column `timestamp` to the `TimeStamp` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimeStamp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL
);
INSERT INTO "new_TimeStamp" ("id") SELECT "id" FROM "TimeStamp";
DROP TABLE "TimeStamp";
ALTER TABLE "new_TimeStamp" RENAME TO "TimeStamp";
PRAGMA foreign_key_check("TimeStamp");
PRAGMA foreign_keys=ON;
