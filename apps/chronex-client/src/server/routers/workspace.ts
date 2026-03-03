import { createWorkspaceProcedure } from "../procedures/user/workspace";
import { createTRPCRouter } from "../trpc";

const workspaceRouter = createTRPCRouter({
createWorkspace: createWorkspaceProcedure,
});

export default workspaceRouter;