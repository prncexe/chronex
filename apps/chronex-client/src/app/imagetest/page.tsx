import Image from 'next/image'
import React from 'react'
const page = () => {
  return (
    <div>
      <Image src="/logo.png" alt="Logo" width={50} height={50} />
    </div>
  )
}

export default page
