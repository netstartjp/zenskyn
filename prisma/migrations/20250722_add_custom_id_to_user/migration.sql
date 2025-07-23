ALTER TABLE "User" ADD COLUMN "customId" TEXT;

CREATE UNIQUE INDEX "User_customId_key" ON "User"("customId");