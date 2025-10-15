// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

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

// Inicializa o Firebase App para o cliente, garantindo que não seja reinicializado (Singleton pattern).
// A inicialização só ocorre se a chave da API estiver presente.
let firebaseApp: FirebaseApp;
if (firebaseConfig.apiKey) {
    firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} else {
    // Se não houver chave, o app não é inicializado, mas evitamos o crash.
    // Funções que dependem do 'auth' não funcionarão, o que é esperado.
    if (process.env.NODE_ENV !== 'production') {
        console.warn("As variáveis de ambiente do Firebase não estão configuradas. A autenticação não funcionará. Adicione suas credenciais Firebase ao arquivo .env");
    }
    // @ts-ignore - Atribuímos undefined para garantir que o 'auth' também não seja inicializado.
    firebaseApp = undefined;
}


// Exporta 'auth' apenas se a inicialização foi bem-sucedida.
const auth: Auth | {} = firebaseApp ? getAuth(firebaseApp) : {};

export { firebaseApp, auth };
