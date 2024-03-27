/*
  Warnings:

  - A unique constraint covering the columns `[session_id]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `session_id` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "session_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_id_key" ON "sessions"("session_id");
