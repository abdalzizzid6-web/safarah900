import React from 'react';
import { UserX, Activity, Globe, TrendingUp } from 'lucide-react';
import SecurityMetric from '../shared/SecurityMetric';

export interface SecurityStats {
  unauthorizedAttempts: number;
  validationFailures: number;
  suspiciousRequests: number;
  apiAbuseAttempts: number;
}

export default function SecurityOverviewWidget({ stats }: { stats: SecurityStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SecurityMetric 
        title="محاولات وصول غير مصرحة"
        value={stats.unauthorizedAttempts}
        description="تصفية وحظر الدخول للواجهات المحجوبة"
        icon={<UserX size={18} />}
        colorClass="rose"
      />

      <SecurityMetric 
        title="فشل مطابقة البيانات (Zod)"
        value={stats.validationFailures}
        description="حقول مصادقة تالفة أو محاولات حقن ومخالفة"
        icon={<Activity size={18} />}
        colorClass="amber"
      />

      <SecurityMetric 
        title="هجمات خادم شبكية (SSRF)"
        value={stats.suspiciousRequests}
        description="تم حظر الوصول إلى خدمات النطاق المحلي"
        icon={<Globe size={18} />}
        colorClass="purple"
      />

      <SecurityMetric 
        title="هجوم سوء استخدام (Rate Limiting)"
        value={stats.apiAbuseAttempts}
        description="إيقاف الطلبات فائقة السرعة من ملقنات غريبة"
        icon={<TrendingUp size={18} />}
        colorClass="orange"
      />
    </div>
  );
}
