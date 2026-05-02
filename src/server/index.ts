import 'dotenv/config'
import { api } from './api.ts'

const port = Number(process.env.API_PORT ?? 3001)

api.listen(port, () => {
  console.log(`Elysia API listening on http://localhost:${port}`)
})
