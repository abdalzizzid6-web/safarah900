import { useState, useCallback, useEffect } from 'react';
import { securityService } from '../services/securityService';

export interface SecurityAudit {
  id: string;
  timestamp: string;
  ip: string;
  path: string;
  method: string;
  userAgent: string;
  authorized: boolean;
  type: 'access_attempt' | 'unauthorized_access' | 'validation_failure' | 'ssrf_attempt' | 'api_abuse' | 'invalid_credentials' | 'authorized_access';
  reason: string;
  userId?: string | null;
  userEmail?: string | null;
  role?: string;
  bodySample?: string;
}

export function useSecurityLogs() {
  const [audits, setAudits] = useState<SecurityAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorString, setErrorString] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setErrorString(null);
    try {
      const data = await securityService.fetchSecurityAudits();
      if (data.success) {
        setAudits(data.audits || []);
      } else {
        throw new Error(data.error || 'فشلت عملية التحميل');
      }
    } catch (err: any) {
      console.error("[Security Fetch Log Failed]", err);
      setErrorString(err.message || 'فشلت عملية الاتصال بخادم مراقبة الأمان والمصادقة.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { audits, loading, errorString, fetchLogs };
}
