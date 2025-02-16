/*
  Warnings:

  - You are about to drop the column `parameterName` on the `evaluation_parameter` table. All the data in the column will be lost.
  - Added the required column `parameter_name` to the `evaluation_parameter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "evaluation_parameter" DROP COLUMN "parameterName",
ADD COLUMN     "parameter_name" TEXT NOT NULL;
