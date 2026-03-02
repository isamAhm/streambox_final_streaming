import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ClerkProvider } from '@clerk/nextjs';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

import '../styles/globals.css';
import { LoadingAnimation } from '@/components/loading-animation';
import ClerkErrorBoundary from '@/components/ClerkErrorBoundary';
import useDevToolsProtection from '@/hooks/useDevToolsProtection';

const ALLOWED_TRANSITIONS = new Map<string, string[]>([
  ['/home', ['/auth']],
  ['/auth', ['/home', '/profiles', '/sso-callback']],
  ['/sso-callback', ['/profiles']],
]);

export default function App({
  Component,
  pageProps
}: AppProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [exactPaths] = useState(new Set(['/home', '/auth', '/profiles', '/sso-callback']));

  // Enable developer tools protection in production
  useDevToolsProtection();

  // Handle global errors
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;

      // Check if it's a Clerk-related error
      if (
        error?.message?.includes('ClerkJS') ||
        error?.message?.includes('Token refresh failed') ||
        error?.message?.includes('Network error')
      ) {
        event.preventDefault();

        toast.error(
          (t) => (
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-semibold text-white">Session Error</p>
                <p className="text-sm text-gray-300 mt-1">
                  Connection issue detected. Please refresh to continue.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    window.location.reload();
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ),
          {
            duration: 10000,
            style: {
              background: '#18181b',
              border: '1px solid #ef4444',
              maxWidth: '400px',
            },
          }
        );
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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
    <ClerkProvider {...pageProps}>
      <ClerkErrorBoundary>
        <Head>
          <title>StreamBox</title>
        </Head>

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#18181b',
              color: '#fff',
              border: '1px solid #27272a',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {isLoading && <LoadingAnimation />}
        <Component {...pageProps} />
      </ClerkErrorBoundary>
    </ClerkProvider>
  );
}