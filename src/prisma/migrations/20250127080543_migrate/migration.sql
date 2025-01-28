-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('Admin', 'Student', 'User', 'Staff', 'Judge');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('Ebook', 'Video', 'Audio', 'Story', 'Prakerin', 'Blog');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "SexType" AS ENUM ('Male', 'Female');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "profile" TEXT,
    "password" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "reset_password_token" TEXT,
    "reset_token_expires" TIMESTAMP(3),
    "refresh_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "roles_id" INTEGER NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" "RoleType" NOT NULL DEFAULT 'User',

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "content_id" INTEGER NOT NULL,
    "rating_by" INTEGER NOT NULL,
    "rating_value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "episode_id" INTEGER,

    CONSTRAINT "rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "content_id" INTEGER NOT NULL,
    "comment_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "commented_by" INTEGER NOT NULL,
    "episodes_id" INTEGER,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_attachment" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "size" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "avatar" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "avatar" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genre" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "avatar" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_podcast" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "file_id" INTEGER NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "content_id" INTEGER NOT NULL,

    CONSTRAINT "video_podcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_podcast" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "file_id" INTEGER NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "content_id" INTEGER NOT NULL,

    CONSTRAINT "audio_podcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "content_id" INTEGER NOT NULL,

    CONSTRAINT "blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ebook" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "pages" INTEGER NOT NULL,
    "publication" TEXT NOT NULL,
    "file_id" INTEGER NOT NULL,
    "isbn" TEXT NOT NULL,
    "release_date" TIMESTAMP(3) NOT NULL,
    "content_id" INTEGER NOT NULL,

    CONSTRAINT "ebook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "content_id" INTEGER NOT NULL,

    CONSTRAINT "story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "story_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prakerin" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "pages" INTEGER NOT NULL,
    "file_id" INTEGER NOT NULL,
    "published_at" TIMESTAMP(3),
    "content_id" INTEGER NOT NULL,

    CONSTRAINT "prakerin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "student_id" INTEGER NOT NULL,
    "content_id" INTEGER NOT NULL,
    "competition_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "judge" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" TEXT,
    "linkedin" TEXT,
    "instagram" TEXT,
    "competition_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "submissions_id" INTEGER,

    CONSTRAINT "judge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_parameter" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "competition_id" INTEGER NOT NULL,
    "parameterName" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_parameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "judge_id" INTEGER NOT NULL,
    "submission_id" INTEGER NOT NULL,
    "parameter_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "description" TEXT NOT NULL,
    "guide" TEXT NOT NULL,
    "winner_count" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "submission_deadline" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "winner" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "competition_id" INTEGER NOT NULL,
    "submission_id" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "winner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "major_id" INTEGER NOT NULL,
    "birthplace" TEXT,
    "birthdate" TIMESTAMP(3),
    "sex" "SexType" NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "major" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "avatar" TEXT,

    CONSTRAINT "major_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContentToGenre" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ContentToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "user_uuid_key" ON "user"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_refresh_token_key" ON "user"("refresh_token");

-- CreateIndex
CREATE INDEX "user_uuid_idx" ON "user"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "role_uuid_key" ON "role"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE INDEX "role_uuid_idx" ON "role"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "rating_uuid_key" ON "rating"("uuid");

-- CreateIndex
CREATE INDEX "rating_uuid_idx" ON "rating"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "rating_content_id_rating_by_key" ON "rating"("content_id", "rating_by");

-- CreateIndex
CREATE UNIQUE INDEX "rating_episode_id_rating_by_key" ON "rating"("episode_id", "rating_by");

-- CreateIndex
CREATE UNIQUE INDEX "comment_uuid_key" ON "comment"("uuid");

-- CreateIndex
CREATE INDEX "comment_uuid_idx" ON "comment"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "content_uuid_key" ON "content"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "content_slug_key" ON "content"("slug");

-- CreateIndex
CREATE INDEX "content_uuid_idx" ON "content"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "file_attachment_uuid_key" ON "file_attachment"("uuid");

-- CreateIndex
CREATE INDEX "file_attachment_uuid_idx" ON "file_attachment"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "category_uuid_key" ON "category"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE INDEX "category_uuid_idx" ON "category"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tag_uuid_key" ON "tag"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE INDEX "tag_uuid_idx" ON "tag"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "genre_uuid_key" ON "genre"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "genre_name_key" ON "genre"("name");

-- CreateIndex
CREATE INDEX "genre_uuid_idx" ON "genre"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "video_podcast_uuid_key" ON "video_podcast"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "video_podcast_content_id_key" ON "video_podcast"("content_id");

-- CreateIndex
CREATE INDEX "video_podcast_uuid_idx" ON "video_podcast"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "audio_podcast_uuid_key" ON "audio_podcast"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "audio_podcast_content_id_key" ON "audio_podcast"("content_id");

-- CreateIndex
CREATE INDEX "audio_podcast_uuid_idx" ON "audio_podcast"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "blog_uuid_key" ON "blog"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "blog_content_id_key" ON "blog"("content_id");

