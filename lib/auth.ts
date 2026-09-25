import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"
import { normalizeEmail, normalizeUsername } from "@/lib/usernames"

const client = new MongoClient(process.env.MONGODB_URI!)

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        login: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const login = typeof credentials?.login === "string"
          ? credentials.login
          : typeof (credentials as any)?.email === "string"
            ? (credentials as any).email
            : ""
        const normalizedLogin = login.includes("@") ? normalizeEmail(login) : normalizeUsername(login)

        if (!normalizedLogin || !credentials?.password) {
          return null
        }

        try {
          await client.connect()
          const db = client.db("inventory_portal")
          const users = db.collection("users")

          const user = await users.findOne(
            login.includes("@")
              ? { email: normalizedLogin }
              : { $or: [{ username: normalizedLogin }, { email: normalizedLogin }] },
          )

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user._id.toString(),
            email: user.email,
            username: user.username || "",
            name: user.name,
            role: user.role,
            allowedIps: user.allowedIps || ["*"],
            status: user.status || "active"
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        } finally {
          await client.close()
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.allowedIps = user.allowedIps
        token.email = user.email  // ✅ add email here
        token.username = user.username
        token.status = user.status
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.allowedIps = token.allowedIps as string[]
        session.user.email = token.email as string
        session.user.username = token.username as string
        session.user.status = token.status as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
