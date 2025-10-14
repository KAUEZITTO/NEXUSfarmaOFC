
import * as admin from 'firebase-admin';

// Esta abordagem é a mais robusta para ambientes serverless como a Vercel.
// As credenciais são armazenadas como uma única string Base64.
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

let serviceAccount: admin.ServiceAccount;

if (serviceAccountBase64) {
    try {
        const decodedServiceAccount = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decodedServiceAccount);
    } catch (error) {
        console.error("Falha Crítica ao decodificar as credenciais do Firebase Admin:", error);
        throw new Error("As credenciais do Firebase (FIREBASE_SERVICE_ACCOUNT_BASE64) estão mal formatadas.");
    }
} else {
    // Fallback para o build local ou ambientes que não usam Base64
    console.warn("Atenção: FIREBASE_SERVICE_ACCOUNT_BASE64 não definida. Tentando usar variáveis de ambiente individuais. Isso não é recomendado para produção.");
    serviceAccount = {
        type: process.env.FIREBASE_ADMIN_TYPE,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
        auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
        token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
    } as admin.ServiceAccount;
}


/**
 * Garante que o Firebase Admin SDK seja inicializado de forma segura,
 * evitando inicializações duplicadas que são comuns em ambientes serverless.
 */
function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }
    
    // Verifica se as credenciais mínimas existem
    if (!serviceAccount || !serviceAccount.projectId || !serviceAccount.client_email || !serviceAccount.private_key) {
         throw new Error("Não foi possível inicializar o Firebase Admin. As credenciais do serviço estão incompletas ou ausentes.");
    }

    try {
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error("Falha Crítica ao Inicializar o Firebase Admin SDK:", error);
        // Este erro será lançado e capturado durante o build ou na execução da função serverless.
        throw new Error("Não foi possível inicializar o Firebase Admin. Verifique as credenciais do serviço.");
    }
}

// Inicializa a aplicação uma vez e exporta os serviços necessários.
const adminApp = initializeAdminApp();

export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore(); // Se você usar Firestore
