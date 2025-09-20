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
    }, [pathname]);

    return (
        <CurrentUserContext.Provider value={user}>
            {children}
        </CurrentUserContext.Provider>
    );
};
