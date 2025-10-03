import { createClient } from '@vercel/kv';

// As variáveis de ambiente para a Vercel são definidas diretamente nas configurações do projeto na Vercel.
// Não é necessário usar `process.env` em `dotenv` aqui para produção.
// Este arquivo centraliza a criação do cliente KV.
export const kv = createClient({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
