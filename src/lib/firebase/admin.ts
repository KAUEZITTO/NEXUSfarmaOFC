
import * as admin from 'firebase-admin';

// Esta é a forma robusta de inicializar o Firebase Admin SDK em um ambiente serverless como a Vercel.
// Garante que não tentamos inicializar o app mais de uma vez por instância.

let adminApp: admin.app.App;

function initializeAdminApp(): admin.app.App {
    if (admin.apps.length > 0) {
        // Se já existe uma instância, a reutilizamos.
        return admin.apps[0]!;
    }

    // Verifica se as variáveis de ambiente essenciais estão presentes.
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error("As variáveis de ambiente do Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não estão configuradas corretamente.");
    }

    // A chave privada das variáveis de ambiente precisa ter suas quebras de linha formatadas corretamente.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    try {
        const newAdminApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        console.log("Firebase Admin SDK inicializado com sucesso.");
        return newAdminApp;
    } catch (error: any) {
        console.error("Falha Crítica ao Inicializar o Firebase Admin SDK:", error);
        throw new Error(`Não foi possível inicializar o Firebase Admin: ${error.message}`);
    }
}

// Exporta uma função que sempre retorna a instância inicializada.
export const getAdminApp = (): admin.app.App => {
    // Se a `adminApp` ainda não foi definida, inicializa-a.
    if (!adminApp) {
        adminApp = initializeAdminApp();
    }
    return adminApp;
};
