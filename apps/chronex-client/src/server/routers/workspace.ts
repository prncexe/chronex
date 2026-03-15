import { createWorkspaceProcedure, getWorkspacesProcedure } from '../procedures/user/workspace'
import { createTRPCRouter } from '../trpc'

const workspaceRouter = createTRPCRouter({
  createWorkspace: createWorkspaceProcedure,
  getWorkspaces: getWorkspacesProcedure,
})

export default workspaceRouter
