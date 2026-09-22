-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('medicine', 'software', 'writing', 'engineering', 'arts');

-- CreateEnum
CREATE TYPE "MasteryLevel" AS ENUM ('unfamiliar', 'learning', 'familiar', 'mastered');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('backlog', 'todo', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "DeadlineSource" AS ENUM ('manual', 'syllabus_import');

-- CreateEnum
CREATE TYPE "StudyMode" AS ENUM ('pomodoro', 'deep_work', 'free');

-- CreateEnum
CREATE TYPE "GraphNodeKind" AS ENUM ('note', 'task', 'source', 'flashcard');

-- CreateEnum
CREATE TYPE "GraphEdgeKind" AS ENUM ('cites', 'references', 'tags', 'ai_suggested');

-- CreateEnum
CREATE TYPE "CitationStyle" AS ENUM ('ama', 'ieee', 'mla', 'chicago');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "activeDiscipline" "Discipline" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Binder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Binder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabDivider" (
    "id" TEXT NOT NULL,
    "binderId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TabDivider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "binderId" TEXT NOT NULL,
    "tabDividerId" TEXT,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" JSONB NOT NULL DEFAULT '[]',
    "masteryLevel" "MasteryLevel" NOT NULL DEFAULT 'unfamiliar',
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarginAnnotation" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "anchorBlockId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarginAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'todo',
    "parentTaskId" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "source" "DeadlineSource" NOT NULL DEFAULT 'manual',
    "relatedTaskId" TEXT,
    "recurrenceRule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "StudyMode" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "focusMinutes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpacedRepetitionCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourcePageId" TEXT,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "masteryLevel" "MasteryLevel" NOT NULL DEFAULT 'unfamiliar',
    "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intervalDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SpacedRepetitionCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraphNode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "GraphNodeKind" NOT NULL,
    "refId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "GraphNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraphEdge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "kind" "GraphEdgeKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GraphEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "style" "CitationStyle" NOT NULL,
    "sourceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT[],
    "year" INTEGER,
    "publisher" TEXT,
    "url" TEXT,
    "doi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Citation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Binder_userId_idx" ON "Binder"("userId");

-- CreateIndex
CREATE INDEX "TabDivider_binderId_idx" ON "TabDivider"("binderId");

-- CreateIndex
CREATE INDEX "Page_binderId_idx" ON "Page"("binderId");

-- CreateIndex
CREATE INDEX "Page_tabDividerId_idx" ON "Page"("tabDividerId");

-- CreateIndex
CREATE INDEX "MarginAnnotation_pageId_idx" ON "MarginAnnotation"("pageId");

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId");

-- CreateIndex
CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");

-- CreateIndex
CREATE INDEX "Deadline_userId_idx" ON "Deadline"("userId");

-- CreateIndex
CREATE INDEX "Deadline_relatedTaskId_idx" ON "Deadline"("relatedTaskId");

-- CreateIndex
CREATE INDEX "StudySession_userId_idx" ON "StudySession"("userId");

-- CreateIndex
CREATE INDEX "SpacedRepetitionCard_userId_idx" ON "SpacedRepetitionCard"("userId");

-- CreateIndex
CREATE INDEX "SpacedRepetitionCard_sourcePageId_idx" ON "SpacedRepetitionCard"("sourcePageId");

-- CreateIndex
CREATE INDEX "GraphNode_userId_idx" ON "GraphNode"("userId");

-- CreateIndex
CREATE INDEX "GraphNode_refId_idx" ON "GraphNode"("refId");

-- CreateIndex
CREATE INDEX "GraphEdge_userId_idx" ON "GraphEdge"("userId");

-- CreateIndex
CREATE INDEX "GraphEdge_sourceNodeId_idx" ON "GraphEdge"("sourceNodeId");

-- CreateIndex
CREATE INDEX "GraphEdge_targetNodeId_idx" ON "GraphEdge"("targetNodeId");

-- CreateIndex
CREATE INDEX "Citation_userId_idx" ON "Citation"("userId");

-- AddForeignKey
ALTER TABLE "Binder" ADD CONSTRAINT "Binder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabDivider" ADD CONSTRAINT "TabDivider_binderId_fkey" FOREIGN KEY ("binderId") REFERENCES "Binder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_binderId_fkey" FOREIGN KEY ("binderId") REFERENCES "Binder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_tabDividerId_fkey" FOREIGN KEY ("tabDividerId") REFERENCES "TabDivider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarginAnnotation" ADD CONSTRAINT "MarginAnnotation_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_relatedTaskId_fkey" FOREIGN KEY ("relatedTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpacedRepetitionCard" ADD CONSTRAINT "SpacedRepetitionCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpacedRepetitionCard" ADD CONSTRAINT "SpacedRepetitionCard_sourcePageId_fkey" FOREIGN KEY ("sourcePageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphNode" ADD CONSTRAINT "GraphNode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "GraphNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "GraphNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citation" ADD CONSTRAINT "Citation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
