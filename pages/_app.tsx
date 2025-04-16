import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';

import '../styles/globals.css';
import { LoadingAnimation } from '@/components/loading-animation';

const LOADING_ROUTES = ['/home', '/auth', '/profile'];

export default function App({ 
  Component, 
  pageProps: {
    session,
    ...pageProps
  }
}: AppProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Handle initial page load
  useEffect(() => {
    const isAllowedRoute = LOADING_ROUTES.includes(router.pathname);
    const timer = setTimeout(() => {
      if (router.isReady) {
        setIsLoading(false);
      }
    }, isAllowedRoute ? 2000 : 0); // Only delay for allowed routes

    return () => clearTimeout(timer);
  }, [router.isReady, router.pathname]);

  // Handle client-side navigation
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const currentPath = router.asPath.split('?')[0];
      const targetPath = url.split('?')[0];
      
      const shouldShowLoading = 
        LOADING_ROUTES.includes(currentPath) || 
        LOADING_ROUTES.includes(targetPath);

      if (shouldShowLoading) setIsLoading(true);
    };

    const handleRouteComplete = () => setIsLoading(false);

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