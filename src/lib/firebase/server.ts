// src/lib/firebase/server.ts
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';

// Configuração do Firebase para uso EXCLUSIVO no lado do servidor.
// Lê as variáveis de ambiente sem o prefixo NEXT_PUBLIC_.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Inicializa o Firebase App para o servidor, garantindo que não seja reinicializado.
function getFirebaseServerApp(): FirebaseApp {
    if (getApps().length > 0) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

export const firebaseServerApp = getFirebaseServerApp();
