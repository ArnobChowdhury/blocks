-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "monday" BOOLEAN,
    "tuesday" BOOLEAN,
    "wednesday" BOOLEAN,
    "thursday" BOOLEAN,
    "friday" BOOLEAN,
    "saturday" BOOLEAN,
    "sunday" BOOLEAN,
    "shouldBeScored" BOOLEAN,
    "lastEntryUpdateDate" DATETIME,
    "createdAt" DATETIME NOT NULL,
    "lastModifiedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailyTaskEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "completionStatus" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "score" INTEGER,
    "createdAt" DATETIME NOT NULL,
    "lastModifiedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyTaskEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyTaskEntry_taskId_dueDate_key" ON "DailyTaskEntry"("taskId", "dueDate");
