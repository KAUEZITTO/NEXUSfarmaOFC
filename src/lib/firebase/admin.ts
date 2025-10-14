
import * as admin from 'firebase-admin';

// Esta abordagem é a mais robusta para ambientes serverless como a Vercel.
// As credenciais são armazenadas como uma única string Base64.
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

/**
 * Garante que o Firebase Admin SDK seja inicializado de forma segura,
 * evitando inicializações duplicadas que são comuns em ambientes serverless.
 */
function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    if (!serviceAccountBase64) {
        throw new Error('A variável de ambiente FIREBASE_SERVICE_ACCOUNT_BASE64 não está definida. Esta é necessária para a inicialização do Firebase Admin.');
    }

    try {
        const decodedServiceAccount = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(decodedServiceAccount);

        // Verificação de sanidade nas credenciais decodificadas
        if (!serviceAccount.projectId || !serviceAccount.client_email || !serviceAccount.private_key) {
            throw new Error("As credenciais do Firebase decodificadas estão incompletas. Verifique o conteúdo da variável FIREBASE_SERVICE_ACCOUNT_BASE64.");
        }

        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

    } catch (error: any) {
        console.error("Falha Crítica ao Inicializar o Firebase Admin SDK:", error.message);
        // Lança o erro para interromper o processo se a inicialização falhar.
        throw new Error(`Não foi possível inicializar o Firebase Admin. Causa: ${error.message}`);
    }
}

// Inicializa a aplicação uma vez e exporta os serviços necessários.
const adminApp = initializeAdminApp();

export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore(); // Se você usar Firestore

