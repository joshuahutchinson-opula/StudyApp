-- DropForeignKey
ALTER TABLE "GraphEdge" DROP CONSTRAINT "GraphEdge_sourceNodeId_fkey";

-- DropForeignKey
ALTER TABLE "GraphEdge" DROP CONSTRAINT "GraphEdge_targetNodeId_fkey";

-- DropForeignKey
ALTER TABLE "GraphNode" DROP CONSTRAINT "GraphNode_userId_fkey";

-- DropIndex
DROP INDEX "GraphEdge_sourceNodeId_idx";

-- DropIndex
DROP INDEX "GraphEdge_targetNodeId_idx";

-- DropIndex
DROP INDEX "GraphEdge_userId_idx";

-- AlterTable
ALTER TABLE "GraphEdge" DROP COLUMN "sourceNodeId",
DROP COLUMN "targetNodeId",
ADD COLUMN     "discipline" "Discipline" NOT NULL,
ADD COLUMN     "sourceRef" TEXT NOT NULL,
ADD COLUMN     "targetRef" TEXT NOT NULL,
ALTER COLUMN "kind" SET DEFAULT 'manual';

-- DropTable
DROP TABLE "GraphNode";

-- DropEnum
DROP TYPE "GraphNodeKind";

-- CreateIndex
CREATE INDEX "GraphEdge_userId_discipline_idx" ON "GraphEdge"("userId", "discipline");
