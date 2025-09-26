
'use client';

import React, { createContext, useContext } from 'react';
import type { User } from '@/lib/types';

// Use a more descriptive name for the context value
type CurrentUserContextType = {
  user: User | null;
};

// Provide a default value matching the type, or undefined if you plan to check for it.
export const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

export function CurrentUserProvider({ user, children }: { user: User | null; children: React.ReactNode }) {
  // Memoize the context value to prevent unnecessary re-renders of consumers
  const value = React.useMemo(() => ({ user }), [user]);
  
  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

// Consolidate the hook into the same file for better organization
export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  return context.user;
}
