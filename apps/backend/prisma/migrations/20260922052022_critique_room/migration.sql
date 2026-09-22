-- CreateTable
CREATE TABLE "CritiqueThread" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CritiqueThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CritiqueComment" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CritiqueComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CritiqueThread_pageId_idx" ON "CritiqueThread"("pageId");

-- CreateIndex
CREATE INDEX "CritiqueComment_threadId_idx" ON "CritiqueComment"("threadId");

-- AddForeignKey
ALTER TABLE "CritiqueThread" ADD CONSTRAINT "CritiqueThread_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CritiqueComment" ADD CONSTRAINT "CritiqueComment_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CritiqueThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
