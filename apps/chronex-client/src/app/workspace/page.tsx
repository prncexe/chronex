
'use client'
import React from 'react'
import { trpc } from '@/utils/trpc'
const page = () => {
    const createWorkspace = trpc.workspace.createWorkspace.useMutation()
  return (
    <div>
        <form onSubmit={async(e:React.FormEvent<HTMLFormElement>)=>{
            e.preventDefault()
            const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value
         const wpdata= await createWorkspace.mutateAsync({name})
            localStorage.setItem('workspaceId',String(wpdata.id))
            window.location.href = '/dashboard'
        }}>
            <input type="text" placeholder='workspace name' name='name'/>
            <button type='submit'>create</button>
        </form>
    </div>
  )
}

export default page