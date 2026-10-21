import { useEffect, useState } from 'react';

/**
 * Hook to detect if the app is running in Capacitor (mobile app)
 */
export const useIsMobileApp = () => {
    const [isMobileApp, setIsMobileApp] = useState(false);

    useEffect(() => {
        // Check if Capacitor is available (running in mobile app)
        const checkCapacitor = async () => {
            try {
                // @ts-ignore - Capacitor is injected by native app
                if (typeof window !== 'undefined' && window.Capacitor) {
                    setIsMobileApp(true);
                }
            } catch (error) {
                setIsMobileApp(false);
            }
        };

        checkCapacitor();
    }, []);

    return isMobileApp;
};

/**
 * Check if running in mobile app (synchronous)
 */
export const isMobileApp = (): boolean => {
    if (typeof window === 'undefined') return false;
    // @ts-ignore
    return !!(window.Capacitor);
};
