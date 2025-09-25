
'use client';

import React, { useContext } from 'react';
import type { User } from '@/lib/types';
import { CurrentUserContext } from './use-current-user-provider';

export function useCurrentUser() {
    const context = useContext(CurrentUserContext);
    if (context === undefined) {
        throw new Error('useCurrentUser must be used within a CurrentUserProvider');
    }
    return context.user;
}
