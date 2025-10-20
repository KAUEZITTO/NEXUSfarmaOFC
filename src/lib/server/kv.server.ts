
import { createClient } from '@vercel/kv';

// As variáveis de ambiente para a Vercel são definidas diretamente nas configurações do projeto na Vercel.
// Para desenvolvimento local, elas vêm do .env.local.
// Esta configuração é segura pois este arquivo só será executado no servidor.
// As variáveis `KV_URL`, `KV_REST_API_URL` e `KV_REST_API_TOKEN` são usadas.
export const kv = createClient({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
