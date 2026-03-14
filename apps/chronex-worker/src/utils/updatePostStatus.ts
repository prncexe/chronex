import { DB, platformPosts, eq } from "@repo/db";

type PlatformPostStatus = "pending" | "processing" | "published" | "failed";

export async function updatePlatformPostStatus(
  db: DB,
  platformPostId: number,
  status: PlatformPostStatus,
  extra?: {
    externalId?: string;
    postUrl?: string;
    errorMessage?: string;
    publishedAt?: Date;
  },
) {
  await db
    .update(platformPosts)
    .set({
      status,
      updatedAt: new Date(),
      ...(extra?.externalId && { externalId: extra.externalId }),
      ...(extra?.postUrl && { postUrl: extra.postUrl }),
      ...(extra?.errorMessage && { errorMessage: extra.errorMessage }),
      ...(extra?.publishedAt && { publishedAt: extra.publishedAt }),
    })
    .where(eq(platformPosts.id, platformPostId));
}


export async function markProcessing(db: DB, platformPostId: number) {
  return updatePlatformPostStatus(db, platformPostId, "processing");
}


export async function markPublished(
  db: DB,
  platformPostId: number,
  externalId: string,
  postUrl: string

) {

  return updatePlatformPostStatus(db, platformPostId, "published", {
    externalId,
    publishedAt: new Date(),
    postUrl,
  });
}


export async function markFailed(
  db: DB,
  platformPostId: number,
  errorMessage: string,
) {
  return updatePlatformPostStatus(db, platformPostId, "failed", {
    errorMessage,
  });
}
export async function markPublishedIGTH(
  db: DB,
  platformPostId: number,
  externalId: string,
  token:string,
  url:string,
) {
  const response = await fetch(
  `${url}/${externalId}?fields=permalink&access_token=${token}`
);
const res:Record<any,string> = await response.json();
  return updatePlatformPostStatus(db, platformPostId, "published", {
    externalId,
    postUrl: res.permalink,
    publishedAt: new Date(),
  });
}
