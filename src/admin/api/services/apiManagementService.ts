import { DashboardStats, ApiProvider, ApiRouting } from '../types/api';

const getHeaders = () => {
  const token = localStorage.getItem('user_token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const apiManagementService = {
  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/admin/api-management/stats', {
      headers: {
        'Authorization': getHeaders()['Authorization']
      }
    });
    if (!res.ok) {
      throw new Error('فشل جلب إحصائيات إدارة واجهة برمجة التطبيقات');
    }
    return res.json();
  },

  async saveProvider(provider: Partial<ApiProvider>): Promise<void> {
    const res = await fetch('/api/admin/api-management/providers', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(provider)
    });
    if (!res.ok) {
      throw new Error('فشل حفظ بيانات مزود الخدمة');
    }
  },

  async deleteProvider(id: string): Promise<void> {
    const res = await fetch(`/api/admin/api-management/providers/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': getHeaders()['Authorization']
      }
    });
    if (!res.ok) {
      throw new Error('فشل حذف المفتاح من مجمع المفاتيح');
    }
  },

  async testKey(provider: string, key: string): Promise<{ success: boolean; latency?: number; message?: string }> {
    const res = await fetch('/api/admin/api-management/test-key', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ provider, key })
    });
    if (!res.ok) {
      throw new Error('فشل بدء فحص الاتصال بالمزود');
    }
    return res.json();
  },

  async saveRouting(routing: ApiRouting): Promise<void> {
    const res = await fetch('/api/admin/api-management/routing', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(routing)
    });
    if (!res.ok) {
      throw new Error('فشل حفظ توجيه القسم الرياضي');
    }
  },

  async resetQuotas(): Promise<void> {
    const res = await fetch('/api/admin/api-management/reset', {
      method: 'POST',
      headers: {
        'Authorization': getHeaders()['Authorization']
      }
    });
    if (!res.ok) {
      throw new Error('فشل تصفير عدادات الاستهلاك');
    }
  }
};
