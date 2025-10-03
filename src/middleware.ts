
// A maneira mais simples e recomendada de proteger rotas com NextAuth.js
// é usar o middleware "withAuth". Ele cuidará automaticamente da verificação
// do token JWT no cookie e redirecionará usuários não autenticados.
// Documentação: https://next-auth.js.org/configuration/nextjs#middleware

export { default } from "next-auth/middleware";

// O objeto `config` especifica quais rotas devem ser protegidas pelo middleware.
// O matcher abaixo protege todas as rotas aninhadas sob /dashboard.
export const config = { 
  matcher: [
    "/dashboard/:path*",
  ] 
};
