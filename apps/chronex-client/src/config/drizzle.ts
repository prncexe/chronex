import { createDb, type DB } from '@repo/db'

export const db = createDb(process.env.DATABASE_URL!)

export type { DB }
