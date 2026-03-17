'use client'
import { authClient } from '@/utils/authClient'
import { trpc } from '@/utils/trpc'
import { useEffect } from 'react'
export default function Home() {
  const users = trpc.post.createPost.useMutation()
  const workspace = trpc.workspace.createWorkspace.useMutation()
  const oauth = trpc.oauthRouter.slack.useMutation()
  const media = trpc.post.saveMedia.useMutation()
  // const getusers = trpc.example.getAll.useQuery();
  // console.log(getusers.data);
  const getUrl = trpc.post.getUploadUrl.useQuery(undefined, {
    enabled: false,
  })
  useEffect(() => {
    if (getUrl.data) {
      console.log('Upload URL:', getUrl.data)
    }
  }, [getUrl.data])
  const chupchapsignupkarle = async () => {
    await authClient.signIn.social(
      {
        provider: 'github',
      },
      {
        onRequest: (ctx) => {
          console.log('Signup request started')
        },
        onSuccess: (ctx) => {
          console.log('Signup successful')
        },
        onError: (ctx) => {
          // display the error message
          alert(ctx.error.message)
        },
      },
    )
  }
  const chupchapsignoutkarle = async () => {
    await authClient.signOut(
      {},
      {
        onRequest: (ctx) => {
          console.log('Signout request started')
        },
        onSuccess: (ctx) => {
          console.log('Signout successful')
          localStorage.removeItem('workspaceId')
        },
        onError: (ctx) => {
          // display the error message
          alert(ctx.error.message)
        },
      },
    )
  }

  const createPost = async () => {
    const date = new Date(Date.now()) // Schedule for 1 hour from now
    const data = await users.mutateAsync({
      title: 'My awesome post',
      content: [], // Array of media IDs from your storage
      platforms: ['slack', 'instagram', 'linkedin', 'threads', 'discord'],
      scheduledAt: date,
      platformdata: [
        //  {
        //     platform: "slack",
        //     type: "file",
        //     caption: "yokoso watashino soul society",
        //     fileIds:["1","2","9"],
        //     channelId:"C0AEB4DEQHK",
        //     workspaceName:"chronex-group"
        //  },
        {
          platform: 'discord',
          type: 'message',
          caption: 'yeh discord file hai',
          channelId: '1042078978430746666',
          // fileIds:["9","3"]
        },
        // {
        //     platform: "instagram",
        //     type: "carousel",
        //     caption: "Check out these amazing photos! 📸",
        //     fileIds: ["1", "2","3","4","5","6","8","9"],
        //  },
        //  {
        //   platform:"linkedin",
        //   type:"MultiPost",
        //   caption:"yeh linkedin video hai",
        //   fileIds:["1","2"]

        //  },
        //  {
        //   platform:"threads",
        //   type:"carousel",
        //   caption:"yeh threads carousel hai",
        //   fileIds:["1","2","3","4","5","6","8"],
        //  }
      ],
    })
    console.log(data)
  }
  const oauthfunc = async () => {
    const data = await oauth.mutateAsync({
      code: '10490576294546.10653358504737.096ca912018ea0ad9fe53a98a33decc8d9fda6734364f1fc4ddcb5afece7655c',
    })
    console.log(data)
  }
  const save = async () => {
    const data = await media.mutateAsync({
      contentType: 'video',
      fileId:
        '4_zbf1f4b8f41d7955d97cc051c_f11566d0ffbbeb06e_d20260307_m043706_c005_v0501022_t0028_u01772858226624',
    })
    console.log(data)
  }
  return (
    <>
      <h1>Welcome to Better Auth with Next.js and Drizzle ORM</h1>
      <button onClick={chupchapsignupkarle}>click to create Login/Signup</button>
      <br />
      <button onClick={createPost}>create post</button>

      <br />
      {/* <button onClick={()=>workspace.mutate({name:"jo bhi ho"})}>click me to use fetch query</button> */}
      <br />
      {/* <button onClick={()=>fetch("/api")}>click to add users</button> */}
      <button onClick={save}>click to authenticate with Instagram</button>
      <br />
      <button className="font-bold text-red-500" onClick={() => getUrl.refetch()}>
        click to fetch upload URL
      </button>
    </>
  )
}
