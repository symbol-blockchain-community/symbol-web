import { NextRequest, NextResponse, userAgent } from 'next/server';

export function middleware(request: NextRequest) {
  const ua = userAgent(request);

  // 毎秒 /news にアクセスしてくるクローラーを弾く
  if (request.nextUrl.pathname === '/news' && request.nextUrl.search) {
    return NextResponse.redirect(new URL('/404', request.url));
  }

  console.info(
    JSON.stringify({
      type: 'access',
      time: new Date().getTime(),
      method: request.method,
      path: request.nextUrl,
      geo: request.geo,
      ua: ua,
    })
  );
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/about',
    '/docs',
    '/docs/:path*',
    '/community',
    '/community/:path*',
    '/news',
    '/news/:path*',
    '/support',
    '/symbol-poll',
    '/404',
    '/events',
    '/server-sitemap.xml',
  ],
};
