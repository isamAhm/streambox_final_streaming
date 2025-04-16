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

export default function App({ 
  Component, 
  pageProps: {
    session,
    ...pageProps
  }
}: AppProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [exactPaths] = useState(new Set(['/home', '/auth', '/profiles']));

  // Handle initial page load
  useEffect(() => {
    const isInitialAllowed = exactPaths.has(router.pathname);
    const timer = setTimeout(() => {
      if (router.isReady) setIsLoading(false);
    }, isInitialAllowed ? 2000 : 0);

    return () => clearTimeout(timer);
  }, [router.isReady, router.pathname, exactPaths]);

  // Handle client-side navigation
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const currentPath = router.asPath.split('?')[0];
      const targetPath = url.split('?')[0];
      
      const allowedTargets = ALLOWED_TRANSITIONS.get(currentPath) || [];
      const isValidTransition = allowedTargets.includes(targetPath);
      
      setIsLoading(isValidTransition);
    };

    const handleRouteComplete = () => setIsLoading(false);
    const handleRouteError = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteComplete);
    router.events.on('routeChangeError', handleRouteError);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteComplete);
      router.events.off('routeChangeError', handleRouteError);
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