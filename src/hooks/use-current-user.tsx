
'use client';

// This file is now deprecated and its content has been moved to use-current-user-provider.tsx.
// It is kept temporarily to avoid breaking imports, but should be removed in a future cleanup.
// Please update imports from '@/hooks/use-current-user' to '@/hooks/use-current-user-provider'.

import { useContext } from 'react';
import { CurrentUserContext } from './use-current-user-provider';

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  return context.user;
}
