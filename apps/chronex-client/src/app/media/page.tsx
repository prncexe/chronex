'use client'
import { trpc } from '@/utils/trpc'
import Image from 'next/image'
const page = () => {
  const { data } = trpc.user.getMedia.useQuery()
  return (
    <div>
      {data?.map((m) => (
        <Image key={m.id} src={m.url} alt={m.name} width={500} height={500} />
      ))}
    </div>
  )
}

export default page
