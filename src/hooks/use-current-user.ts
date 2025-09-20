
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { usePathname } from 'next/navigation';

const CurrentUserContext = createContext<User | null>(null);

export const useCurrentUser = () => {
    return useContext(CurrentUserContext);
}

export const CurrentUserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        // Function to fetch user data from a client-side endpoint
        // This avoids exposing the raw header logic to every component
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/user');
                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
                setUser(null);
            }
        };

        fetchUser();
    }, [pathname]); // Refetch on path change to ensure data is fresh

    return (
        <CurrentUserContext.Provider value={user}>
            {children}
        </CurrentUserContext.Provider>
    );
};
