/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Worker — Queue Consumer
 *
 * Listens to the platform jobs queue and processes scheduled posts.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlatformJobPayload {
  postId: number;
  platformPostId: number;
  platform: string;
  workspaceId: number;
  scheduledAt: string; // ISO string
}

export interface Env {
  ENVIRONMENT: string;
  // Add any other environment variables/bindings here
  // e.g., DATABASE_URL, API_KEYS, KV namespaces, etc.
}

// ─── Message Handler ──────────────────────────────────────────────────────────

async function processJob(job: PlatformJobPayload, env: Env): Promise<void> {
  console.log(`Processing job for platform: ${job.platform}`);
  console.log(
    `Post ID: ${job.postId}, Platform Post ID: ${job.platformPostId}`,
  );
  console.log(`Workspace ID: ${job.workspaceId}`);
  console.log(`Scheduled at: ${job.scheduledAt}`);

  // TODO: Implement your platform-specific publishing logic here
  // Example:
  // switch (job.platform) {
  //   case 'linkedin':
  //     await publishToLinkedIn(job, env);
  //     break;
  //   case 'instagram':
  //     await publishToInstagram(job, env);
  //     break;
  //   case 'discord':
  //     await publishToDiscord(job, env);
  //     break;
  //   case 'slack':
  //     await publishToSlack(job, env);
  //     break;
  //   case 'threads':
  //     await publishToThreads(job, env);
  //     break;
  //   default:
  //     throw new Error(`Unsupported platform: ${job.platform}`);
  // }

  console.log(`Successfully processed job for post ${job.postId}`);
}

// ─── Worker Export ────────────────────────────────────────────────────────────

export default {
  /**
   * Queue consumer handler
   * Called when messages are available in the queue
   */
  async queue(
    batch: MessageBatch<PlatformJobPayload>,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    console.log(`Received batch of ${batch.messages.length} messages`);

    for (const message of batch.messages) {
      try {
        const job = message.body;

        // Validate the message payload
        if (!job.postId || !job.platform || !job.platformPostId) {
          console.error("Invalid job payload:", job);
          message.ack(); // Acknowledge to remove from queue
          continue;
        }

        await processJob(job, env);

        // Acknowledge successful processing
        message.ack();
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);

        // Retry the message (will be retried up to max_retries times)
        message.retry();
      }
    }
  },

  /**
   * Optional: HTTP handler for health checks or manual triggers
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          environment: env.ENVIRONMENT,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response("Chronex Queue Worker", { status: 200 });
  },
};
