// src/lib/firebase/server.ts
import { initializeApp, getApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';

// Configuração segura para o lado do servidor (Server Actions, API Routes).
// Lê variáveis de ambiente sem o prefixo NEXT_PUBLIC_, que não são expostas ao cliente.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Inicializa o Firebase App para o servidor, garantindo uma única instância.
function getFirebaseServerApp(): FirebaseApp {
  // Damos um nome único à instância do servidor para evitar conflitos com a do cliente.
  const serverAppName = 'firebase-server-app-nexus';
  const existingApp = getApps().find(app => app.name === serverAppName);

  if (existingApp) {
    return existingApp;
  }
  
  return initializeApp(firebaseConfig, serverAppName);
}

export const firebaseServerApp = getFirebaseServerApp();
