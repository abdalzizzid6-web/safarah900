import React, { useState, useEffect } from 'react';
import { cmsService, ChannelServerSettings, LeagueSettings } from '../../services/cmsService';
import { leagueService } from '../../services/leagueService';
import { matchesRepositoryV2 } from '../../core/repository/MatchesRepositoryV2';
import { Radio, Plus, Trash2, Sliders, Server, Link, AlertCircle, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useError } from '../../context/ErrorContext';
import { Match } from '../../types';

export default function ChannelsCms() {
  const { showToast } = useError();
  const [servers, setServers] = useState<ChannelServerSettings[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<number>(1);
  const [assignedLeagues, setAssignedLeagues] = useState<string[]>([]);
  const [assignedMatches, setAssignedMatches] = useState<string[]>([]);
  const [geoRestrictions, setGeoRestrictions] = useState<string>('');
  const [autoFailover, setAutoFailover] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load custom channels/servers from CMS Settings
        const sList = await cmsService.getChannelServerSettingsList();
        
        // Load Leagues list
        let allLeagues = await leagueService.getRawLeaguesFromApi();
        if (!allLeagues || allLeagues.length === 0) {
          allLeagues = [
            { id: '39', name: "الدوري الإنجليزي الممتاز", logo: "https://media.api-sports.io/football/leagues/39.png", country: "England" },
            { id: '140', name: "لاليغا الإسبانية", logo: "https://media.api-sports.io/football/leagues/140.png", country: "Spain" },
            { id: '307', name: "دوري روشن السعودي", logo: "https://media.api-sports.io/football/leagues/307.png", country: "Saudi Arabia" }
          ];
        }

        // Load recent Matches list via repository
        const allMatches = await matchesRepositoryV2.getMatches();

        setServers(sList);
        setLeagues(allLeagues);
        setMatches(allMatches);
      } catch (e) {
        console.error("Error loading channel servers data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const id = isEditing || `srv-${Date.now()}`;
      const payload: ChannelServerSettings = {
        id,
        name,
        enabled: true,
        priority: Number(priority),
        assignedLeagueIds: assignedLeagues,
        assignedMatchIds: assignedMatches,
        geoRestrictions: geoRestrictions.split(',').map(s => s.trim()).filter(s => s),
        autoFailover
      };

      await cmsService.updateChannelServerSettings(id, payload);
      showToast('تم حفظ إعدادات السيرفر بنجاح', 'success');

      // Refresh list
      const freshList = await cmsService.getChannelServerSettingsList();
      setServers(freshList);

      // Reset
      setName('');
      setPriority(1);
      setAssignedLeagues([]);
      setAssignedMatches([]);
      setGeoRestrictions('');
      setAutoFailover(true);
      setIsEditing(null);
    } catch (err) {
      console.error(err);
      showToast('خطأ أثناء حفظ خيارات السيرفر', 'error');
    }
  };

  const handleEdit = (srv: ChannelServerSettings) => {
    setIsEditing(srv.id);
    setName(srv.name);
    setPriority(srv.priority || 1);
    setAssignedLeagues(srv.assignedLeagueIds || []);
    setAssignedMatches(srv.assignedMatchIds || []);
    setGeoRestrictions(srv.geoRestrictions?.join(', ') || '');
    setAutoFailover(srv.autoFailover ?? true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد فعلاً حذف هذا السيرفر؟')) return;
    try {
      await cmsService.deleteChannelServerSettings(id);
      showToast('تم حذف السيرفر بنجاح', 'success');
      setServers(prev => prev.filter(x => x.id !== id));
    } catch (err) {
      console.error(err);
      showToast('عذرًا، فشل حذف خيارات السيرفر', 'error');
    }
  };

  const handleToggleEnable = async (srv: ChannelServerSettings) => {
    try {
      const updated = { ...srv, enabled: !srv.enabled };
      await cmsService.updateChannelServerSettings(srv.id, updated);
      setServers(prev => prev.map(x => x.id === srv.id ? updated : x));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Server className="text-primary" size={24} />
          إدارة القنوات وسيرفرات البث الموصى بها
        </h2>
        <p className="text-xs text-gray-400 mt-1">إضافة سيرفرات البث، فرزها بناءً على الأولوية الرقمية، ومنح قنوات بث خاصة لبطولات حصرية أو مباريات محددة</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Server Setup Form */}
        <div className="lg:col-span-5">
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <Sliders className="text-primary" size={16} />
              {isEditing ? 'تعديل سيرفر البث' : 'إضافة سيرفر بث جديد'}
            </h3>

            <form onSubmit={handleCreateOrUpdate} className="space-y-4 text-right">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">اسم السيرفر / القناة (الظاهر للزوار)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: SSC SPORT 1 HD / سيرفر خاص ميرور A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs font-bold text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">الأولوية (الرقم الأصغر يظهر أولاً)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs font-bold text-white outline-none font-mono"
                />
              </div>

              {/* Assignment logic to specific leagues */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">توصية وتعيين لبطولة محددة (اختياري)</label>
                <div className="max-h-28 overflow-y-auto bg-black/20 border border-white/5 rounded-xl p-2.5 space-y-2">
                  {leagues.map(l => {
                    const checked = assignedLeagues.includes(String(l.id));
                    return (
                      <label key={l.id} className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-white select-none">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) setAssignedLeagues([...assignedLeagues, String(l.id)]);
                            else setAssignedLeagues(assignedLeagues.filter(i => i !== String(l.id)));
                          }}
                        />
                        <span>{l.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Assignment matching specific match ID */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">توصية وتعيين لمباراة معينة (اختياري)</label>
                <div className="max-h-28 overflow-y-auto bg-black/20 border border-white/5 rounded-xl p-2.5 space-y-2">
                  {matches.slice(0, 30).map(m => {
                    const checked = assignedMatches.includes(String(m.id));
                    return (
                      <label key={m.id} className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-white select-none">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) setAssignedMatches([...assignedMatches, String(m.id)]);
                            else setAssignedMatches(assignedMatches.filter(i => i !== String(m.id)));
                          }}
                        />
                        <span className="truncate max-w-[150px]">
                          {typeof m.homeTeam === 'object' ? m.homeTeam?.name : m.homeTeam} vs {typeof m.awayTeam === 'object' ? m.awayTeam?.name : m.awayTeam}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Geo Restrictions and Auto Failover */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold block">القيود الجغرافية (Geo restrictions)</label>
                  <input
                    type="text"
                    placeholder="أدخل أكواد الدول مفصولة بفاصلة (مثل: MA, DZ, EG) - اتركها فارغة لجميع الدول"
                    value={geoRestrictions}
                    onChange={(e) => setGeoRestrictions(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-xs font-bold text-white outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-gray-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoFailover}
                    onChange={(e) => setAutoFailover(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 text-primary"
                  />
                  تفعيل التبديل التلقائي (Auto Failover)
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-black font-black py-3 rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  {isEditing ? 'حفظ التغييرات' : 'إضافة وحفظ السيرفر'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(null);
                      setName('');
                      setPriority(1);
                      setAssignedLeagues([]);
                      setAssignedMatches([]);
                      setGeoRestrictions('');
                      setAutoFailover(true);
                    }}
                    className="bg-white/5 text-gray-400 font-bold text-xs px-4 rounded-xl"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-7">
          <div className="glass rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-slate-900/40 font-black text-xs text-gray-400">
              قائمة سيرفرات البث المُقرة
            </div>

            {servers.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <AlertCircle className="text-gray-500 mx-auto" size={36} />
                <h4 className="text-sm font-bold text-white">لم يتم تسجيل أي سيرفر مخصص</h4>
                <p className="text-xs text-gray-400">سوف يعتمد التطبيق على روابط المباريات الافتراضية المكتوبة يدويًا.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {servers.map(srv => (
                  <div key={srv.id} className="p-4 flex items-center justify-between gap-4 transition-all hover:bg-white/5 text-right">
                    <div>
                      <h4 className="font-bold text-sm text-white">{srv.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-[9px] bg-slate-800 text-gray-400 border border-white/5 font-mono px-2 py-0.5 rounded">
                          أولوية: {srv.priority}
                        </span>
                        {srv.assignedLeagueIds?.length > 0 && (
                          <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
                            مخصص لـ {srv.assignedLeagueIds.length} بطولات
                          </span>
                        )}
                        {srv.assignedMatchIds?.length > 0 && (
                          <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">
                            مخصص لـ {srv.assignedMatchIds.length} مباريات
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button onClick={() => handleToggleEnable(srv)}>
                        {srv.enabled !== false ? (
                          <ToggleRight size={24} className="text-primary cursor-pointer" />
                        ) : (
                          <ToggleLeft size={24} className="text-gray-500 cursor-pointer" />
                        )}
                      </button>

                      <button 
                        onClick={() => handleEdit(srv)}
                        className="p-1.5 rounded hover:bg-white/5 text-gray-400"
                        title="تعديل"
                      >
                        <Radio size={14} />
                      </button>

                      <button 
                        onClick={() => handleDelete(srv.id)}
                        className="p-1.5 rounded hover:bg-white/5 text-red-500"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
