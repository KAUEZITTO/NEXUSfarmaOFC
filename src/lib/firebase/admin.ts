
// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';

// Variáveis de ambiente para o Admin SDK, lidas do Vercel Environment Variables
const serviceAccount = {
  type: process.env.FIREBASE_ADMIN_TYPE,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
  // O `private_key` vem com caracteres de nova linha literais (\n) do Vercel.
  // Precisamos substituí-los pelo caractere de nova linha real.
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
  auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
  token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
} as admin.ServiceAccount;


/**
 * Garante que o Firebase Admin SDK seja inicializado de forma segura,
 * evitando inicializações duplicadas em ambientes serverless.
 * @returns A instância do aplicativo Firebase Admin.
 */
function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    try {
        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK inicializado com sucesso.');
        return app;
    } catch (error) {
        console.error('Erro crítico ao inicializar Firebase Admin SDK:', error);
        // Lançar o erro pode ajudar a diagnosticar problemas de configuração.
        // Em produção, você pode querer lidar com isso de forma diferente.
        throw new Error('Falha na inicialização do Firebase Admin. Verifique as credenciais.');
    }
}

// Inicializa a aplicação
const adminApp = initializeAdminApp();

// Exporta a instância de autenticação do app inicializado
export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore();
