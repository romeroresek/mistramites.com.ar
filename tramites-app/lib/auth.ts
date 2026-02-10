import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import type { NextAuthOptions } from "next-auth"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] Intento de login con email:", credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Error: Credenciales vacías")
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        console.log("[AUTH] Usuario encontrado:", user ? "Sí" : "No")
        console.log("[AUTH] Usuario tiene password:", user?.password ? "Sí" : "No")

        if (!user || !user.password) {
          console.log("[AUTH] Error: Usuario no encontrado o sin password")
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        console.log("[AUTH] Password válido:", isValidPassword)

        if (!isValidPassword) {
          console.log("[AUTH] Error: Contraseña incorrecta")
          return null
        }

        console.log("[AUTH] Login exitoso para:", user.email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
