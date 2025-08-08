
import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
    // When deployed to Firebase App Hosting, the service account credentials 
    // will be automatically available in the environment.
    // For local development, you would need to set up a service account key file.
    // (e.g., GOOGLE_APPLICATION_CREDENTIALS environment variable)
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
