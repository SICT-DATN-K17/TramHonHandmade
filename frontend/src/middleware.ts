import { NextResponse } from 'next/server';
import { withAuth, type NextRequestWithAuth } from 'next-auth/middleware';

export default withAuth(
  // `withAuth` augments the `Request` with the user's token.
  function middleware(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;
    // The token is now available from NextAuth
    const token = request.nextauth.token;

    const isAuth = !!token;
    const isArtisan = isAuth && token?.role === 'ARTISAN';

    // Helper function to create a redirect response
    const redirect = (url: string) => {
      const newUrl = new URL(url, request.url);
      // Add callbackUrl for a better login experience
      if (url === '/login' && pathname !== '/login') {
        newUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      }
      return NextResponse.redirect(newUrl);
    };

    // --- Artisan-specific Logic ---
    if (isArtisan) {
      // Artisans can only access their dashboard pages.
      if (pathname.startsWith('/artisan')) {
        return NextResponse.next();
      }
      // For any other client-only page (cart, checkout, account, /chat etc.), redirect them to the artisan dashboard.
      return redirect('/artisan');
    }

    // --- Guest & Regular User Logic ---

    // Rule 1: Protect artisan pages from non-artisans.
    if (pathname.startsWith('/artisan')) {
      // If a non-artisan (authenticated or not) tries to access an artisan page, send them to login.
      return redirect('/login');
    }

    // Rule 2: Protect user-specific pages that require login for non-artisans.
    const userProtectedPaths = [
      '/account',
      '/cart',
      '/checkout',
      '/custom-request',
      '/chat',
      '/orders',
    ];

    if (userProtectedPaths.some((path) => pathname.startsWith(path))) {
      if (!isAuth) {
        // If a guest tries to access a protected page, redirect to login.
        return redirect('/login');
      }
    }

    // Rule 3: Handle authenticated non-artisans on auth pages.
    if (isAuth) {
      // If a logged-in user is on the login/signup page, redirect to the homepage.
      if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
        return redirect('/');
      }
    }

    // Rule 4: Allow all other requests.
    // This covers guests on public pages (like '/', '/shop/*')
    // and authenticated users on public or their own protected pages.
    return NextResponse.next();
  },
  {
    callbacks: {
      // Return `true` to always run the middleware function.
      // The logic inside the middleware function will handle authorization.
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    // Chạy middleware trên tất cả các đường dẫn ngoại trừ các file tĩnh và API
    '/((?!api|_next/static|_next/image|favicon.ico|tramhon-logo.png).*)',
  ],
};