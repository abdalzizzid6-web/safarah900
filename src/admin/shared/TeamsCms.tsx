import React, { useState, useEffect, useMemo } from 'react';
import { matchesRepositoryV2 } from '../../core/repository/MatchesRepositoryV2';
import { cmsService, TeamSettings } from '../../services/cmsService';
import { cmsRepositoryV2 } from '../../core/repository/CmsRepositoryV2';
import { featureFlags } from '../../core/config/featureFlags';
import { teamService } from '../../services/teamService';
import { Search, Star, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Plus, ShieldCheck, HelpCircle, Upload, RefreshCw, Languages, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { uploadImage } from '../../services/imagekitService';
import { useError } from '../../context/ErrorContext';
import { translateTeamName } from '../../utils/arabicTeamNames';

export default function TeamsCms() {
  const { showToast } = useError();
  const [teams, setTeams] = useState<{ id: string; name: string; logo: string; custom?: boolean }[]>([]);
  const [settings, setSettings] = useState<Record<string, TeamSettings>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Custom manual team addition
  const [customName, setCustomName] = useState('');
  const [customLogo, setCustomLogo] = useState('');
  const [customId, setCustomId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      // Discover teams from matches using repository
      const teamsMap = await matchesRepositoryV2.getTeamsFromMatches(100);
      
      // Load custom teams from Firestore via service
      const customTeams = await teamService.getCustomTeams();
      customTeams.forEach(ct => {
        teamsMap.set(String(ct.id), {
          id: String(ct.id),
          name: ct.name,
          logo: ct.logo,
          custom: true
        } as any);
      });

      const list = Array.from(teamsMap.values());
      list.sort((a: any, b: any) => a.name.localeCompare(b.name, 'ar'));

      // Load settings from cms_teams
      const cmsTeamsList = featureFlags.useCmsV2 ? await cmsRepositoryV2.getTeams() : await cmsService.getTeamSettingsList();
      const settingsMap: Record<string, TeamSettings> = {};
      cmsTeamsList.forEach(t => {
        settingsMap[t.id] = t;
      });

      // Add teams that are configured but not in matches catalog or custom
      cmsTeamsList.forEach(cfg => {
        if (!teamsMap.has(cfg.id)) {
          list.push({ id: cfg.id, name: cfg.name, logo: cfg.logo });
        }
      });

      setTeams(list as any);
      setSettings(settingsMap);
    } catch (e) {
      console.error("Error loading Teams CMS:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleArabicizeAll = async () => {
    if (!window.confirm('هل أنت متأكد من تعريب أسماء كافة المنتخبات والأندية المكتشفة وحفظها؟')) return;
    setProcessing(true);
    try {
      let count = 0;
      for (const team of teams) {
        const arabicName = translateTeamName(team.name);
        if (arabicName !== team.name) {
          const current = settings[team.id] || { id: team.id, enabled: true, featured: false, order: 0, name: team.name, logo: team.logo };
          const updated = { ...current, name: arabicName };
          if (featureFlags.useCmsV2) {
             await cmsRepositoryV2.updateTeam(team.id, updated);
          } else {
             await cmsService.updateTeamSettings(team.id, updated);
          }
          setSettings(prev => ({ ...prev, [team.id]: updated }));
          count++;
        }
      }
      // Update local teams list too
      setTeams(prev => prev.map(t => ({ ...t, name: translateTeamName(t.name) })));
      showToast(`تم تعريب ${count} فريق بنجاح`, 'success');
    } catch (e) {
      showToast('خطأ أثناء عملية التعريب', 'error');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleEnable = async (teamId: string, teamInfo: { name: string; logo: string }) => {
    const current = settings[teamId] || { id: teamId, enabled: true, featured: false, order: 0, name: teamInfo.name, logo: teamInfo.logo };
    const enabled = current.enabled === false ? true : false;
    const updated = { ...current, enabled };
    if (featureFlags.useCmsV2) {
       await cmsRepositoryV2.updateTeam(teamId, updated);
    } else {
       await cmsService.updateTeamSettings(teamId, updated);
    }
    setSettings(prev => ({ ...prev, [teamId]: updated }));
  };

  const handleToggleFeatured = async (teamId: string, teamInfo: { name: string; logo: string }) => {
    const current = settings[teamId] || { id: teamId, enabled: true, featured: false, order: 0, name: teamInfo.name, logo: teamInfo.logo };
    const featured = !current.featured;
    const updated = { ...current, featured };
    if (featureFlags.useCmsV2) {
       await cmsRepositoryV2.updateTeam(teamId, updated);
    } else {
       await cmsService.updateTeamSettings(teamId, updated);
    }
    setSettings(prev => ({ ...prev, [teamId]: updated }));
  };

  const handleOrderChange = async (teamId: string, teamInfo: { name: string; logo: string }, isUp: boolean) => {
    const current = settings[teamId] || { id: teamId, enabled: true, featured: false, order: 0, name: teamInfo.name, logo: teamInfo.logo };
    const order = (current.order || 0) + (isUp ? -1 : 1);
    const updated = { ...current, order };
    if (featureFlags.useCmsV2) {
       await cmsRepositoryV2.updateTeam(teamId, updated);
    } else {
       await cmsService.updateTeamSettings(teamId, updated);
    }
    setSettings(prev => ({ ...prev, [teamId]: updated }));
  };

  const handleAddCustomTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customLogo || !customId) return;

    try {
      // Save directly to teams collection
      await teamService.saveCustomTeam({
        id: customId,
        name: customName,
        logo: customLogo,
        venueName: 'غير محدد',
        venueCity: 'غير محدد',
        venueCapacity: 0,
        venueImage: '',
        founded: 0,
        country: 'Global'
      });

      const payload: TeamSettings = {
        id: customId,
        name: customName,
        logo: customLogo,
        enabled: true,
        featured: false,
        order: 0
      };

      if (featureFlags.useCmsV2) {
         await cmsRepositoryV2.updateTeam(customId, payload);
      } else {
         await cmsService.updateTeamSettings(customId, payload);
      }
      
      showToast('تم إضافة الفريق بنجاح', 'success');
      setCustomName('');
      setCustomLogo('');
      setCustomId('');
      
      await loadData(); // Reload list
    } catch (err) {
      showToast('حدث خطأ أثناء إضافة الفريق', 'error');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفريق المخصص نهائياً؟')) return;
    try {
      await teamService.deleteCustomTeam(id);
      showToast('تم الحذف بنجاح', 'success');
      await loadData();
    } catch (err) {
      showToast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const filteredTeams = useMemo(() => {
    return teams.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teams, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginatedTeams = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTeams.slice(startIndex, startIndex + pageSize);
  }, [filteredTeams, currentPage]);

  const totalPages = Math.ceil(filteredTeams.length / pageSize) || 1;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold text-sm">جاري جرد وتصنيف الأندية والمنتخبات الرياضية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="text-primary" size={24} />
            إدارة الأندية والمنتخبات (Teams)
          </h2>
          <p className="text-xs text-gray-400 mt-1">إضافة أندية مخصصة من Firebase، تحديد الأندية المميزة، والتعريب التلقائي</p>
        </div>

        <button
          onClick={handleArabicizeAll}
          disabled={processing || teams.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-black hover:bg-emerald-500/20 transition-all disabled:opacity-50"
        >
          {processing ? <RefreshCw size={14} className="animate-spin" /> : <Languages size={14} />}
          تعريب كافة الأسماء تلقائياً
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Teams List Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass p-3 rounded-2xl border border-white/5 flex items-center gap-2">
            <Search size={18} className="text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="ابحث عن أندية أو منتخبات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 outline-0 text-sm font-bold text-white placeholder-gray-500"
            />
          </div>

          <div className="glass rounded-3xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 text-xs font-bold uppercase bg-slate-900/40">
                    <th className="p-4">الشعار</th>
                    <th className="p-4">الفريق</th>
                    <th className="p-4">المعرف ID</th>
                    <th className="p-4 text-center">الحالة</th>
                    <th className="p-4 text-center">مميز 🔥</th>
                    <th className="p-4 text-center">ترتيب</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedTeams.map(t => {
                    const cfg = settings[t.id] || { id: t.id, enabled: true, featured: false, order: 0, name: t.name, logo: t.logo };
                    const isEnabled = cfg.enabled !== false;
                    const isFeatured = cfg.featured === true;

                    return (
                      <tr key={t.id} className="hover:bg-white/5">
                        <td className="p-4">
                          <img 
                            src={t.logo || undefined} 
                            alt="" 
                            className="w-8 h-8 object-contain" 
                            onError={(e) => { e.currentTarget.src = 'https://media.api-sports.io/football/teams/unknown.png'; }}
                          />
                        </td>
                        <td className="p-4 font-bold text-white max-w-[150px] truncate">{t.name}</td>
                        <td className="p-4 font-mono text-[10px] text-gray-500">{t.id}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => handleToggleEnable(t.id, t)}>
                            {isEnabled ? (
                              <ToggleRight size={22} className="text-emerald-400" />
                            ) : (
                              <ToggleLeft size={22} className="text-gray-500" />
                            )}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => handleToggleFeatured(t.id, t)}>
                            <Star size={18} className={cn(isFeatured ? "text-yellow-400 fill-yellow-400" : "text-gray-500")} />
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => handleOrderChange(t.id, t, true)} className="p-1 hover:bg-white/10 rounded text-gray-400"><ArrowUp size={14} /></button>
                            <span className="font-mono text-xs font-black min-w-[20px] text-center">{cfg.order || 0}</span>
                            <button onClick={() => handleOrderChange(t.id, t, false)} className="p-1 hover:bg-white/10 rounded text-gray-400"><ArrowDown size={14} /></button>
                          </div>
                        </td>
                        <td className="p-4 text-center flex items-center justify-center gap-2">
                          {t.custom && (
                            <button onClick={() => handleDeleteTeam(t.id)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"><Trash2 size={14} /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="p-4 flex items-center justify-between border-t border-white/5 bg-slate-900/20 text-xs">
                <span className="text-gray-400 font-bold">
                  عرض {Math.min(filteredTeams.length, (currentPage - 1) * pageSize + 1)} - {Math.min(filteredTeams.length, currentPage * pageSize)} من أصل {filteredTeams.length} فريق
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <span className="text-white font-mono font-black px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Premium Custom Team Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <Plus className="text-primary" size={16} />
              إضافة فريق وقائي مخصص
            </h3>
            <p className="text-[11px] text-gray-400">إذا لم تجد الفريق في جرد المباريات الحالية، يمكنك إضافته هنا وتوجيهه بـ ID من اختيارك ليتم حفظه في قاعدة البيانات مباشرة.</p>

            <form onSubmit={handleAddCustomTeam} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">معرف الفريق ID (مثل: 541 ريال مدريد)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: custom_1"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 p-3 rounded-xl text-xs font-bold text-white outline-0 focus:border-primary/50 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">اسم النادي / المنتخب</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ميلان الإيطالي"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 p-3 rounded-xl text-xs font-bold text-white outline-0 focus:border-primary/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">رابط الشعار URL أو رفعه</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={customLogo}
                    onChange={(e) => setCustomLogo(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/15 p-3 rounded-xl text-xs font-bold text-white outline-0 focus:border-primary/50"
                  />
                  <label className={cn(
                    "p-3 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0",
                    uploading ? "bg-white/5 text-gray-500" : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                  )}>
                    {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        try {
                          const res = await uploadImage(file, 'teams');
                          setCustomLogo(res.url);
                          showToast('تم رفع شعار الفريق بنجاح', 'success');
                        } catch (err: any) {
                          showToast(err.message || 'فشل رفع الشعار', 'error');
                        } finally {
                          setUploading(false);
                        }
                      }} 
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-black font-black py-3 rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                إضافة الفريق لقاعدة البيانات
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
