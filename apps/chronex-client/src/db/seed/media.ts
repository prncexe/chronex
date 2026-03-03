import { db } from "@/config/drizzle";
import { postMedia } from "@/db/schema";
import { workspace } from "@/db/schema";
import { user } from "@/db/schema";

export async function seedMedia() {
  // Fetch one workspace + user to attach media to
  const [existingWorkspace] = await db.select().from(workspace).limit(1);
  const [existingUser] = await db.select().from(user).limit(1);

  if (!existingWorkspace || !existingUser) {
    throw new Error("Workspace or User missing. Seed them first.");
  }

  await db.insert(postMedia).values([
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/image1.jpg",
      type: "image",
      size: 1200000, // bytes
      height: 1080,
      width: 1920,
      duration: null,
      extension: "jpg",
      aspectRatio: "16:9",
    },
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/video1.mp4",
      type: "video",
      size: 45000000,
      height: 1080,
      width: 1920,
      duration: 32, // seconds
      extension: "mp4",
      aspectRatio: "16:9",
    },
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/reel1.mp4",
      type: "video",
      size: 18000000,
      height: 1920,
      width: 1080,
      duration: 15,
      extension: "mp4",
      aspectRatio: "9:16",
    },
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/image2.png",
      type: "image",
      size: 980000,
      height: 1080,
      width: 1080,
      duration: null,
      extension: "png",
      aspectRatio: "1:1",
    },
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/image3.webp",
      type: "image",
      size: 760000,
      height: 1350,
      width: 1080,
      duration: null,
      extension: "webp",
      aspectRatio: "4:5",
    },
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/image4.jpg",
      type: "image",
      size: 1400000,
      height: 1080,
      width: 1350,
      duration: null,
      extension: "jpg",
      aspectRatio: "5:4",
    },
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/image5.jpg",
      type: "image",
      size: 2100000,
      height: 2160,
      width: 3840,
      duration: null,
      extension: "jpg",
      aspectRatio: "16:9",
    },
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/video2.mp4",
      type: "video",
      size: 52000000,
      height: 2160,
      width: 3840,
      duration: 58,
      extension: "mp4",
      aspectRatio: "16:9",
    },
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/video3.mp4",
      type: "video",
      size: 31000000,
      height: 720,
      width: 1280,
      duration: 45,
      extension: "mp4",
      aspectRatio: "16:9",
    },
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/reel2.mp4",
      type: "video",
      size: 12500000,
      height: 1920,
      width: 1080,
      duration: 12,
      extension: "mp4",
      aspectRatio: "9:16",
    },
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/reel3.mp4",
      type: "video",
      size: 16800000,
      height: 1920,
      width: 1080,
      duration: 20,
      extension: "mp4",
      aspectRatio: "9:16",
    },
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/image6.png",
      type: "image",
      size: 640000,
      height: 1200,
      width: 1200,
      duration: null,
      extension: "png",
      aspectRatio: "1:1",
    },
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/image7.jpg",
      type: "image",
      size: 1530000,
      height: 2000,
      width: 3000,
      duration: null,
      extension: "jpg",
      aspectRatio: "3:2",
    },
    {
      workspaceId: existingWorkspace.id,
      userId: existingUser.id,
      url: "https://cdn.example.com/video4.mp4",
      type: "video",
      size: 27400000,
      height: 1440,
      width: 2560,
      duration: 38,
      extension: "mp4",
      aspectRatio: "16:9",
    },
  ]);

  console.log("Media seeded successfully.");
}

export async function main() {
  try {
    await seedMedia();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