-- CreateIndex
CREATE INDEX "blog_uuid_idx" ON "blog"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "ebook_uuid_key" ON "ebook"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "ebook_content_id_key" ON "ebook"("content_id");

-- CreateIndex
CREATE INDEX "ebook_uuid_idx" ON "ebook"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "story_uuid_key" ON "story"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "story_content_id_key" ON "story"("content_id");

-- CreateIndex
CREATE INDEX "story_uuid_idx" ON "story"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "episode_uuid_key" ON "episode"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "episode_order_key" ON "episode"("order");

-- CreateIndex
CREATE INDEX "episode_uuid_idx" ON "episode"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "prakerin_uuid_key" ON "prakerin"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "prakerin_content_id_key" ON "prakerin"("content_id");

-- CreateIndex
CREATE INDEX "prakerin_uuid_idx" ON "prakerin"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "submission_uuid_key" ON "submission"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "submission_content_id_key" ON "submission"("content_id");

-- CreateIndex
CREATE INDEX "submission_uuid_idx" ON "submission"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "judge_uuid_key" ON "judge"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "judge_user_id_key" ON "judge"("user_id");

-- CreateIndex
CREATE INDEX "judge_uuid_idx" ON "judge"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_parameter_uuid_key" ON "evaluation_parameter"("uuid");

-- CreateIndex
CREATE INDEX "evaluation_parameter_uuid_idx" ON "evaluation_parameter"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "score_uuid_key" ON "score"("uuid");

-- CreateIndex
CREATE INDEX "score_uuid_idx" ON "score"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "competition_uuid_key" ON "competition"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "competition_slug_key" ON "competition"("slug");

-- CreateIndex
CREATE INDEX "competition_uuid_idx" ON "competition"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "winner_uuid_key" ON "winner"("uuid");

-- CreateIndex
CREATE INDEX "winner_uuid_idx" ON "winner"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "student_uuid_key" ON "student"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "student_nis_key" ON "student"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "student_user_id_key" ON "student"("user_id");

-- CreateIndex
CREATE INDEX "student_uuid_idx" ON "student"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "major_uuid_key" ON "major"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "major_name_key" ON "major"("name");

-- CreateIndex
CREATE INDEX "major_uuid_idx" ON "major"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentToGenre_AB_unique" ON "_ContentToGenre"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentToGenre_B_index" ON "_ContentToGenre"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentToTag_AB_unique" ON "_ContentToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentToTag_B_index" ON "_ContentToTag"("B");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_roles_id_fkey" FOREIGN KEY ("roles_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating" ADD CONSTRAINT "rating_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating" ADD CONSTRAINT "rating_rating_by_fkey" FOREIGN KEY ("rating_by") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating" ADD CONSTRAINT "rating_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_commented_by_fkey" FOREIGN KEY ("commented_by") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_episodes_id_fkey" FOREIGN KEY ("episodes_id") REFERENCES "episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_podcast" ADD CONSTRAINT "video_podcast_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_podcast" ADD CONSTRAINT "video_podcast_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_podcast" ADD CONSTRAINT "video_podcast_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_attachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_podcast" ADD CONSTRAINT "audio_podcast_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_podcast" ADD CONSTRAINT "audio_podcast_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_podcast" ADD CONSTRAINT "audio_podcast_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_attachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog" ADD CONSTRAINT "blog_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog" ADD CONSTRAINT "blog_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ebook" ADD CONSTRAINT "ebook_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ebook" ADD CONSTRAINT "ebook_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_attachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story" ADD CONSTRAINT "story_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story" ADD CONSTRAINT "story_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode" ADD CONSTRAINT "episode_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prakerin" ADD CONSTRAINT "prakerin_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prakerin" ADD CONSTRAINT "prakerin_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prakerin" ADD CONSTRAINT "prakerin_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_attachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge" ADD CONSTRAINT "judge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge" ADD CONSTRAINT "judge_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge" ADD CONSTRAINT "judge_submissions_id_fkey" FOREIGN KEY ("submissions_id") REFERENCES "submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_parameter" ADD CONSTRAINT "evaluation_parameter_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score" ADD CONSTRAINT "score_judge_id_fkey" FOREIGN KEY ("judge_id") REFERENCES "judge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score" ADD CONSTRAINT "score_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score" ADD CONSTRAINT "score_parameter_id_fkey" FOREIGN KEY ("parameter_id") REFERENCES "evaluation_parameter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winner" ADD CONSTRAINT "winner_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winner" ADD CONSTRAINT "winner_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "major"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentToGenre" ADD CONSTRAINT "_ContentToGenre_A_fkey" FOREIGN KEY ("A") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentToGenre" ADD CONSTRAINT "_ContentToGenre_B_fkey" FOREIGN KEY ("B") REFERENCES "genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentToTag" ADD CONSTRAINT "_ContentToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentToTag" ADD CONSTRAINT "_ContentToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
