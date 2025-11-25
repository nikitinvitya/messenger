import { type NextRequest, NextResponse } from 'next/server';
import { AppRoutes } from '@/shared/config/routes';
import { JWT_TOKEN_KEY } from '@/shared/constants/cookie';

export function middleware(req: NextRequest) {
  const token = req.cookies.get(JWT_TOKEN_KEY);
  const { pathname } = req.nextUrl;

  if (token) {
    return NextResponse.next();
  }

  const publicPaths = [AppRoutes.login, AppRoutes.signup];
  const isPublicRoute = publicPaths.some(path => path === pathname);

  if (!isPublicRoute) {
    return NextResponse.redirect(new URL(AppRoutes.login, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}