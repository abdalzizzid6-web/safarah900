import { initializeApp as initializeAdminApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import dotenv from 'dotenv';
dotenv.config();

console.log(`[DIAGNOSTIC-LOG] [Module Loading] [firebase-admin.ts] Loading module. FIREBASE_SERVICE_ACCOUNT_KEY exists: ${!!process.env.FIREBASE_SERVICE_ACCOUNT_KEY}`);

let adminApp: any;
export let firestore: any;
export let messaging: any;
export let auth: any;
export let isFirebaseAdminReady = false;
export { FieldValue };

const initFirebaseAdmin = () => {
    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        console.log(`[DIAGNOSTIC-LOG] [firebase-admin.ts] Initializing Firebase Admin...`);
        if (serviceAccountKey) {
            console.log(`[DIAGNOSTIC-LOG] [firebase-admin.ts] serviceAccountKey found. Parsing and initializing with cert...`);
            const serviceAccount = JSON.parse(serviceAccountKey);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            adminApp = getApps().length === 0 ? initializeAdminApp({
                credential: cert(serviceAccount),
                projectId: firebaseConfig.projectId
            }) : getApps()[0];
            const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
            console.log(`[DIAGNOSTIC-LOG] [firebase-admin.ts] App initialized. Fetching Firestore databaseId: ${databaseId}`);
            firestore = getAdminFirestore(adminApp, databaseId);
            firestore.settings({ ignoreUndefinedProperties: true });
            messaging = getMessaging(adminApp);
            auth = getAuth(adminApp);
            isFirebaseAdminReady = true;
            console.log(`[DIAGNOSTIC-LOG] [firebase-admin.ts] [SUCCESS] Firebase Admin initialized with service account.`);
        } else {
            console.warn(`[DIAGNOSTIC-LOG] [firebase-admin.ts] [WARNING] FIREBASE_SERVICE_ACCOUNT_KEY is missing. Falling back to ambient credentials.`);
            adminApp = getApps().length === 0 ? initializeAdminApp({ projectId: firebaseConfig.projectId }) : getApps()[0];
            const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
            console.log(`[DIAGNOSTIC-LOG] [firebase-admin.ts] Fetching Firestore databaseId: ${databaseId}`);
            firestore = getAdminFirestore(adminApp, databaseId);
            firestore.settings({ ignoreUndefinedProperties: true });
            messaging = getMessaging(adminApp);
            auth = getAuth(adminApp);
            isFirebaseAdminReady = true;
            console.log(`[DIAGNOSTIC-LOG] [firebase-admin.ts] [SUCCESS] Firebase Admin initialized with ambient fallback.`);
        }
    } catch (e: any) {
        console.error(`[DIAGNOSTIC-LOG] [firebase-admin.ts] [CRITICAL-ERROR] Failed to initialize Firebase Admin during module loading. Details:`, {
            error: e.message,
            stack: e.stack,
            projectId: firebaseConfig.projectId,
            hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        });
        isFirebaseAdminReady = false;
    }
};
initFirebaseAdmin();
