
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { usePathname } from 'next/navigation';

const CurrentUserContext = createContext<User | null>(null);

export function useCurrentUser() {
    return useContext(CurrentUserContext);
}

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // This fetch will be intercepted by the middleware which checks the cookie.
                // If valid, the API route will then provide the user data.
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

        // We fetch the user on initial load and whenever the path changes.
        // This keeps the user session fresh across navigations.
        fetchUser();
    }, [pathname]);

    return (
        <CurrentUserContext.Provider value={user}>
            {children}
        </CurrentUserContext.Provider>
    );
};

    