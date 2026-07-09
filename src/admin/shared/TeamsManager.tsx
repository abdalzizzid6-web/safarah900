import React, { useEffect, useState } from 'react';
import { ITeam } from '../../core/api-management/models/team.model';
import { apiManagementRepository } from '../../core/api-management';

const TeamsManager: React.FC = () => {
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await apiManagementRepository.teamRepository.getTeams();
      setTeams(data);
    } catch (err) {
      console.error("Error loading teams:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">جاري التحميل...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">إدارة الفرق</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="p-4">الاسم</th>
              <th className="p-4">الدولة</th>
              <th className="p-4">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.id} className="border-b border-gray-800">
                <td className="p-4">{team.nameAR}</td>
                <td className="p-4">{team.country}</td>
                <td className="p-4">{team.enabled ? 'مفعل' : 'معطل'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamsManager;
