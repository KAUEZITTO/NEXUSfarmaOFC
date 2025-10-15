
// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Configuração segura para o lado do cliente (navegador).
// Apenas variáveis com o prefixo NEXT_PUBLIC_ são expostas aqui.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa o Firebase App e o Auth de forma segura, apenas se a chave da API estiver presente.
let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;

if (firebaseConfig.apiKey) {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }
  auth = getAuth(firebaseApp);
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.warn("As variáveis de ambiente do Firebase não estão configuradas. A autenticação não funcionará. Adicione suas credenciais Firebase ao arquivo .env");
  }
}

export { firebaseApp, auth };
