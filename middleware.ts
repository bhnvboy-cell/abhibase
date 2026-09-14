import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'abhi_session'

export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value)
  const path = request.nextUrl.pathname

  if (!hasSession && path.startsWith('/dashboard')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/sign-in'
    return NextResponse.redirect(redirectUrl)
  }

  if (hasSession && path === '/') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
