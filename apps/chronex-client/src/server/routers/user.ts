import { createTRPCRouter } from '../trpc'
import { getUser } from '../procedures/user/user'

export const userRouter = createTRPCRouter({
  getUser,
})
