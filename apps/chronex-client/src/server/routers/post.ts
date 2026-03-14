import { createPost, getUploadUrl, saveMedia } from '../procedures/user/post'
import { createTRPCRouter } from '../trpc'

export const postRouter = createTRPCRouter({
  getUploadUrl: getUploadUrl,
  createPost: createPost,
  saveMedia: saveMedia,
})
