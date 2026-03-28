import { DB } from '@repo/db'
import { updatePostStatus } from './utils/updatePostStatus'
export async function decideStatus(
  db: DB,
  postId: number,
  _currentPlatform: 'instagram' | 'linkedin' | 'threads' | 'discord' | 'slack' | 'telegram',
) {
  const postData = await db.query.post.findFirst({
    where: (t, { eq }) => eq(t.id, postId),
    with: {
      platformPosts: {
        columns: {
          status: true,
        },
      },
    },
  })

  if (!postData || postData.platformPosts.length === 0) {
    return
  }

  const statuses = postData.platformPosts.map((pp) => pp.status)
  const allPublished = statuses.every((status) => status === 'published')

  if (allPublished) {
    await updatePostStatus(db, postId, 'published')
    return
  }

  const hasInFlightStatuses = statuses.some(
    (status) => status === 'pending' || status === 'processing',
  )

  if (hasInFlightStatuses) {
    await updatePostStatus(db, postId, 'publishing')
    return
  }

  const hasFailedStatus = statuses.some((status) => status === 'failed')

  if (hasFailedStatus) {
    await updatePostStatus(db, postId, 'failed')
  }
}
