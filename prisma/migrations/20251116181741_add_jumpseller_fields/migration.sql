/*
  Warnings:

  - A unique constraint covering the columns `[jumpseller_id]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[jumpseller_id]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "jumpseller_id" INTEGER,
ADD COLUMN     "permalink" TEXT,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "stock" INTEGER;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "jumpseller_id" INTEGER,
ADD COLUMN     "reviewer_email" TEXT,
ADD COLUMN     "reviewer_name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_jumpseller_id_key" ON "Product"("jumpseller_id");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Review_jumpseller_id_key" ON "Review"("jumpseller_id");
