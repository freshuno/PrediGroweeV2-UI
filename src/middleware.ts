import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const checkSession = async (sessionId: string, requestURL: string, adminRequired: boolean) => {
  try {
    const response = await fetch(process.env.AUTH_SERVICE_INTERNAL_URL + '/verifySession', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session_id=${sessionId}`,
      },
    });
    if (!response.ok) {
      return NextResponse.redirect(new URL('/login', requestURL));
    }
    if (requestURL === '/login' || requestURL === '/register') {
      return NextResponse.redirect(new URL('/quiz', requestURL));
    }
    const data = await response.json();

    if (adminRequired && data.role !== 'admin' && data.role !== 'teacher') {
      return NextResponse.redirect(new URL('/login', requestURL));
    }
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL('/login', requestURL));
  }
  return NextResponse.next();
};

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/quiz/')) {
    return NextResponse.next();
  }
  const sessionId = request.cookies.get('session_id')?.value;

  // Define which paths require authentication
  const authRequiredPaths = ['/quiz', '/account', '/quiz', '/statistics'];
  const adminPaths = ['/admin'];
  const apiPaths = ['/api/'];
  if (
    !authRequiredPaths.some((path) => request.nextUrl.pathname.startsWith(path)) &&
    !adminPaths.some((path) => request.nextUrl.pathname.startsWith(path)) &&
    !apiPaths.some((path) => request.nextUrl.pathname.startsWith(path))
  ) {
    return NextResponse.next();
  }
  if (
    apiPaths.some((path) => request.nextUrl.pathname.startsWith(path)) &&
    request.method === 'GET'
  ) {
    return NextResponse.next();
  }
  if (
    apiPaths.some((path) => request.nextUrl.pathname.startsWith(path)) &&
    request.method === 'POST' &&
    !sessionId
  ) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!sessionId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return await checkSession(
    sessionId,
    request.url,
    adminPaths.some((path) => request.nextUrl.pathname.startsWith(path))
  );
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
