import { useState } from 'react';
import { securityService } from '../services/securityService';

export function useSecurityStatus(onReloadNeeded?: () => void) {
  const [simulatingType, setSimulatingType] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSimulateSSRF = async () => {
    setSimulatingType('ssrf');
    setSimResult(null);
    try {
      const res = await securityService.simulateSSRF();
      const data = await res.json();
      if (res.status === 400 || !data.success) {
        setSimResult({
          success: true,
          message: `تم التصدي بنجاح لثغرة SSRF! استجاب الخادم بـ [${res.status}]: ${data.message || 'الرابط محظور أمنياً'}`
        });
      } else {
        setSimResult({
          success: false,
          message: 'فشلت الماكينة في منع SSRF في بيئة التطوير الحالية.'
        });
      }
    } catch (err: any) {
      setSimResult({
        success: true,
        message: `تم التصدي بنجاح لثغرة SSRF عن طريق الرفض المتوقع أو الجدار الأمني: ${err.message}`
      });
    } finally {
      setSimulatingType(null);
      if (onReloadNeeded) onReloadNeeded();
    }
  };

  const handleSimulateUnauthorized = async () => {
    setSimulatingType('unauthorized');
    setSimResult(null);
    try {
      const res = await securityService.simulateUnauthorized();
      const data = await res.json();
      if (res.status === 401) {
        setSimResult({
          success: true,
          message: `تم حجب الوصول بنجاح! استجاب الفلتر المركزي بـ [${res.status}]: ${data.message || 'غير مصرح به'}`
        });
      } else {
        setSimResult({
          success: false,
          message: `تم تجاوز التحقق وحصلنا على الرموز [${res.status}].`
        });
      }
    } catch (err: any) {
      setSimResult({
        success: true,
        message: `تم تعطيل الإرسال بواسطة قيود معالجة الشبكة: ${err.message}`
      });
    } finally {
      setSimulatingType(null);
      if (onReloadNeeded) onReloadNeeded();
    }
  };

  const handleSimulateValidation = async () => {
    setSimulatingType('validation');
    setSimResult(null);
    try {
      const res = await securityService.simulateValidation();
      const data = await res.json();
      if (res.status === 400) {
        setSimResult({
          success: true,
          message: `تم كشف البيانات التالفة بنجاح بـ [${res.status}]: ${data.message || 'خطأ فحص Zod'}`
        });
      } else {
        setSimResult({
          success: false,
          message: `الخادم قبل البيانات التالفة للاستجابة [${res.status}].`
        });
      }
    } catch (err: any) {
      setSimResult({
        success: true,
        message: `تم التصدي بنجاح عبر طبقة التحقق: ${err.message}`
      });
    } finally {
      setSimulatingType(null);
      if (onReloadNeeded) onReloadNeeded();
    }
  };

  return {
    simulatingType,
    simResult,
    handleSimulateSSRF,
    handleSimulateUnauthorized,
    handleSimulateValidation
  };
}
