import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db/index.ts'
import * as schema from '../db/schema.ts'

// Public URL where this API is reachable. In prod Vercel/Cloudflare/Railway
// expose this; locally it defaults to PORT-derived localhost.
const apiURL =
  process.env.PUBLIC_API_URL ??
  `http://${process.env.HOST ?? 'localhost'}:${process.env.PORT ?? '3001'}`

const webURL = process.env.WEB_URL ?? 'http://localhost:3000'

const isProd = process.env.NODE_ENV === 'production'

export const auth = betterAuth({
  baseURL: apiURL,
  basePath: '/api/auth',
  secret:
    process.env.AUTH_SECRET ??
    process.env.BETTER_AUTH_SECRET ??
    'dev-secret-change-me',
  trustedOrigins: [webURL, apiURL],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'staff',
        input: true,
      },
      clientId: {
        type: 'string',
        required: false,
        input: true,
      },
    },
  },
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
          secure: isProd,
        },
      },
    },
  },
})

export type Auth = typeof auth
