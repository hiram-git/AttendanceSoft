import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db/index.ts'
import * as schema from '../db/schema.ts'

const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3001'
const webURL = process.env.WEB_URL ?? 'http://localhost:3000'

export const auth = betterAuth({
  baseURL,
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-change-me',
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, token }) => {
      // Dev-only: surface the reset link via the API server logs.
      // Replace with a real mailer (e.g., Resend, Postmark) for production.
      const link = `${webURL}/reset-password?token=${token}`
      console.log('\n────── PASSWORD RESET ──────')
      console.log(`To:    ${user.email}`)
      console.log(`Link:  ${link}`)
      console.log('────────────────────────────\n')
    },
  },
  advanced: {
    cookies: {
      session_token: {
        attributes: {
          sameSite: 'lax',
          secure: false,
        },
      },
    },
  },
})

export type Auth = typeof auth
