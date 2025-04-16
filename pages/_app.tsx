import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';

import '../styles/globals.css';
import { LoadingAnimation } from '@/components/loading-animation';

export default function App({ 
  Component, 
  pageProps: {
    session,
    ...pageProps
  }
}: AppProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Handle initial home page load
  useEffect(() => {
    if (router.pathname === '/home') {
      setIsLoading(true);
      const timer = setTimeout(() => {
        if (router.isReady) setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [router.isReady, router.pathname]);

  // Handle client-side navigation to home
  useEffect(() => {
    const handleStart = (url: string) => {
      const targetPath = url.split('?')[0];
      if (targetPath === '/home') {
        setIsLoading(true);
      }
    };
    
    const handleComplete = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router.events]);

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