import { initializeApp as initializeAdminApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import dotenv from 'dotenv';
dotenv.config();

let adminApp: any;
export let firestore: any;
export let messaging: any;
export let auth: any;
export let isFirebaseAdminReady = false;
export { FieldValue };

const initFirebaseAdmin = () => {
    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (serviceAccountKey) {
            const serviceAccount = JSON.parse(serviceAccountKey);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            adminApp = getApps().length === 0 ? initializeAdminApp({
                credential: cert(serviceAccount),
                projectId: firebaseConfig.projectId
            }) : getApps()[0];
            const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
            firestore = getAdminFirestore(adminApp, databaseId);
            firestore.settings({ ignoreUndefinedProperties: true });
            messaging = getMessaging(adminApp);
            auth = getAuth(adminApp);
            isFirebaseAdminReady = true;
            console.log(`[SUCCESS] Firebase Admin (Backend) Initialized with Service Account Key.`);
        } else {
            console.warn(`[WARNING] FIREBASE_SERVICE_ACCOUNT_KEY is missing. Falling back to ambient credentials.`);
            adminApp = getApps().length === 0 ? initializeAdminApp({ projectId: firebaseConfig.projectId }) : getApps()[0];
            const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
            firestore = getAdminFirestore(adminApp, databaseId);
            firestore.settings({ ignoreUndefinedProperties: true });
            messaging = getMessaging(adminApp);
            auth = getAuth(adminApp);
            isFirebaseAdminReady = true;
        }
    } catch (e) {
        console.error("Failed to initialize Firebase Admin", e);
        isFirebaseAdminReady = false;
    }
};
initFirebaseAdmin();
