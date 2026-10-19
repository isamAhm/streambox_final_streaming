import { authMiddleware } from '@clerk/nextjs/server';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/home',
    '/auth',
    '/sso-callback',
    '/profiles',
    '/movies',
    '/series',
    '/search',
    '/anime',
    '/anime/(.*)',
    '/live-sports',
    '/live-tv',
    '/collections',
    '/title/(.*)',
    '/watch/(.*)',
    '/api/webhooks/(.*)',
    '/api/anime/embed',
    '/api/anime/megacloud-proxy',
    '/api/anime/stream',
    '/api/anime/info/(.*)',
    '/api/anime/tmdb-info/(.*)',
    '/api/anime/browse',
    '/api/anime/episodes/(.*)',
    '/api/anime/home',
    '/api/anime/schedule',
    '/api/movies/(.*)',
    '/api/random',
  ],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
