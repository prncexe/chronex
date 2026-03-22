import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'
export default defineConfig({
  out: './drizzle',
  schema: './src/utils/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
