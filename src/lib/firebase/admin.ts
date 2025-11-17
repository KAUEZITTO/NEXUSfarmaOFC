
import * as admin from 'firebase-admin';

// Esta é a forma robusta de inicializar o Firebase Admin SDK em um ambiente serverless como a Vercel.
// Garante que não tentamos inicializar o app mais de uma vez por instância.

let adminApp: admin.app.App;

function initializeAdminApp(): admin.app.App {
    // Se já existe uma instância inicializada, a reutilizamos imediatamente.
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    // Verifica se as variáveis de ambiente essenciais estão presentes antes de tentar inicializar.
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error("As variáveis de ambiente do Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não estão configuradas corretamente.");
    }

    // A chave privada vinda das variáveis de ambiente da Vercel precisa ter suas quebras de linha `\n` restauradas.
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
        // Lançar um erro aqui é crucial para que o problema de configuração seja evidente nos logs.
        throw new Error(`Não foi possível inicializar o Firebase Admin: ${error.message}`);
    }
}

// Exporta uma função "getter" que sempre retorna a instância única (singleton) do app admin.
export const getAdminApp = (): admin.app.App => {
    // Se a variável global `adminApp` ainda não foi definida, chama a função de inicialização.
    if (!adminApp) {
        adminApp = initializeAdminApp();
    }
    // Retorna a instância, seja a que acabamos de criar ou a que já existia.
    return adminApp;
};
