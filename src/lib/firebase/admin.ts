
import * as admin from 'firebase-admin';

// This is a robust way to initialize the Firebase Admin SDK in a serverless environment like Vercel.
// It ensures that we don't try to initialize the app more than once.

if (!admin.apps.length) {
    // Check for essential environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error("As variáveis de ambiente do Firebase Admin não estão configuradas corretamente. Verifique seu arquivo .env ou as configurações da Vercel.");
    }

    // The private key from environment variables needs to have its newlines properly formatted.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        console.log("Firebase Admin SDK inicializado com sucesso.");
    } catch (error: any) {
        console.error("Falha Crítica ao Inicializar o Firebase Admin SDK:", error);
        // This will prevent the application from starting if Firebase Admin can't be initialized.
        throw new Error(`Não foi possível inicializar o Firebase Admin: ${error.message}`);
    }
}

// Export the initialized admin app instance.
// Although we export the full 'admin' object, we typically only need its 'auth()' and 'firestore()' methods.
export const adminApp = admin.apps[0];

export const initializeAdminApp = () => {
    if (!admin.apps.length) {
        // This part should technically not be reached if the top-level code runs, but it's a good safeguard.
        const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    }
    return admin.apps[0]!;
}
