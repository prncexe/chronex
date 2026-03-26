import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/config/authInstance'

const PUBLIC_ROUTES = ['/', '/login', '/signout']

function matchesAny(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const session = await auth.api.getSession({ headers: request.headers })
  const user = session?.user ?? null
  const workspaceId = request.cookies.get('workspaceId')?.value ?? null

  if (matchesAny(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next()
  }

  if (pathname === '/workspace' || pathname.startsWith('/workspace/')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    return NextResponse.next()
  }

  if (!user) return NextResponse.redirect(new URL('/login', request.url))
  if (!workspaceId) return NextResponse.redirect(new URL('/workspace', request.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
