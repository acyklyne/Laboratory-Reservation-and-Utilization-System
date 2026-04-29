import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't need auth
  const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register'];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(request);
  const user = token ? verifyToken(token) : null;

  // Not authenticated
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check admin routes
  if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
