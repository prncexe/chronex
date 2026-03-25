import { createTRPCRouter } from '../trpc'
import { getMedia, getUser } from '../procedures/user/user'
import { getChannels } from '../procedures/user/channels'

export const userRouter = createTRPCRouter({
  getUser,
  getMedia,
  getChannels,
})
