-- CreateTable
CREATE TABLE "RepetitiveTaskTemplate" (
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
    "lastDateOfTaskGeneration" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Task" (
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
    "repetitiveTaskTemplateId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_repetitiveTaskTemplateId_fkey" FOREIGN KEY ("repetitiveTaskTemplateId") REFERENCES "RepetitiveTaskTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Task_repetitiveTaskTemplateId_dueDate_key" ON "Task"("repetitiveTaskTemplateId", "dueDate");
