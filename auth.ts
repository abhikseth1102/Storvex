import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 Days
  },
  providers: [
    CredentialsProvider({
      name: 'Storvex Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@storvex.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Login Failed: Missing email or password.')
          return null
        }

        const cleanEmail = (credentials.email as string).toLowerCase().trim()
        const rawPassword = credentials.password as string

        try {
          const user = await prisma.user.findUnique({
            where: { email: cleanEmail },
          })

          if (!user || !user.password) {
            console.log('❌ Login Failed: User not found in Neon DB for email:', cleanEmail)
            return null
          }

          const isValidPassword = await bcrypt.compare(rawPassword, user.password)

          if (!isValidPassword) {
            console.log('❌ Login Failed: Incorrect password provided for:', cleanEmail)
            return null
          }

          console.log('✅ Login Successful! Generating session for:', user.email)

          return {
            id: user.id,
            email: user.email,
            name: user.fullName, 
            role: user.role,
            tenantId: user.tenantId,
          }
        } catch (error) {
          console.error('❌ Auth Database Query Error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    // ==========================================================================
    // 1. REDIRECT CALLBACK (The Boomerang Blocker!)
    // Forces Auth.js to send users to the dashboard instead of looping on login.
    // ==========================================================================
    async redirect({ url, baseUrl }) {
      // If the redirect URL is trying to send the user back to the login screen, force them to the dashboard!
      if (url.includes('/api/auth/signin') || url.includes('/signin')) {
        return baseUrl
      }
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },

    // ==========================================================================
    // 2. JWT CALLBACK
    // ==========================================================================
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
      }
      return token
    },

    // ==========================================================================
    // 3. SESSION CALLBACK
    // ==========================================================================
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
      }
      return session
    },
  },
})