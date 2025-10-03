
'use client';

// Este hook não é mais necessário com NextAuth.js.
// A sessão do usuário pode ser acessada globalmente através do SessionProvider
// e do hook `useSession` de `next-auth/react`.
// Manter este arquivo vazio ou removê-lo é recomendado para evitar confusão.

import React, { createContext, useContext } from 'react';
import type { User } from '@/lib/types';

// A tipagem do usuário virá agora da sessão do NextAuth.
// Esta implementação é mantida para compatibilidade, mas o ideal é refatorar
// para usar `useSession` diretamente.
type CurrentUserContextType = {
  user: User | null;
};

export const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

export function CurrentUserProvider({ user, children }: { user: User | null; children: React.ReactNode }) {
  const value = React.useMemo(() => ({ user }), [user]);
  
  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (context === undefined) {
    // Retorna null em vez de lançar um erro, pois o usuário pode não estar logado
    // e o `useSession` do NextAuth lida com esse estado.
    return null;
  }
  return context.user;
}
