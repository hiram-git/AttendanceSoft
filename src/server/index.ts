import 'dotenv/config'
import { api } from './api.ts'

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001)
const hostname = process.env.HOST ?? '0.0.0.0'

api.listen({ port, hostname }, ({ hostname: h, port: p }) => {
  console.log(`Elysia API listening on http://${h}:${p}`)
})
