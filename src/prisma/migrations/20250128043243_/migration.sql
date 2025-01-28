/*
  Warnings:

  - You are about to drop the column `file_id` on the `video_podcast` table. All the data in the column will be lost.
  - Added the required column `link` to the `video_podcast` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "video_podcast" DROP CONSTRAINT "video_podcast_file_id_fkey";

-- AlterTable
ALTER TABLE "video_podcast" DROP COLUMN "file_id",
ADD COLUMN     "link" TEXT NOT NULL;
