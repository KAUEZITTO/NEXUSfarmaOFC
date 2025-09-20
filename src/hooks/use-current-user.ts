
'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User } from '@/lib/types';
import { usePathname } from 'next/navigation';

type CurrentUserContextType = User | null;

const CurrentUserContext = createContext<CurrentUserContextType>(null);

export function useCurrentUser() {
    const context = useContext(CurrentUserContext);
    return context;
}

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const pathname = usePathname();

    useEffect(() => {
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

    const value = useMemo(() => user, [user]);

    return (
        <CurrentUserContext.Provider value={value}>
            {children}
        </CurrentUserContext.Provider>
    );
};
