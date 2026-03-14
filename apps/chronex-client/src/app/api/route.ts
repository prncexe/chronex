import { db } from '@/config/drizzle'
import { seedMedia } from '@repo/db'

export async function GET() {
  seedMedia(db).catch((error) => {
    console.error('Error seeding media:', error)
  })
  return new Response('Hello, World!')
}
