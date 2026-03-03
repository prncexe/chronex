import {
  createPost,
  getUploadUrl,
  testQueueConnection,
} from "../procedures/user/post";
import { createTRPCRouter } from "../trpc";

export const postRouter = createTRPCRouter({
  getUploadUrl: getUploadUrl,
  createPost: createPost,
  testQueueConnection: testQueueConnection,
});
