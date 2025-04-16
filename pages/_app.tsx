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
  const [isLoading, setIsLoading] = useState(true);

  // Handle initial page load with delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (router.isReady) {
        setIsLoading(false);
      }
    }, 2000); // Adjust this number (milliseconds)

    return () => clearTimeout(timer);
  }, [router.isReady]);

  // Handle client-side navigation (keep this as before)
  useEffect(() => {
    const handleStart = (url: string) => {
      if (url !== router.asPath) setIsLoading(true);
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