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

// Inicializa o Admin SDK apenas se ainda não foi inicializado.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK inicializado com sucesso.');
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin SDK:', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
