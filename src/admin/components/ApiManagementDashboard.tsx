import React, { useState } from 'react';
import { useApiConnections } from '../api/hooks/useApiConnections';
import { ApiProvider } from '../api/types/api';
import ConnectionDetailsDialog from '../api/components/ConnectionDetailsDialog';
import { Plus, Edit2, Trash2, Database, ToggleLeft, ToggleRight } from 'lucide-react';

export const ApiManagementDashboard: React.FC = () => {
  const {
    stats,
    actionLoading,
    saveProvider,
    deleteProvider,
    toggleActive,
  } = useApiConnections();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Partial<ApiProvider> | null>(null);

  const handleAddKey = () => {
    setEditingProvider({ 
      name: '', 
      key: '', 
      provider: 'API-Football', 
      quotaDaily: 100, 
      quotaMonthly: 3000, 
      priority: 1, 
      active: true, 
      allowedLeagues: [] 
    });
    setIsFormOpen(true);
  };

  const handleEditProvider = (provider: ApiProvider) => {
    setEditingProvider({ ...provider });
    setIsFormOpen(true);
  };

  const handleFormSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    const success = await saveProvider(editingProvider);
    if (success) {
      setIsFormOpen(false);
      setEditingProvider(null);
    }
  };

  return (
    <div className="p-6 bg-[#121214] rounded-2xl border border-gray-800 text-gray-100" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Database className="w-6 h-6 text-[#FF003C]" />
          إدارة مفاتيح الـ API
        </h2>
        <button 
          onClick={handleAddKey}
          className="bg-[#FF003C] hover:bg-[#D00030] text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          إضافة مفتاح جديد
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b border-gray-800">
            <tr>
              <th className="py-3 px-4 text-right">الاسم</th>
              <th className="py-3 px-4 text-right">المزود</th>
              <th className="py-3 px-4 text-right">الدوريات المسموحة</th>
              <th className="py-3 px-4 text-right">الحالة</th>
              <th className="py-3 px-4 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {stats?.providers.map((provider) => (
              <tr key={provider.id}>
                <td className="py-3 px-4 font-bold">{provider.name}</td>
                <td className="py-3 px-4 text-gray-400">{provider.provider}</td>
                <td className="py-3 px-4 font-mono text-xs">{provider.allowedLeagues?.join(', ') || 'الكل'}</td>
                <td className="py-3 px-4">
                  <button onClick={() => toggleActive(provider)} className="cursor-pointer">
                    {provider.active ? <ToggleRight className="text-green-500 w-6 h-6" /> : <ToggleLeft className="text-gray-500 w-6 h-6" />}
                  </button>
                </td>
                <td className="py-3 px-4 flex gap-2">
                  <button onClick={() => handleEditProvider(provider)} className="text-blue-400 hover:text-blue-300"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => deleteProvider(provider.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConnectionDetailsDialog
        isOpen={isFormOpen}
        provider={editingProvider}
        actionLoading={actionLoading}
        onClose={() => { setIsFormOpen(false); setEditingProvider(null); }}
        onSave={handleFormSave}
        onChange={(updated) => setEditingProvider(updated)}
      />
    </div>
  );
};
