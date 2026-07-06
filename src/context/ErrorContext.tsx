import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, XCircle, X } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

type ToastType = 'error' | 'success' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ErrorContextType {
  showToast: (message: string, type?: ToastType) => void;
  showError: (error: any) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

function classifyError(error: any): string {
  const errStr = typeof error === 'string' ? error : (error?.message || String(error || ''));
  const errLower = errStr.toLowerCase();
  
  if (
    errLower.includes('quota') || 
    errLower.includes('resource_exhausted') || 
    errLower.includes('exhausted') || 
    errLower.includes('resource-exhausted') || 
    errLower.includes('958469007898') ||
    errLower.includes('429')
  ) {
    return 'تجاوز الحصة (Quota Limit)';
  }
  if (
    errLower.includes('firestore') || 
    errLower.includes('permission-denied') || 
    errLower.includes('permission_denied') || 
    errLower.includes('insufficient permissions') ||
    errLower.includes('security-error')
  ) {
    return 'قاعدة البيانات (Database)';
  }
  if (
    errLower.includes('api') || 
    errLower.includes('footballapi') || 
    errLower.includes('rapidapi') || 
    errLower.includes('status: 403') || 
    errLower.includes('footballapistatus') ||
    errLower.includes('fetch') && errLower.includes('api')
  ) {
    return 'مزامنة الـ API (API)';
  }
  if (
    errLower.includes('auth') || 
    errLower.includes('unauthorized') || 
    errLower.includes('user-not-found') || 
    errLower.includes('wrong-password') || 
    errLower.includes('401') ||
    errLower.includes('token-expired')
  ) {
    return 'المصادقة والصلاحيات (Auth)';
  }
  if (
    errLower.includes('network') || 
    errLower.includes('fetch') || 
    errLower.includes('connect') || 
    errLower.includes('offline') || 
    errLower.includes('network-request-failed') ||
    errLower.includes('dns')
  ) {
    return 'الشبكة والاتصال (Network)';
  }
  if (
    errLower.includes('undefined') || 
    errLower.includes('null') || 
    errLower.includes('is not a function') || 
    errLower.includes('cannot read property') ||
    errLower.includes('syntaxerror') ||
    errLower.includes('referenceerror')
  ) {
    return 'أخطاء التشغيل (JS Runtime)';
  }
  return 'أخرى (Other)';
}

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const showError = useCallback((error: any) => {
    const errStr = typeof error === 'string' ? error : (error?.message || '');
    const isQuota = errStr.includes('Quota') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('resource-exhausted') || errStr.includes('958469007898') || errStr.includes('Quota limit exceeded');
    const isConnectionErr = errStr.includes('network') || errStr.includes('fetch') || errStr.includes('connect') || errStr.includes('firestore') || errStr.includes('Failed to get live matches') || errStr.includes('Failed to get fixtures');

    // 1. Log to server console
    console.error("[System Core Error Interceptor]:", error);

    // 2. Perform background Error Logging into Firestore
    try {
      const email = auth.currentUser?.email || 'unauthenticated';
      const path = typeof window !== 'undefined' ? window.location.pathname + window.location.search : 'Unknown';
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
      const classification = classifyError(error);

      // Safe add to Firestore. If firestore itself throws quota or network error, let's NOT trigger another showError
      addDoc(collection(db, 'error_logs'), {
        message: errStr || String(error || ''),
        classification,
        timestamp: new Date().toISOString(),
        url: path,
        userAgent,
        userEmail: email,
        resolved: false,
        stack: error?.stack || null
      }).catch(firestoreErr => {
        console.warn("[ErrorContext Log Sync Fallback failed]:", firestoreErr?.message);
      });
    } catch (logErr) {
      console.warn("[ErrorContext Log Sync critical failure]:", logErr);
    }

    if (isQuota || isConnectionErr) {
      // Swallowed silently so we show cached content silently and never disrupt the user with connection/quota toasts.
      console.warn("[System Core Error Interceptor] Quietly ignored database/quota/connection issue as requested:", errStr);
      return;
    }

    let message = 'حدث خطأ في الاتصال بالخدمة. البيانات معروضة بالاعتماد على التراجع المحلي المستقر.';
    
    if (
      errStr.includes('NO_API_KEY') || 
      errStr.includes('لم يتم إعداد') || 
      errStr.includes('Unauthorized') || 
      errStr.includes('401') || 
      errStr.includes('API key') ||
      errStr.includes('footballApiStatus')
    ) {
      message = 'لم يتم إعداد مصدر البيانات بعد. يرجى إضافة مفاتيح البيئة من إعدادات Vercel.';
    } else if (typeof error === 'string') {
      // Suppress highly technical strings or direct DB paths
      if (!error.includes('Object') && !error.includes('Error') && !error.includes('/') && !error.includes('firestore')) {
        message = error;
      }
    } else if (error?.message) {
      if (error.message.includes('permission-denied') || error.message.includes('insufficient permissions')) {
        message = 'عذراً، لا نملك صلاحية الوصول لهذه البيانات الحساسة حالياً.';
      } else if (error.message.includes('network-request-failed') || error.message.includes('Failed to fetch')) {
        message = 'خطأ في الاتصال بالشبكة. يرجى التحقق من جودة موجز الإنترنت الخاص بك.';
      } else if (error.message.includes('RESOURCE_EXHAUSTED')) {
        message = 'تم تجاوز حصة العمل السحابية لقاعدة البيانات الكبرى. متاح العمل بنظام التراجع الفائق الكافي.';
      }
    }
    
    showToast(message, 'error');
  }, [showToast]);

  return (
    <ErrorContext.Provider value={{ showToast, showError }}>
      {children}
      <div className="fixed top-24 left-4 right-4 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl glass border border-white/10 shadow-2xl min-w-[300px] max-w-md"
            >
              {toast.type === 'error' && <XCircle className="text-red-500 shrink-0" size={20} />}
              {toast.type === 'success' && <CheckCircle2 className="text-green-500 shrink-0" size={20} />}
              {toast.type === 'warning' && <AlertCircle className="text-yellow-500 shrink-0" size={20} />}
              {toast.type === 'info' && <AlertCircle className="text-blue-500 shrink-0" size={20} />}
              
              <p className="flex-1 text-sm font-bold text-white/90 leading-tight">
                {toast.message}
              </p>
              
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="hover:bg-white/5 p-1 rounded-lg transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}
