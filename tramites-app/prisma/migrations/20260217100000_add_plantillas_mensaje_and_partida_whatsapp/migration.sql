-- CreateTable: plantillas de mensaje para WhatsApp (admin)
CREATE TABLE IF NOT EXISTS "plantillas_mensaje" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantillas_mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (PostgreSQL 9.5+)
CREATE UNIQUE INDEX IF NOT EXISTS "plantillas_mensaje_clave_key" ON "plantillas_mensaje"("clave");

-- AlterTable: users.whatsapp (contacto del usuario)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;

-- AlterTable: partidas.whatsapp (contacto para partidas de nacimiento, etc.)
ALTER TABLE "partidas" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;

-- AlterTable: tramites - columnas para invitados y WhatsApp (alinear con schema)
ALTER TABLE "tramites" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "tramites" ADD COLUMN IF NOT EXISTS "guestEmail" TEXT;
ALTER TABLE "tramites" ADD COLUMN IF NOT EXISTS "archivoUrl" TEXT;
ALTER TABLE "tramites" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;

-- AlterTable: pagos - datos del pagador de Mercado Pago
ALTER TABLE "pagos" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;
ALTER TABLE "pagos" ADD COLUMN IF NOT EXISTS "payerEmail" TEXT;
ALTER TABLE "pagos" ADD COLUMN IF NOT EXISTS "payerName" TEXT;
ALTER TABLE "pagos" ADD COLUMN IF NOT EXISTS "payerDni" TEXT;
ALTER TABLE "pagos" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "pagos" ADD COLUMN IF NOT EXISTS "paymentDate" TIMESTAMP(3);
ALTER TABLE "pagos" ALTER COLUMN "userId" DROP NOT NULL;
