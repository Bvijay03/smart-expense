-- AlterTable
ALTER TABLE "users" DROP COLUMN "reset_token",
DROP COLUMN "reset_token_exp",
ADD COLUMN     "security_question" TEXT,
ADD COLUMN     "security_answer" TEXT;
