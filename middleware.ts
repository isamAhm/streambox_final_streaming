import { authMiddleware } from '@clerk/nextjs/server';

export default authMiddleware({
  publicRoutes: [
    '/home',
    '/auth',
    '/sso-callback',
    '/api/webhooks/(.*)',
    '/api/anime/embed',
    '/api/anime/megacloud-proxy',
    '/api/anime/stream',
    '/api/anime/info/(.*)',
    '/api/anime/tmdb-info/(.*)',
    '/api/anime/browse',
    '/api/anime/episodes/(.*)',
  ],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
