
'use client';

import React, { createContext } from 'react';
import type { User } from '@/lib/types';

export const CurrentUserContext = createContext<{ user: User | null } | undefined>(undefined);

export function CurrentUserProvider({ user, children }: { user: User | null, children: React.ReactNode }) {
    return (
        <CurrentUserContext.Provider value={{ user }}>
            {children}
        </CurrentUserContext.Provider>
    );
};
