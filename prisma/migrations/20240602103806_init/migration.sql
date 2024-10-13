/*
  Warnings:

  - You are about to drop the column `used` on the `TimeStamp` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimeStamp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL,
    "friendly" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new'
);
INSERT INTO "new_TimeStamp" ("friendly", "id", "timestamp") SELECT "friendly", "id", "timestamp" FROM "TimeStamp";
DROP TABLE "TimeStamp";
ALTER TABLE "new_TimeStamp" RENAME TO "TimeStamp";
CREATE UNIQUE INDEX "TimeStamp_timestamp_key" ON "TimeStamp"("timestamp");
CREATE UNIQUE INDEX "TimeStamp_friendly_key" ON "TimeStamp"("friendly");
PRAGMA foreign_key_check("TimeStamp");
PRAGMA foreign_keys=ON;
