import { getAuthToken } from "../utils/getAuthToken";
import {
  markProcessing,
  markPublished,
  markFailed,
} from "../utils/updatePostStatus";
import { fetchMediaMany } from "../utils/media";
import type { Env, PlatformJobPayload } from "../index";

export interface SlackMetadata {
  caption: string;
  fileIds: number[];
  type: "message" | "file";
  channelId?: string;
  workspaceName?: string;
}

type AuthToken = Awaited<ReturnType<typeof getAuthToken>>;
const SLACK_API = "https://slack.com/api";

async function postMessage(
  token: AuthToken,
  channelId: string,
  text: string,
): Promise<string> {
  const res = await fetch(`${SLACK_API}/chat.postMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token.accessToken}`,
    },
    body: JSON.stringify({ channel: channelId, text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Slack chat.postMessage HTTP error: ${err}`);
  }

  const data = (await res.json()) as {
    ok: boolean;
    ts?: string;
    error?: string;
  };

  if (!data.ok) {
    throw new Error(`Slack chat.postMessage failed: ${data.error}`);
  }

  return data.ts ?? "";
}

async function uploadFile(
  token: AuthToken,
  channelId: string,
  fileName: string,
  mediaUrl: string,
): Promise<string> {
  const mediaRes = await fetch(mediaUrl);
  if (!mediaRes.ok) {
    throw new Error(
      `Failed to fetch media for Slack upload: ${mediaRes.status} ${mediaRes.statusText}`,
    );
  }

  const fileBytes = await mediaRes.arrayBuffer();
  const contentType =
    mediaRes.headers.get("content-type") ?? "application/octet-stream";
  const fileSize = fileBytes.byteLength;

  if (!fileSize) {
    throw new Error(`Could not determine file size for ${fileName}`);
  }

  const getUrlBody = new URLSearchParams({
    filename: fileName,
    length: String(fileSize),
  });

  const urlRes = await fetch(`${SLACK_API}/files.getUploadURLExternal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Authorization: `Bearer ${token.accessToken}`,
    },
    body: getUrlBody,
  });

  if (!urlRes.ok) {
    const err = await urlRes.text();
    throw new Error(`Slack files.getUploadURLExternal HTTP error: ${err}`);
  }

  const urlData = (await urlRes.json()) as {
    ok: boolean;
    upload_url?: string;
    file_id?: string;
    error?: string;
  };

  if (!urlData.ok || !urlData.upload_url || !urlData.file_id) {
    throw new Error(
      `Slack files.getUploadURLExternal failed: ${urlData.error ?? "Unknown error"}`,
    );
  }

  const uploadRes = await fetch(urlData.upload_url, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileSize),
    },
    body: fileBytes,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Slack file upload failed: ${err}`);
  }

  const completeBody = new URLSearchParams({
    files: JSON.stringify([{ id: urlData.file_id, title: fileName }]),
    channel_id: channelId,
  });

  const completeRes = await fetch(`${SLACK_API}/files.completeUploadExternal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Authorization: `Bearer ${token.accessToken}`,
    },
    body: completeBody,
  });

  if (!completeRes.ok) {
    const err = await completeRes.text();
    throw new Error(`Slack files.completeUploadExternal HTTP error: ${err}`);
  }

  const completeData = (await completeRes.json()) as {
    ok: boolean;
    files?: Array<{ id: string }>;
    error?: string;
  };

  if (!completeData.ok) {
    throw new Error(
      `Slack files.completeUploadExternal failed: ${completeData.error ?? "Unknown error"}`,
    );
  }

  const file = completeData.files?.[0];
  if (!file) {
    throw new Error("Slack files.completeUploadExternal returned no file");
  }

  return file.id;
}

export const SlackMessage = async (
  payload: PlatformJobPayload,
  env: Env,
): Promise<void> => {
  const db = (await import("@repo/db")).createDb(env.DATABASE_URL);
  const data = payload.metadata as SlackMetadata;

  try {
    await markProcessing(db, payload.platformPostId);

    const token = await getAuthToken(db, payload.workspaceId, "slack");
    const channelId = data.channelId ?? token.profileId ?? "";

    if (!channelId) {
      throw new Error("No Slack channel ID specified");
    }

    const ts = await postMessage(token, channelId, data.caption);
    await markPublished(
      db,
      payload.platformPostId,
      ts,
      `https://${data.workspaceName}.slack.com/archives/${channelId}/p${ts.replace(".", "")}`,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await markFailed(db, payload.platformPostId, msg);
    throw error;
  }
};

export const SlackFile = async (
  payload: PlatformJobPayload,
  env: Env,
): Promise<void> => {
  const db = (await import("@repo/db")).createDb(env.DATABASE_URL);
  const data = payload.metadata as SlackMetadata;

  try {
    await markProcessing(db, payload.platformPostId);

    const token = await getAuthToken(db, payload.workspaceId, "slack");
    const channelId = data.channelId ?? token.profileId ?? "";

    if (!channelId) throw new Error("No Slack channel ID specified");
    if (!data.workspaceName) throw new Error("No Slack workspace name specified");

    // Post caption first to get a real ts
    const ts = await postMessage(token, channelId, data.caption);

    // Upload files into the same channel
    const mediaItems = await fetchMediaMany(db, data.fileIds);
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i]!;
      const urlPath = new URL(item.url).pathname;
      const fileName =
        urlPath.split("/").pop() || `file_${i}.${item.extension ?? "bin"}`;
      await uploadFile(token, channelId, fileName, item.url);
    }

    await markPublished(
      db,
      payload.platformPostId,
      ts,
      `https://${data.workspaceName}.slack.com/archives/${channelId}/p${ts.replace(".", "")}`,
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await markFailed(db, payload.platformPostId, msg);
    throw error;
  }
};