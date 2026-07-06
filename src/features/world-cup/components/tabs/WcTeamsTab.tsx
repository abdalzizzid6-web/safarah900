import { worldCupService } from '../../../../services/worldCupService';
import React from 'react';
import { Edit3, Check } from 'lucide-react';

export function WcTeamsTab({ 
  dbTeams, 
  editingTeam, setEditingTeam, 
  teamForm, setTeamForm, 
  handleSaveTeamOverride, handleEditTeamClick 
}: any) {
  return (
    <>
      {/* SUB 2: TEAMS */}
        <div className="space-y-6">
            <h3 className="text-xs font-black text-[#f3c623] uppercase">إدارة تفاصيل وبطاقات الـ 48 فريقاً</h3>

            {editingTeam ? (
              <div className="bg-[#0f0f12] border border-[#d4af37]/30 p-5 rounded-2xl max-w-lg space-y-4">
                <span className="text-xs font-black text-white">بيانات منتخب: {worldCupService.translateTeam(editingTeam.name)}</span>
                
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">الاسم باللغة العربية</label>
                  <input 
                    type="text" 
                    value={teamForm.name} 
                    onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1">الترتيب العالمي</label>
                    <input 
                      type="number" 
                      value={teamForm.ranking} 
                      onChange={e => setTeamForm({ ...teamForm, ranking: Number(e.target.value) })}
                      className="w-full bg-black border border-white/10 rounded-xl p-2 font-mono text-center text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1">المدير الفني</label>
                    <input 
                      type="text" 
                      value={teamForm.coach} 
                      onChange={e => setTeamForm({ ...teamForm, coach: e.target.value })}
                      className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">أفضل الإنجازات التاريخية في كأس العالم</label>
                  <input 
                    type="text" 
                    value={teamForm.history} 
                    onChange={e => setTeamForm({ ...teamForm, history: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveTeamOverride}
                    className="flex-1 py-2 bg-[#d4af37] hover:bg-[#f3c623] text-black text-xs font-black rounded-lg"
                  >
                    حفظ البيانات
                  </button>
                  <button onClick={() => setEditingTeam(null)} className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-xs">إلغاء</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto">
                {dbTeams.map(t => (
                  <div key={t.id} className="p-3 bg-black border border-white/5 rounded-2xl flex flex-col justify-between items-center text-center gap-2">
                    <img src={t.logo} className="w-8 h-8 object-contain" alt="" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-xs font-extrabold text-white text-ellipsis overflow-hidden whitespace-nowrap max-w-[120px]">{worldCupService.translateTeam(t.name)}</p>
                      <p className="text-[9px] text-[#f3c623] font-bold">المرتبة: #{t.ranking}</p>
                    </div>
                    <button 
                      onClick={() => handleEditTeamClick(t)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-black w-full"
                    >
                      تعديل
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
  );
}
