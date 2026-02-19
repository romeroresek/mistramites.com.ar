import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions, Session } from "next-auth"
import type { JWT } from "next-auth/jwt"

// Carga diferida: Prisma y bcrypt solo se cargan en login (authorize/signIn),
// no al devolver la sesión JWT. Reduce cold start en la primera carga de la app.
async function getPrisma() {
  const { prisma } = await import("./prisma")
  return prisma
}

export const authOptions: NextAuthOptions = {
  // NO usar PrismaAdapter con CredentialsProvider - causa conflictos
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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const prisma = await getPrisma()
        const { default: bcrypt } = await import("bcryptjs")

        // Solo traer los campos necesarios para autenticación
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            role: true,
          },
        })

        if (!user?.password) {
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValidPassword) {
          return null
        }

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
    async signIn({ user, account }) {
      // Para Google OAuth, crear/actualizar usuario en la DB
      if (account?.provider === "google" && user.email) {
        const prisma = await getPrisma()
        // Usar upsert para una sola operación de DB
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            image: user.image,
          },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
          },
          select: { id: true, role: true },
        })
        user.id = dbUser.id
        user.role = dbUser.role
      }
      return true
    },
    async jwt({ token, user }: { token: JWT; user?: { id?: string; role?: string } }) {
      if (user) {
        token.id = user.id
        token.role = user.role || "usuario"
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string
        (session.user as { id?: string; role?: string }).role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/cerrar-sesion",
  },
}
