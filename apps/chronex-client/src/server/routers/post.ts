import {
  createPost,
  getUploadUrl,
  getUserPostById,
  getUserPosts,
  saveMedia,
} from '../procedures/user/post'
import { createTRPCRouter } from '../trpc'

export const postRouter = createTRPCRouter({
  getUploadUrl: getUploadUrl,
  createPost: createPost,
  saveMedia: saveMedia,
  getUserPosts: getUserPosts,
  getUserPostById: getUserPostById,
})
