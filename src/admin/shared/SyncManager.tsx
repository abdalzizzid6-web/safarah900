import React, { useEffect, useState } from 'react';
import { apiManagementRepository } from '../../core/api-management';
import { ISyncSettings } from '../../core/api-management/models/sync.model';

const SyncManager: React.FC = () => {
  const [settings, setSettings] = useState<ISyncSettings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await apiManagementRepository.syncRepository.getSyncSettings();
      setSettings(data);
    } catch (err) {
      console.error("Error loading sync settings:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">جاري التحميل...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">إدارة المزامنة</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="p-4">المزود</th>
              <th className="p-4">البطولة</th>
              <th className="p-4">التكرار</th>
              <th className="p-4">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {settings.map(s => (
              <tr key={s.id} className="border-b border-gray-800">
                <td className="p-4">{s.providerId}</td>
                <td className="p-4">{s.leagueId}</td>
                <td className="p-4">{s.frequency}</td>
                <td className="p-4">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SyncManager;
