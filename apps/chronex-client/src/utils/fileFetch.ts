import type { DB } from '@/config/drizzle'
export const getMetaData = async (fileId: string, db: DB) => {
  try {
    const newfileId = Number(fileId)
    const result = await db.query.postMedia.findFirst({
      where: (media, { eq }) => eq(media.id, newfileId),
      columns: {
        url: true,
        type: true,
        size: true,
        height: true,
        duration: true,
        width: true,
        extension: true,
        aspectRatio: true,
      },
    })

    if (!result) return result

    return {
      ...result,
      size: result.size ? Number((result.size / (1024 * 1024)).toFixed(2)) : null,
    }
  } catch (error) {
    throw new Error('Failed to retrieve metadata for file', { cause: error })
  }
}

export type FileMetaData = Awaited<ReturnType<typeof getMetaData>>
