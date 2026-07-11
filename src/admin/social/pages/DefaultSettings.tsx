import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';

const DefaultSettings: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/social/accounts');
      const data = await response.json();
      setAccounts(data);
      const initialDefaults = data.reduce((acc: any, curr: any) => {
        acc[curr.id] = curr.defaultPageId || '';
        return acc;
      }, {});
      setDefaults(initialDefaults);
    } catch (error) {
      console.error('Failed to fetch accounts', error);
      setToast({ message: 'فشل تحميل الحسابات', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(defaults).map(([accountId, pageId]) => 
          fetch(`/api/social/accounts/${accountId}/default-page`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pageId })
          })
        )
      );
      setToast({ message: 'تم حفظ الإعدادات بنجاح', type: 'success' });
      fetchAccounts();
    } catch (error) {
      console.error('Failed to save defaults', error);
      setToast({ message: 'فشل حفظ الإعدادات', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">إعدادات النشر الافتراضية</h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      {toast && (
        <div className={`p-4 rounded-lg flex items-center gap-2 text-sm ${toast.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-500/20' : 'bg-red-900/30 text-red-400 border border-red-500/20'}`}>
          <AlertCircle className="w-4 h-4" />
          {toast.message}
        </div>
      )}

      <div className="grid gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="p-4 bg-surface-elevated border border-white/10 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium text-white capitalize">{acc.platform}</span>
              <span className="text-sm text-gray-400">({acc.handle})</span>
            </div>
            
            {acc.pages && acc.pages.length > 0 && (
              <select 
                className="bg-black border border-white/10 rounded-lg p-2 text-sm text-white"
                value={defaults[acc.id] || ''}
                onChange={(e) => setDefaults(prev => ({ ...prev, [acc.id]: e.target.value }))}
              >
                <option value="">اختر صفحة افتراضية...</option>
                {acc.pages.map((page: any) => (
                  <option key={page.id} value={page.id}>{page.name}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DefaultSettings;
