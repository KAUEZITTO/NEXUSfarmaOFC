
import * as admin from 'firebase-admin';

// Esta abordagem garante que você não exponha chaves secretas no lado do cliente.
const serviceAccount = {
  type: process.env.FIREBASE_ADMIN_TYPE,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
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
 * evitando inicializações duplicadas que são comuns em ambientes serverless.
 */
function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }
    
    try {
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error("Falha Crítica ao Inicializar o Firebase Admin SDK:", error);
        // Este erro será lançado e capturado durante o build ou na execução da função serverless.
        throw new Error("Não foi possível inicializar o Firebase Admin. Verifique as credenciais do serviço.");
    }
}

// Inicializa a aplicação uma vez e exporta os serviços necessários.
const adminApp = initializeAdminApp();

export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore(); // Se você usar Firestore
