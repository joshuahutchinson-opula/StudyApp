/*
  Warnings:

  - Added the required column `discipline` to the `SpacedRepetitionCard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpacedRepetitionCard" ADD COLUMN     "discipline" "Discipline" NOT NULL;
