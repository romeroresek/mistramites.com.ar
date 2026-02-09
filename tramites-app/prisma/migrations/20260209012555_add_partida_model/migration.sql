-- CreateTable
CREATE TABLE "partidas" (
    "id" TEXT NOT NULL,
    "tramiteId" TEXT NOT NULL,
    "tipoPartida" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "ciudadNacimiento" TEXT,
    "fechaDefuncion" TIMESTAMP(3),
    "dni2" TEXT,
    "sexo2" TEXT,
    "nombres2" TEXT,
    "apellido2" TEXT,
    "fechaNacimiento2" TIMESTAMP(3),
    "fechaMatrimonio" TIMESTAMP(3),
    "ciudadMatrimonio" TEXT,
    "divorciados" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partidas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partidas_tramiteId_key" ON "partidas"("tramiteId");

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_tramiteId_fkey" FOREIGN KEY ("tramiteId") REFERENCES "tramites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
