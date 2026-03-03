"use client";
import { authClient } from "@/utils/authClient";
import { trpc } from "@/utils/trpc";
import { useEffect } from "react";
import { hello } from "@repo/shared";
export default function Home() {
  const users = trpc.post.createPost.useMutation();
const test = trpc.post.testQueueConnection.useQuery();
const hellodata = hello()
console.log(hellodata);
  // const workspace = trpc.workspace.createWorkspace.useMutation();

  const chupchapsignupkarle = async () => {
    const data = await authClient.signIn.social(
      {
        provider: "github",
      },
      {
        onRequest: (ctx) => {
          console.log("Signup request started");
        },
        onSuccess: (ctx) => {
          console.log("Signup successful");
        },
        onError: (ctx) => {
          // display the error message
          alert(ctx.error.message);
        },
      },
    );
  };
  // Sample payload for createPost
  const samplePostData = {
    title: "My awesome post",
    content: ["5", "3", "2", "1", "9"], // Array of media IDs from your storage
    platforms: ["instagram", "linkedin", "discord"],
    scheduledAt: new Date("2026-03-05T10:00:00Z"),
    platformdata: [
      // Instagram carousel
      {
        platform: "instagram",
        type: "carousel",
        caption: "Check out these amazing photos! 📸",
        hashtags: ["travel", "photography", "sunset"],
        fileIds: ["5", "3"],
      },
      // LinkedIn image post
      {
        platform: "linkedin",
        type: "image",
        caption: "Excited to share our latest project update!",
        fileIds: ["2"],
      },
      // Discord message
      {
        platform: "discord",
        type: "message",
        caption: "New content just dropped!",
        fileIds: ["1", "9"],
      },
    ],
  };

  // For threads + slack combo
  const anotherSample = {
    title: "Text-based post",
    content: ["media-id-789"],
    platforms: ["threads", "slack"],
    scheduledAt: new Date("2026-03-10T14:30:00Z"),
    platformdata: [
      {
        platform: "threads",
        type: "text",
        caption: "Just sharing some thoughts...",
        description: "Extended text goes here",
        hashtags: ["thoughts"],
      },
      {
        platform: "slack",
        type: "message",
        caption: "Team update: we're live!",
      },
    ],
  };
  const createPost = async () => {
    const data = await users.mutateAsync({
      title: "My awesome post",
      content: ["5", "3", "2", "1", "9"], // Array of media IDs from your storage
      platforms: ["instagram","linkedin","discord"],
      scheduledAt: new Date(Date.now() ),
      platformdata: [
        // Instagram carousel
        {
          platform: "instagram",
          type: "reel",
          caption: "Check out these amazing photos! 📸",
          hashtags: ["travel", "photography", "sunset"],
          fileIds: ["2"],
        },
        {
          platform: "linkedin",
          type: "image",
          caption: "Excited to share our latest project update!",
          fileIds: ["7"]
        },
        // Discord message
        {
          platform: "discord",
          type: "file",
          caption: "New content just dropped!",
          fileIds: ["1","7"]
        }
      ],
    });
    console.log(data);
  };
  return (
    <>
      <h1>Welcome to Better Auth with Next.js and Drizzle ORM</h1>
      <button onClick={chupchapsignupkarle}>
        click to create Login/Signup
      </button>
      <br />
      <button onClick={createPost}>create post</button>
      {/* <div>{hello.data?.greeting}</div> */}
      {/* <div onClick={getusers}> click me daddy</div> */}
      <br />
      <button>click me to use fetch query</button>
      <br />
      {/* <button onClick={()=>fetch("/api")}>click to add users</button> */}
    </>
  );
}
