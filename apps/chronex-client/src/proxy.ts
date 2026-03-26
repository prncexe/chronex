import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { headers, cookies } from 'next/headers'
import { authClient } from './utils/authClient'
export async function proxy(request: NextRequest) {
  const header = await headers()
  const cookieStore = await cookies()
  const workspaceId = cookieStore.get('workspaceId')?.value
  // if (!workspaceId && request.nextUrl.pathname.startsWith('/tokens')) {
  //   return NextResponse.redirect(new URL('/workspace', request.url))
  // }

  // const session = await authClient.getSession()
  // if (!session && request.nextUrl.pathname.startsWith('/tokens')) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  return NextResponse.next()
}

export const config = {
  matcher: ['/tokens/:path*'],
}
