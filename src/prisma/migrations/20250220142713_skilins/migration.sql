/*
  Warnings:

  - A unique constraint covering the columns `[competition_id,student_id,content_id]` on the table `submission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[competition_id,submission_id]` on the table `winner` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "submission_competition_id_student_id_content_id_key" ON "submission"("competition_id", "student_id", "content_id");

-- CreateIndex
CREATE UNIQUE INDEX "winner_competition_id_submission_id_key" ON "winner"("competition_id", "submission_id");
