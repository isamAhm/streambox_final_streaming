import { authMiddleware } from '@clerk/nextjs/server';

export default authMiddleware({
  publicRoutes: ['/home', '/auth', '/sso-callback', '/api/webhooks/(.*)'],
  afterAuth(auth, req) {
    // If user is on root path
    if (req.nextUrl.pathname === '/') {
      // If authenticated, allow access to main app
      if (auth.userId) {
        return;
      }
      // If not authenticated, redirect to home landing page
      const homeUrl = new URL('/home', req.url);
      return Response.redirect(homeUrl);
    }
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};



