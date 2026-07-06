import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  setPersistence, 
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  memoryLocalCache,
  doc, 
  getDocFromServer, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { telemetry } from './core/monitoring/telemetry';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// تحديد نوع الكاش المناسب بشكل ديناميكي لتفادي أي تعليق أو فشل في الاتصال داخل الـ Iframe نتيجة لقيود المتصفح الأمنية للـ IndexedDB
let localCacheSetting: any;
try {
  const isIframe = typeof window !== 'undefined' && window !== window.top;
  if (isIframe || typeof window === 'undefined' || !window.indexedDB) {
    console.warn("DEBUG: Running inside an iframe or indexedDB is not available. Using memoryLocalCache to prevent Firestore connection timeouts.");
    localCacheSetting = memoryLocalCache();
  } else {
    localCacheSetting = persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    });
  }
} catch (e) {
  console.warn("DEBUG: IndexedDB access is blocked by browser security (e.g. inside sandboxed iframe). Falling back to memoryLocalCache.", e);
  localCacheSetting = memoryLocalCache();
}

// Initialize Firestore with the resilient cache choice
console.log(`DEBUG: Initializing Firestore. Project: ${firebaseConfig.projectId}`);
export const db = initializeFirestore(app, {
  localCache: localCacheSetting,
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export let messaging: any = null;

if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      messaging = getMessaging(app);
    }
  }).catch(() => {
    console.warn("Firebase messaging is not supported in this browser environment.");
  });
}

// تأمين بقاء المستخدم مسجلاً دخوله
setPersistence(auth, browserLocalPersistence);

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// وظائف البريد الإلكتروني
export const registerWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const loginWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const resetPasswordWithEmail = (email: string) => sendPasswordResetEmail(auth, email);

// محاولة تسجيل الدخول عبر الطريقة المثلى (الاعتماد على signInWithPopup أولاً على الويب لتفادي مشاكل الـ Iframe والـ Redirect، ومعالجة ذكية للأجهزة والمتصفحات)
export const signInWithGoogle = async () => {
  const isIframe = typeof window !== 'undefined' && window !== window.top;
  const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();

  console.log(`[Google Auth Debug] البدء في تسجيل الدخول عبر جوجل. (داخل Iframe: ${isIframe}, منصة Capacitor: ${isCapacitor})`);
  
  // في الأجهزة المحمولة عبر كوردوفا/كاباسيتور، يفضل الـ Redirect لعدم دعم النوافذ المنبثقة بشكل جيد
  if (isCapacitor) {
    try {
      console.log("[Google Auth Debug] استخدام Redirect للـ Capacitor");
      return await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("[Google Auth Error] فشل Redirect في Capacitor:", error);
      throw error;
    }
  }

  // في الويب العادي أو الـ Iframe، نفضل الـ Popup بقوة كخيار أول لأنه لا يفرغ حالة التطبيق ولا يصطدم بـ X-Frame-Options الخاص بـ Redirect
  try {
    console.log("[Google Auth Debug] محاولة تسجيل الدخول باستخدام Popup كخيار أول");
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.warn("[Google Auth Warning] فشل تسجيل الدخول بـ Popup، جاري المحاولة بـ Redirect كحل بديل:", error);
    
    // إذا كان الخطأ بسبب حظر النوافذ المنبثقة، أو كنا داخل إطار (Iframe) حيث الـ Redirect قد يفشل، نحاول توضيح ذلك
    if (isIframe) {
      console.error("[Google Auth Error] لا يمكن استخدام Redirect داخل الـ Iframe لتجنب قيود الحماية من قوقل.");
      throw new Error("POPUP_BLOCKED_AND_IFRAME");
    }

    try {
      console.log("[Google Auth Debug] محاولة تسجيل الدخول باستخدام Redirect كحل بديل");
      return await signInWithRedirect(auth, googleProvider);
    } catch (redirectError: any) {
      console.error("[Google Auth Error] فشل تسجيل الدخول باستخدام Redirect البديل أيضاً:", redirectError);
      throw new Error(redirectError?.message || (typeof redirectError === 'string' ? redirectError : 'فشل تسجيل الدخول عبر Google'));
    }
  }
};

export const signInWithFacebook = async () => {
  try {
    return await signInWithPopup(auth, facebookProvider);
  } catch (error: any) {
    console.error("Facebook Auth Error:", error);
    if (window !== window.top) {
      throw new Error("IFRAME_BLOCKED");
    }

    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
    if (isCapacitor) {
      throw new Error("CAPACITOR_BLOCKED");
    }

    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      throw new Error(error?.message || (typeof error === 'string' ? error : 'فشل تسجيل الدخول عبر Facebook'));
    }

    try {
      console.warn("Facebook Popup failed, trying redirect...");
      return await signInWithRedirect(auth, facebookProvider);
    } catch (redirectError: any) {
      console.error("Facebook Redirect Auth Error:", redirectError);
      throw new Error(redirectError?.message || (typeof redirectError === 'string' ? redirectError : 'فشل تسجيل الدخول عبر Facebook'));
    }
  }
};

// معالجة نتيجة تسجيل الدخول بعد العودة من Redirect
export const handleRedirectResult = () => getRedirectResult(auth);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.warn('[Firestore Graceful Recovery] Firestore Error Occurred:', JSON.stringify(errInfo));
  
  // Update quota status in telemetry if it's a quota error
  if (errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
    telemetry.setFirestoreQuotaExceeded(true);
  }

  // Only throw synchronous exceptions for mutative/write operations where callers need to catch/display state.
  // Querying/Snapshot listening (GET/LIST) should fall back cleanly rather than crashing the React cycle.
  if (
    operationType === OperationType.CREATE || 
    operationType === OperationType.UPDATE || 
    operationType === OperationType.DELETE || 
    operationType === OperationType.WRITE
  ) {
    // We are no longer throwing synchronous errors here to prevent React from crashing.
    console.error("Firestore Write Failed:", errInfo.error);
  }
}

// Connection test
async function testConnection() {
  // Disabled force server fetch connection test to prevent network blockages/timeouts in sandboxed environments
}

// FCM Registration
export const registerForPushNotifications = async (userId: string) => {
  if (!messaging) return;

  const vapidKey = (import.meta.env.VITE_FCM_VAPID_KEY as string) || 'BPHr1zPz1...';

  // التحقق من صحة مفتاح VAPID لمنع استدعاء atob بشكل خاطئ في المتصفح إذا كانت القيمة افتراضية أو غير صالحة
  const isValidVapidKey = (key: string): boolean => {
    if (!key || key.includes('...') || key.length < 30) {
      return false;
    }
    try {
      const base64Url = key.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
      const base64 = base64Url + padding;
      window.atob(base64);
      return true;
    } catch (e) {
      return false;
    }
  };

  if (!isValidVapidKey(vapidKey)) {
    console.info('[FCM] لم يتم تهيئة مفتاح VAPID الخاص بالإشعارات بشكل صحيح أو أنه قيمة افتراضية. يرجى تهيئته لتفعيل الإشعارات.');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey });
      
      if (token) {
        // Store or update token in Firestore
        const tokensRef = collection(db, 'fcm_tokens');
        const q = query(tokensRef, where('token', '==', token), where('userId', '==', userId));
        const existing = await getDocs(q);
        
        if (existing.empty) {
          await addDoc(tokensRef, {
            token,
            userId,
            device: navigator.userAgent,
            createdAt: new Date().toISOString()
          });
        }
        return token;
      }
    }
  } catch (error) {
    console.warn('FCM integration is inactive:', error);
  }
};
