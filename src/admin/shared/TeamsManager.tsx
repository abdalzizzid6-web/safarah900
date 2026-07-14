import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Upload, RefreshCw, Check, X } from 'lucide-react';
import { ITeam } from '../../core/api-management/models/team.model';
import { apiManagementRepository } from '../../core/api-management';
import { uploadImage } from '../../services/imagekitService';
import { useError } from '../../context/ErrorContext';
import { cn } from '../../lib/utils';

const TeamsManager: React.FC = () => {
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useError();

  const [formData, setFormData] = useState<Partial<ITeam>>({
    nameAR: '', nameEN: '', logo: '', country: '', shortName: '', leagueId: 'custom', enabled: true
  });

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
      showToast('فشل تحميل الفرق', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImage(file, 'teams');
      setFormData(prev => ({ ...prev, logo: res.url }));
      showToast('تم رفع شعار الفريق بنجاح', 'success');
    } catch (err: any) {
      showToast(err.message || 'فشل رفع الشعار', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAR || !formData.logo) {
      showToast('الاسم والشعار مطلوبان', 'error');
      return;
    }
    
    try {
      const newTeam: ITeam = {
        id: formData.id || `custom_${Date.now()}`,
        externalId: formData.id || `custom_${Date.now()}`,
        providerId: 'Custom',
        leagueId: formData.leagueId || 'custom',
        country: formData.country || 'Unknown',
        season: new Date().getFullYear().toString(),
        sport: 'Football',
        logo: formData.logo,
        nameAR: formData.nameAR,
        nameEN: formData.nameEN || formData.nameAR,
        shortName: formData.shortName || formData.nameAR.substring(0, 3),
        slug: formData.nameEN?.toLowerCase().replace(/\s+/g, '-') || `team-${Date.now()}`,
        enabled: formData.enabled !== false,
        hidden: false,
        featured: false,
        favorite: false,
        excluded: false,
        order: teams.length,
        syncDisabled: true,
        updatedAt: Date.now(),
        stadium: formData.stadium || ''
      };
      
      await apiManagementRepository.teamRepository.updateTeam(newTeam);
      showToast('تم حفظ الفريق بنجاح', 'success');
      setFormData({ nameAR: '', nameEN: '', logo: '', country: '', shortName: '', leagueId: 'custom', enabled: true, stadium: '' });
      loadTeams();
    } catch (err: any) {
      showToast(err.message || 'فشل حفظ الفريق', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفريق؟')) return;
    try {
      // Assuming a delete method exists or we use raw Firestore
      // For now we'll just disable if delete isn't in repo interface
      const team = teams.find(t => t.id === id);
      if (team) {
         team.enabled = false;
         team.hidden = true;
         await apiManagementRepository.teamRepository.updateTeam(team);
         showToast('تم إخفاء الفريق', 'success');
         loadTeams();
      }
    } catch (err) {
      showToast('خطأ أثناء الحذف', 'error');
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">جاري تحميل الفرق...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Teams List */}
        <div className="flex-1 space-y-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span className="text-primary">إدارة</span> الفرق المسجلة
          </h2>
          <div className="bg-[#121214] border border-white/5 rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-black/40 border-b border-white/5 text-gray-400">
                    <th className="p-4 font-bold text-[11px]">الشعار والاسم</th>
                    <th className="p-4 font-bold text-[11px]">الدولة / الملعب</th>
                    <th className="p-4 font-bold text-[11px]">الحالة</th>
                    <th className="p-4 font-bold text-[11px] text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {teams.filter(t => !t.hidden).map(team => (
                    <tr key={team.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={team.logo} alt={team.nameAR} className="w-8 h-8 rounded-full bg-black/50 object-contain p-1" />
                          <div>
                            <div className="font-bold text-white text-xs">{team.nameAR}</div>
                            <div className="text-[10px] text-gray-500">{team.nameEN}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-gray-400">{team.country}</div>
                        {team.stadium && <div className="text-[10px] text-gray-500">{team.stadium}</div>}
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "text-[10px] px-2 py-1 rounded-full font-bold",
                          team.enabled ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {team.enabled ? 'مفعل' : 'معطل'}
                        </span>
                      </td>
                      <td className="p-4 flex items-center justify-center gap-2">
                        <button onClick={() => setFormData(team)} className="p-2 hover:bg-white/10 rounded-xl text-blue-400 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(team.id)} className="p-2 hover:bg-white/10 rounded-xl text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {teams.filter(t => !t.hidden).length === 0 && (
                     <tr><td colSpan={4} className="p-8 text-center text-gray-500 text-xs">لا يوجد فرق مسجلة حالياً</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        <div className="w-full md:w-80 space-y-4 shrink-0">
          <div className="glass p-6 rounded-[2rem] border border-white/5 space-y-4">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <Plus className="text-primary" size={16} />
              {formData.id ? 'تعديل الفريق' : 'إضافة فريق جديد'}
            </h3>
            
            <form onSubmit={handleSaveTeam} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">اسم الفريق (بالعربية) *</label>
                <input required type="text" value={formData.nameAR} onChange={e => setFormData({...formData, nameAR: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs text-white outline-0 focus:border-primary/50" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">اسم الفريق (بالإنجليزية)</label>
                <input type="text" value={formData.nameEN} onChange={e => setFormData({...formData, nameEN: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs text-white outline-0 focus:border-primary/50" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">الدولة</label>
                <input type="text" value={formData.country || ''} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs text-white outline-0 focus:border-primary/50" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">الملعب الافتراضي</label>
                <input type="text" value={formData.stadium || ''} onChange={e => setFormData({...formData, stadium: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs text-white outline-0 focus:border-primary/50" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">شعار الفريق *</label>
                <div className="flex gap-2">
                  <input type="url" required value={formData.logo} onChange={e => setFormData({...formData, logo: e.target.value})} placeholder="https://..." className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-xs text-white outline-0 focus:border-primary/50 font-mono text-left dir-ltr" />
                  <label className={cn("p-3 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0", uploading ? "bg-white/5 text-gray-500" : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20")}>
                    {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                    <input type="file" className="hidden" accept="image/*" disabled={uploading} onChange={handleUpload} />
                  </label>
                </div>
                {formData.logo && (
                  <div className="mt-2 p-2 bg-black/40 rounded-xl flex justify-center">
                    <img src={formData.logo} alt="Preview" className="w-12 h-12 object-contain" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                <input type="checkbox" id="teamEnabled" checked={formData.enabled} onChange={e => setFormData({...formData, enabled: e.target.value === 'on'})} className="w-4 h-4 accent-primary" />
                <label htmlFor="teamEnabled" className="text-xs text-gray-300">تفعيل الفريق ليظهر في الموقع</label>
              </div>

              <button type="submit" className="w-full bg-primary text-black font-black py-3 rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <Check size={16} /> حفظ الفريق
              </button>
              
              {formData.id && (
                <button type="button" onClick={() => setFormData({ nameAR: '', nameEN: '', logo: '', country: '', shortName: '', leagueId: 'custom', enabled: true, stadium: '' })} className="w-full bg-white/5 text-white font-bold py-3 rounded-xl text-xs hover:bg-white/10 transition-all">
                  إلغاء وإضافة جديد
                </button>
              )}
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeamsManager;
