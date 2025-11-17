'use client';

import React from 'react';

type Props = {
  children?: React.ReactNode;
};

// Como não estamos mais usando o SessionProvider do next-auth, 
// este componente se torna um simples pass-through.
// Ele é mantido por enquanto para não quebrar a estrutura do layout,
// mas pode ser removido futuramente simplificando o RootLayout.
export default function AuthProvider({ children }: Props) {
  return <>{children}</>;
}
