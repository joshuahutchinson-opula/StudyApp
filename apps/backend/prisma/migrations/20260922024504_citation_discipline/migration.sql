/*
  Warnings:

  - Added the required column `discipline` to the `Citation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Citation" ADD COLUMN     "discipline" "Discipline" NOT NULL;
