import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GuestModeContextType {
    isGuestMode: boolean;
    setGuestMode: (isGuest: boolean) => void;
    toggleGuestMode: () => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

interface GuestModeProviderProps {
    children: ReactNode;
}

export const GuestModeProvider: React.FC<GuestModeProviderProps> = ({ children }) => {
    const [isGuestMode, setIsGuestMode] = useState(false);

    // Load guest mode preference from localStorage on mount
    useEffect(() => {
        const savedGuestMode = localStorage.getItem('streambox-guest-mode');
        if (savedGuestMode === 'true') {
            setIsGuestMode(true);
        }
    }, []);

    const setGuestMode = (isGuest: boolean) => {
        setIsGuestMode(isGuest);
        localStorage.setItem('streambox-guest-mode', isGuest.toString());

        // Clear any existing watch history from session storage when entering guest mode
        if (isGuest) {
            sessionStorage.removeItem('guest-continue-watching');
        }
    };

    const toggleGuestMode = () => {
        setGuestMode(!isGuestMode);
    };

    return (
        <GuestModeContext.Provider value={{ isGuestMode, setGuestMode, toggleGuestMode }}>
            {children}
        </GuestModeContext.Provider>
    );
};

export const useGuestMode = () => {
    const context = useContext(GuestModeContext);
    if (context === undefined) {
        throw new Error('useGuestMode must be used within a GuestModeProvider');
    }
    return context;
};