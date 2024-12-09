-- CreateTable
CREATE TABLE "Space" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RepetitiveTaskTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "schedule" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "shouldBeScored" BOOLEAN DEFAULT false,
    "monday" BOOLEAN DEFAULT false,
    "tuesday" BOOLEAN DEFAULT false,
    "wednesday" BOOLEAN DEFAULT false,
    "thursday" BOOLEAN DEFAULT false,
    "friday" BOOLEAN DEFAULT false,
    "saturday" BOOLEAN DEFAULT false,
    "sunday" BOOLEAN DEFAULT false,
    "timeOfDay" TEXT,
    "lastDateOfTaskGeneration" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL,
    "spaceId" INTEGER,
    CONSTRAINT "RepetitiveTaskTemplate_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RepetitiveTaskTemplate" ("createdAt", "description", "friday", "id", "isActive", "lastDateOfTaskGeneration", "modifiedAt", "monday", "priority", "saturday", "schedule", "shouldBeScored", "sunday", "thursday", "timeOfDay", "title", "tuesday", "wednesday") SELECT "createdAt", "description", "friday", "id", "isActive", "lastDateOfTaskGeneration", "modifiedAt", "monday", "priority", "saturday", "schedule", "shouldBeScored", "sunday", "thursday", "timeOfDay", "title", "tuesday", "wednesday" FROM "RepetitiveTaskTemplate";
DROP TABLE "RepetitiveTaskTemplate";
ALTER TABLE "new_RepetitiveTaskTemplate" RENAME TO "RepetitiveTaskTemplate";
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "schedule" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "completionStatus" TEXT NOT NULL DEFAULT 'INCOMPLETE',
    "dueDate" DATETIME,
    "shouldBeScored" BOOLEAN,
    "score" INTEGER,
    "timeOfDay" TEXT,
    "repetitiveTaskTemplateId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL,
    "spaceId" INTEGER,
    CONSTRAINT "Task_repetitiveTaskTemplateId_fkey" FOREIGN KEY ("repetitiveTaskTemplateId") REFERENCES "RepetitiveTaskTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("completionStatus", "createdAt", "description", "dueDate", "id", "isActive", "modifiedAt", "priority", "repetitiveTaskTemplateId", "schedule", "score", "shouldBeScored", "timeOfDay", "title") SELECT "completionStatus", "createdAt", "description", "dueDate", "id", "isActive", "modifiedAt", "priority", "repetitiveTaskTemplateId", "schedule", "score", "shouldBeScored", "timeOfDay", "title" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE UNIQUE INDEX "Task_repetitiveTaskTemplateId_dueDate_key" ON "Task"("repetitiveTaskTemplateId", "dueDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Space_title_key" ON "Space"("title");
