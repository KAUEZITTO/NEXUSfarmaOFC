
'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

type Props = {
  children?: React.ReactNode;
};

// Este componente é um "Client Component" que envolve a aplicação,
// provendo o contexto da sessão do NextAuth.js para todos os componentes
// que estão abaixo dele na árvore de componentes.
export default function AuthProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}
