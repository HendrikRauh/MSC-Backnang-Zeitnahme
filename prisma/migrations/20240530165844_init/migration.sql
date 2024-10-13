/*
  Warnings:

  - You are about to drop the column `invalid` on the `TimeStamp` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimeStamp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_TimeStamp" ("id", "timestamp") SELECT "id", "timestamp" FROM "TimeStamp";
DROP TABLE "TimeStamp";
ALTER TABLE "new_TimeStamp" RENAME TO "TimeStamp";
PRAGMA foreign_key_check("TimeStamp");
PRAGMA foreign_keys=ON;
