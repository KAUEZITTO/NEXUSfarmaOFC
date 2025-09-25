'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { getCurrentUserAction } from '@/lib/actions';

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
                // Call the Server Action directly to get the current user.
                const userData = await getCurrentUserAction();
                setUser(userData);
            } catch (error) {
                console.error("Failed to fetch user data via action", error);
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
