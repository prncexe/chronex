import { createTRPCRouter } from '../trpc'
import { getMedia, getUser } from '../procedures/user/user'

export const userRouter = createTRPCRouter({
  getUser,
  getMedia,
})
