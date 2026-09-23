-- CreateTable
CREATE TABLE "Textbook" (
    "id" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Textbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextbookChapter" (
    "id" TEXT NOT NULL,
    "textbookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "TextbookChapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Textbook_discipline_idx" ON "Textbook"("discipline");

-- CreateIndex
CREATE INDEX "TextbookChapter_textbookId_idx" ON "TextbookChapter"("textbookId");

-- AddForeignKey
ALTER TABLE "TextbookChapter" ADD CONSTRAINT "TextbookChapter_textbookId_fkey" FOREIGN KEY ("textbookId") REFERENCES "Textbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

