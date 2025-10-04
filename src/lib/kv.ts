import { createClient } from '@vercel/kv';

// O Next.js carrega automaticamente as variáveis de ambiente do arquivo .env.local
// em ambientes de desenvolvimento. O pacote `dotenv` não é necessário.

// As variáveis de ambiente para a Vercel são definidas diretamente nas configurações do projeto na Vercel.
// Para desenvolvimento local, elas vêm do .env.local.
export const kv = createClient({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
