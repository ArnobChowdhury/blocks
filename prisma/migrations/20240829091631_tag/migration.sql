-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_RepetitiveTaskTemplateToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_RepetitiveTaskTemplateToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "RepetitiveTaskTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RepetitiveTaskTemplateToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TagToTask" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_TagToTask_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TagToTask_B_fkey" FOREIGN KEY ("B") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_RepetitiveTaskTemplateToTag_AB_unique" ON "_RepetitiveTaskTemplateToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_RepetitiveTaskTemplateToTag_B_index" ON "_RepetitiveTaskTemplateToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TagToTask_AB_unique" ON "_TagToTask"("A", "B");

-- CreateIndex
CREATE INDEX "_TagToTask_B_index" ON "_TagToTask"("B");
