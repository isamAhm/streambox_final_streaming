import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useClerk } from '@clerk/nextjs';
import { LoadingAnimation } from '@/components/loading-animation';

export default function SSOCallback() {
    const router = useRouter();
    const { handleRedirectCallback } = useClerk();

    useEffect(() => {
        async function handleCallback() {
            try {
                // handleRedirectCallback expects the URL or search params
                await handleRedirectCallback({
                    redirectUrl: '/profiles',
                });
                router.push('/profiles');
            } catch (error) {
                console.error('SSO callback error:', error);
                router.push('/auth');
            }
        }

        // Only run if we have the necessary query params
        if (router.isReady) {
            handleCallback();
        }
    }, [handleRedirectCallback, router]);

    return <LoadingAnimation />;
}
