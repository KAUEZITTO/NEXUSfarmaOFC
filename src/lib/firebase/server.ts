// src/lib/firebase/server.ts
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';

// Configuração do Firebase para uso EXCLUSIVO no lado do servidor.
// Esta versão foi modificada para ler as variáveis de ambiente com o prefixo NEXT_PUBLIC_,
// unificando a fonte de configuração e garantindo acesso no ambiente da Vercel.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa o Firebase App para o servidor, garantindo que não seja reinicializado.
// Usamos um nome único 'serverApp' para evitar conflitos com a instância do cliente.
function getFirebaseServerApp(): FirebaseApp {
    const serverAppName = 'firebase-server-app';
    const existingApp = getApps().find(app => app.name === serverAppName);
    if (existingApp) {
        return existingApp;
    }
    return initializeApp(firebaseConfig, serverAppName);
}

export const firebaseServerApp = getFirebaseServerApp();
