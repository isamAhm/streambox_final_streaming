import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';

import '../styles/globals.css';
import { LoadingAnimation } from '@/components/loading-animation';

const ALLOWED_TRANSITIONS = new Map<string, string[]>([
  ['/home', ['/auth']],
  ['/auth', ['/home', '/profiles']],
]);

const BLOCKED_ROUTES = new Set(['/', '/profiles', '']); // Add empty string for root

export default function App({ 
  Component, 
  pageProps: {
    session,
    ...pageProps
  }
}: AppProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Normalize path helper
  const normalizePath = (path: string) => {
    if (path === '') return '/';
    if (!path.startsWith('/')) return `/${path}`;
    return path;
  };

  // Handle initial page load
  useEffect(() => {
    const path = normalizePath(router.pathname);
    const isInitialAllowed = !BLOCKED_ROUTES.has(path) && 
                           (path === '/home' || path === '/auth');
    
    const timer = setTimeout(() => {
      if (router.isReady) setIsLoading(false);
    }, isInitialAllowed ? 2000 : 0);

    return () => clearTimeout(timer);
  }, [router.isReady, router.pathname]);

  // Handle client-side navigation
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const currentPath = normalizePath(router.asPath.split('?')[0]);
      const targetPath = normalizePath(url.split('?')[0]);
      
      // Immediate block for these cases
      if (BLOCKED_ROUTES.has(targetPath) || currentPath === '/profiles') {
        return setIsLoading(false);
      }

      const allowedTargets = ALLOWED_TRANSITIONS.get(currentPath) || [];
      const isValidTransition = allowedTargets.includes(targetPath);
      
      setIsLoading(isValidTransition);
    };

    const handleRouteComplete = () => setIsLoading(false);
    const handleRouteError = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteComplete);
    router.events.on('routeChangeError', handleRouteComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteComplete);
      router.events.off('routeChangeError', handleRouteComplete);
    };
  }, [router.asPath, router.events]);

  return (
    <SessionProvider session={session}>
      <Head>
        <title>StreamBox</title>
      </Head>
      
      {isLoading && <LoadingAnimation />}
      <Component {...pageProps} />
    </SessionProvider>
  );
}