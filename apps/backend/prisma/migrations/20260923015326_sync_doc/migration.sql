-- CreateTable
CREATE TABLE "SyncDoc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "docKey" TEXT NOT NULL,
    "state" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncDoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncDoc_userId_docKey_key" ON "SyncDoc"("userId", "docKey");

-- AddForeignKey
ALTER TABLE "SyncDoc" ADD CONSTRAINT "SyncDoc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

