-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'VENTA');

-- CreateTable
CREATE TABLE "F4111" (
    "id" SERIAL NOT NULL,
    "itm" INTEGER NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "nota" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "F4111_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "F4111_itm_idx" ON "F4111"("itm");

-- AddForeignKey
ALTER TABLE "F4111" ADD CONSTRAINT "F4111_itm_fkey" FOREIGN KEY ("itm") REFERENCES "F4101"("itm") ON DELETE CASCADE ON UPDATE CASCADE;
