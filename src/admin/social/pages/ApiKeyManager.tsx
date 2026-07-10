import React from 'react';
import { Key, Shield, Plus, Lock } from 'lucide-react';

const ApiKeyManager: React.FC = () => {
  const platforms = [
    { id: 'facebook', name: 'Facebook', status: 'missing' },
    { id: 'twitter', name: 'X (Twitter)', status: 'missing' },
    { id: 'instagram', name: 'Instagram', status: 'missing' },
    { id: 'telegram', name: 'Telegram', status: 'missing' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Key className="w-6 h-6 text-primary" />
          إدارة مفاتيح API
        </h2>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 flex gap-3 text-yellow-200">
        <Shield className="w-5 h-5 shrink-0 text-yellow-500" />
        <div className="text-sm">
          <p className="font-semibold text-yellow-400 mb-1">تنبيه أمني</p>
          <p>
            يتم تشفير جميع مفاتيح API قبل حفظها في قاعدة البيانات. لن يتم عرضها أبداً للمستخدمين ولا للمسؤولين بعد الحفظ.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {platforms.map(platform => (
          <div key={platform.id} className="bg-surface rounded-xl border border-white/5 p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-white">{platform.name}</h3>
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-red-500/20 text-red-400">
                غير متصل
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              قم بإعداد مفاتيح التطبيق للتمكن من ربط حسابات {platform.name}.
            </p>
            <button className="w-full px-4 py-2 bg-surface-elevated text-white rounded-lg hover:bg-surface-elevated/80 border border-white/10 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              إضافة مفاتيح
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiKeyManager;
