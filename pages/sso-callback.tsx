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
                await handleRedirectCallback();
                router.push('/profiles');
            } catch (error) {
                console.error('SSO callback error:', error);
                router.push('/auth');
            }
        }

        handleCallback();
    }, [handleRedirectCallback, router]);

    return <LoadingAnimation />;
}
