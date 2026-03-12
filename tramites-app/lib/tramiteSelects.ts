import { Prisma } from "@prisma/client"

export const userTramiteListSelect = Prisma.validator<Prisma.TramiteSelect>()({
  id: true,
  oficina: true,
  tipoTramite: true,
  estado: true,
  monto: true,
  archivoUrl: true,
  createdAt: true,
  pago: {
    select: {
      estado: true,
      mercadopagoId: true,
    },
  },
})

export const userTramiteDetailSelect = Prisma.validator<Prisma.TramiteSelect>()({
  id: true,
  oficina: true,
  tipoTramite: true,
  estado: true,
  descripcion: true,
  monto: true,
  archivoUrl: true,
  createdAt: true,
  updatedAt: true,
  pago: {
    select: {
      id: true,
      estado: true,
      mercadopagoId: true,
    },
  },
  partida: {
    select: {
      tipoPartida: true,
      dni: true,
      sexo: true,
      nombres: true,
      apellido: true,
      fechaNacimiento: true,
      ciudadNacimiento: true,
      fechaDefuncion: true,
      dni2: true,
      sexo2: true,
      nombres2: true,
      apellido2: true,
      fechaNacimiento2: true,
      fechaMatrimonio: true,
      ciudadMatrimonio: true,
      divorciados: true,
    },
  },
})

export const adminTramiteListSelect = Prisma.validator<Prisma.TramiteSelect>()({
  id: true,
  oficina: true,
  tipoTramite: true,
  estado: true,
  observaciones: true,
  guestEmail: true,
  whatsapp: true,
  monto: true,
  createdAt: true,
  archivoUrl: true,
  user: {
    select: {
      name: true,
      email: true,
    },
  },
  pago: {
    select: {
      estado: true,
      mercadopagoId: true,
      paymentId: true,
      payerEmail: true,
      payerName: true,
      payerDni: true,
      paymentMethod: true,
      paymentDate: true,
    },
  },
  partida: {
    select: {
      tipoPartida: true,
      nombres: true,
      apellido: true,
      dni: true,
      sexo: true,
      fechaNacimiento: true,
      ciudadNacimiento: true,
      whatsapp: true,
    },
  },
})

export const adminTramiteDetailSelect = Prisma.validator<Prisma.TramiteSelect>()({
  id: true,
  userId: true,
  oficina: true,
  tipoTramite: true,
  estado: true,
  descripcion: true,
  monto: true,
  archivoUrl: true,
  createdAt: true,
  updatedAt: true,
  guestEmail: true,
  whatsapp: true,
  user: {
    select: {
      name: true,
      email: true,
    },
  },
  pago: {
    select: {
      id: true,
      estado: true,
      mercadopagoId: true,
      paymentId: true,
      payerEmail: true,
      payerName: true,
      payerDni: true,
      paymentMethod: true,
      paymentDate: true,
    },
  },
  partida: {
    select: {
      tipoPartida: true,
      dni: true,
      sexo: true,
      nombres: true,
      apellido: true,
      fechaNacimiento: true,
      ciudadNacimiento: true,
      fechaDefuncion: true,
      dni2: true,
      sexo2: true,
      nombres2: true,
      apellido2: true,
      fechaNacimiento2: true,
      fechaMatrimonio: true,
      ciudadMatrimonio: true,
      divorciados: true,
      whatsapp: true,
      apostillado: true,
    },
  },
})
