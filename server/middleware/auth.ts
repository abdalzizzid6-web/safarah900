
import { auth, firestore, isFirebaseAdminReady, isFirestoreQuotaExceeded, setFirestoreQuotaExceeded, isFirebaseQuotaError } from '../firestore/collections';

export const ROLE_WEIGHTS: Record<string, number> = {
  'super_admin': 100,
  'admin': 80,
  'editor': 60,
  'moderator': 40,
  'author': 20,
  'vip_user': 10,
  'user': 0
};

export function hasRole(userRole: string, requiredRole: string): boolean {
  return (ROLE_WEIGHTS[userRole] || 0) >= (ROLE_WEIGHTS[requiredRole] || 0);
}

// In-Memory list of recent security events
let securityEvents: any[] = [];

export async function logSecurityAudit(event: any) {
  const auditEvent = {
    ...event,
    id: Math.random().toString(36).substring(2, 11),
    timestamp: event.timestamp || new Date().toISOString()
  };
  securityEvents = [auditEvent, ...securityEvents].slice(0, 100);

  if (isFirebaseAdminReady && !isFirestoreQuotaExceeded) {
    try {
      await firestore.collection('security_audits').add(auditEvent);
    } catch (e) {
      if (isFirebaseQuotaError(e)) {
        setFirestoreQuotaExceeded(true);
      }
      console.warn('[Security Log] Could not persist audit to Firestore:', e);
    }
  }
}

export const getSecurityEvents = () => securityEvents;

export const authMiddleware = (requiredRole: string = 'admin') => {
  return async (req: any, res: any, next: any) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    req.securityAudit = {
      timestamp: new Date().toISOString(),
      ip: typeof clientIp === 'string' ? clientIp.split(',')[0].trim() : String(clientIp),
      path: req.originalUrl || req.path,
      method: req.method,
      userAgent: req.headers['user-agent'] || 'unknown',
      authorized: false,
      reason: '',
      userId: null,
      userEmail: null,
      role: 'guest',
      type: 'access_attempt'
    };

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.securityAudit.reason = 'Missing or invalid Authorization Bearer token header';
      logSecurityAudit(req.securityAudit);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'يتطلب هذا الإجراء صلاحيات إدارية مصرح بها.',
        message_en: 'This action requires authorized administrator permissions.'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      if (!isFirebaseAdminReady) {
        req.securityAudit.reason = 'Firebase auth module offline';
        logSecurityAudit(req.securityAudit);
        return res.status(503).json({
          success: false,
          error: 'Service Unavailable',
          message: 'خدمة التحقق والمصادقة والـ Firebase غير جاهزة الآن.'
        });
      }

      const decodedToken = await auth.verifyIdToken(token);
      const uid = decodedToken.uid;
      const email = decodedToken.email || '';

      req.securityAudit.userId = uid;
      req.securityAudit.userEmail = email;

      let role = 'user';
      try {
        if (!isFirestoreQuotaExceeded) {
          const userDoc = await firestore.collection('users').doc(uid).get();
          if (userDoc.exists) {
            role = userDoc.data().role || 'user';
          }
        }
      } catch (err: any) {
        if (isFirebaseQuotaError(err)) {
          setFirestoreQuotaExceeded(true);
        }
        console.warn(`[Auth Middleware] Failed to fetch user role from Firestore, falling back to basic/default roles:`, err.message || err);
      }

      // Check role directly
      if (email === 'abdalziz2022@gmail.com') {
        role = 'super_admin';
      }

      req.user = { uid, email, role };
      req.securityAudit.role = role;

      if (!hasRole(role, requiredRole)) {
        req.securityAudit.reason = `Role weight insufficient. User role: ${role}, Required: ${requiredRole}`;
        req.securityAudit.type = 'unauthorized_access';
        logSecurityAudit(req.securityAudit);
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'عذراً! ليس لديك الصلاحيات الكافية لتنفيذ هذا الإجراء.',
          message_en: 'You do not have sufficient permissions to perform this action.'
        });
      }

      req.securityAudit.authorized = true;
      req.securityAudit.type = 'authorized_access';
      logSecurityAudit(req.securityAudit);
      next();
    } catch (err: any) {
      req.securityAudit.reason = `Token verification failure: ${err.message}`;
      req.securityAudit.type = 'invalid_credentials';
      logSecurityAudit(req.securityAudit);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'جلسة العمل منتهية أو البيانات غير صالحة. الرجاء تجديد الدخول.',
        message_en: 'Session expired or token is invalid. Please sign in again.'
      });
    }
  };
};
