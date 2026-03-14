import { DB } from '@repo/db'
import { updatePostStatus } from './utils/updatePostStatus'
export async function decideStatus(
  db: DB,
  postId: number,
  currentPlatform: 'instagram' | 'linkedin' | 'threads' | 'discord' | 'slack',
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
  const isfirstPlatform = postData?.platforms[0] === currentPlatform
  if (isfirstPlatform) {
    await updatePostStatus(db, postId, 'publishing')
    return
  }
  const isLastPlatform = postData?.platforms[postData.platforms.length - 1] === currentPlatform
  if (!isLastPlatform) {
    return
  }
  const allPreviousPublished =
    postData?.platformPosts.some((pp) => pp.status === 'published') ?? false
  if (allPreviousPublished) {
    await updatePostStatus(db, postId, 'published')
  } else {
    await updatePostStatus(db, postId, 'failed')
  }
}
