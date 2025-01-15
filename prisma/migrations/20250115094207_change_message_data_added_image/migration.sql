/*
  Warnings:

  - You are about to drop the column `Image` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "Image",
ADD COLUMN     "image" BYTEA;
