import React, { useState, useEffect } from 'react';
import { cmsService, LeagueSettings } from '../../services/cmsService';
import { leagueService } from '../../services/leagueService';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { 
  Trophy, Star, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, 
  Search, RefreshCw, Upload, Image, Check, AlertCircle, Trash2, 
  Settings2, HelpCircle, Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { uploadImage } from '../../services/imagekitService';
import { useError } from '../../context/ErrorContext';

export default function LeagueManager() {
  const { showToast } = useError();
  const [leagues, setLeagues] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, LeagueSettings>>({});
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'failed'>>({});
  const [uploading, setUploading] = useState(false);

  // Custom League Form
  const [customId, setCustomId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customLogo, setCustomLogo] = useState('');
  const [customCountry, setCustomCountry] = useState('Global');
  
  // Load base data and configuration
  const loadData = async () => {
    setLoading(true);
    try {
      let allLeagues = await leagueService.getRawLeaguesFromApi();
      
      if (!allLeagues || allLeagues.length === 0) {
        allLeagues = [
          { id: '39', name: "الدوري الإنجليزي الممتاز", logo: "https://media.api-sports.io/football/leagues/39.png", country: "England" },
          { id: '140', name: "لاليغا الإسبانية", logo: "https://media.api-sports.io/football/leagues/140.png", country: "Spain" },
          { id: '307', name: "دوري روشن السعودي", logo: "https://media.api-sports.io/football/leagues/307.png", country: "Saudi Arabia" },
          { id: '2', name: "دوري أبطال أوروبا", logo: "https://media.api-sports.io/football/leagues/2.png", country: "Europe" },
          { id: '78', name: "الدوري الألماني", logo: "https://media.api-sports.io/football/leagues/78.png", country: "Germany" },
          { id: '135', name: "الدوري الإيطالي", logo: "https://media.api-sports.io/football/leagues/135.png", country: "Italy" },
          { id: '61', name: "الدوري الفرنسي", logo: "https://media.api-sports.io/football/leagues/61.png", country: "France" }
        ];
      }

      const cmsSettings = await cmsService.getLeagueSettingsMap();
      setLeagues(allLeagues || []);
      setSettings(cmsSettings);
    } catch (err: any) {
        console.error('Error loading league manager data:', err);
        setLeagues([]);
        setSettings({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    leagueService.getLeagues().catch(err => {
      console.log('Silent background leagues sync handled:', err);
    });
  }, []);

  const handleApiSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const fetched = await leagueService.getRawLeaguesFromApi();
      
      if (!fetched || fetched.length === 0) {
        setSyncResult({ success: false, message: 'لم يتم العثور على بطولات جديدة من المزود. يرجى التأكد من صلاحية مفتاح الـ API.' });
        setSyncing(false);
        return;
      }
      try { localStorage.setItem('kora90_cached_leagues_backup', JSON.stringify(fetched)); } catch (err) {}
      await loadData();
      setSyncResult({ success: true, message: `تمت المزامنة بنجاح وحفظ أكثر من ${fetched.length} بطولة في ذاكرة التخزين المحلية للواجهة!` });
    } catch (err: any) {
      setSyncResult({ success: false, message: `فشلت مزامنة البطولات: ${err.message || 'مشكلة في خادم مزود الخدمة'}` });
    } finally {
      setSyncing(false);
    }
  };

  const toggleEnabled = async (id: string) => {
    const current = settings[id] || { id, enabled: false, featured: false, order: 0, customName: '', logoUrl: '', color: '' };
    const enabled = !current.enabled;
    const updated = { ...current, enabled };
    
    setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
    try {
      await cmsService.updateLeagueSettings(id, updated);
      setSettings(prev => ({ ...prev, [id]: updated }));
      setSaveStatus(prev => ({ ...prev, [id]: 'saved' }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [id]: 'idle' })), 1500);
    } catch (e) {
      setSaveStatus(prev => ({ ...prev, [id]: 'failed' }));
    }
  };

  const toggleFeatured = async (id: string) => {
    const current = settings[id] || { id, enabled: false, featured: false, order: 0, customName: '', logoUrl: '', color: '' };
    const featured = !current.featured;
    const updated = { ...current, featured };

    setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
    try {
      await cmsService.updateLeagueSettings(id, updated);
      setSettings(prev => ({ ...prev, [id]: updated }));
      setSaveStatus(prev => ({ ...prev, [id]: 'saved' }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [id]: 'idle' })), 1500);
    } catch (e) {
      setSaveStatus(prev => ({ ...prev, [id]: 'failed' }));
    }
  };

  const handleFieldChange = async (id: string, field: keyof LeagueSettings, value: any) => {
    const current = settings[id] || { id, enabled: false, featured: false, order: 0, customName: '', logoUrl: '', color: '' };
    const updated = { ...current, [field]: value };
    
    setSettings(prev => ({ ...prev, [id]: updated }));
    setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
    
    try {
      await cmsService.updateLeagueSettings(id, updated);
      setSaveStatus(prev => ({ ...prev, [id]: 'saved' }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [id]: 'idle' })), 1500);
    } catch (e) {
      setSaveStatus(prev => ({ ...prev, [id]: 'failed' }));
    }
  };

  const handleImageUpload = (id: string, file: File) => {
    if (!file) return;
    if (file.size > 220 * 1024) {
      alert('حجم الملف كبير جداً! يرجى اختيار صورة أصغر من 200 كيلوبايت لضمان سرعة الاستدعاء.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (base64String) {
        handleFieldChange(id, 'logoUrl', base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customId || !customName || !customLogo) {
      showToast('يرجى تعبئة جميع الحقول المطلوبة', 'error');
      return;
    }

    try {
      const newLeague = {
        id: customId,
        name: customName,
        logo: customLogo,
        country: customCountry
      };
      
      await leagueService.saveCustomLeague(newLeague as any);
      
      const newSettings = {
        id: customId,
        enabled: true,
        featured: false,
        order: 0,
        customName: customName,
        logoUrl: customLogo,
      };
      await cmsService.updateLeagueSettings(customId, newSettings);
      
      showToast('تمت إضافة البطولة بنجاح', 'success');
      setCustomId('');
      setCustomName('');
      setCustomLogo('');
      setCustomCountry('Global');
      
      await loadData();
    } catch (err: any) {
      showToast('حدث خطأ أثناء إضافة البطولة', 'error');
    }
  };

  const handleDeleteLeague = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه البطولة نهائياً؟ ستختفي من لوحة التحكم والموقع.')) return;
    try {
      await leagueService.deleteCustomLeague(id);
      showToast('تم الحذف بنجاح', 'success');
      await loadData();
    } catch (err) {
      showToast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const filteredLeagues = leagues.filter(l => {
    const customSetting = settings[l.id];
    const nameSearch = String(l.name).toLowerCase();
    const customSearch = customSetting?.customName ? String(customSetting.customName).toLowerCase() : '';
    const queryStr = searchTerm.toLowerCase();
    return nameSearch.includes(queryStr) || customSearch.includes(queryStr);
  });

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/5 rounded-[2.5rem] p-6">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Trophy className="text-primary" /> مدير البطولات المتقدم
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            إضافة وتعديل وحذف البطولات مباشرة من قاعدة بيانات Firebase للتحكم الكامل.
          </p>
        </div>
        <button
          onClick={handleApiSync}
          disabled={syncing}
          className={cn(
            "px-6 py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border select-none transition-all duration-300",
            syncing ? "bg-white/5 border-white/10 text-gray-500" : "bg-primary text-black border-primary/20 hover:scale-[1.02]"
          )}
        >
          <RefreshCw size={14} className={cn(syncing && "animate-spin")} />
          <span>{syncing ? 'جاري جلب ومزامنة البطولات...' : 'مزامنة البطولات الجديدة'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/40 border border-white/5 p-4 rounded-2xl">
            <div className="relative w-full sm:max-w-md">
              <Search size={14} className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pr-11 pl-4 py-3 bg-white/5 hover:bg-white/10 focus:bg-white/10 rounded-2xl text-xs text-white border border-white/5 focus:border-white/15 focus:outline-none placeholder-gray-500 font-sans"
                placeholder="ابحث عن بطولة ومسابقة لتخصيصها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4 text-xs">
              <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <span className="text-gray-400">الإجمالي: </span>
                <strong className="text-white font-mono">{leagues.length}</strong>
              </div>
            </div>
          </div>

          <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
            {loading ? (
              <div className="py-24 text-center space-y-3">
                <RefreshCw size={28} className="animate-spin text-primary mx-auto" />
                <p className="text-sm text-gray-400">جاري تحميل بيانات البطولات...</p>
              </div>
            ) : filteredLeagues.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Trophy size={42} className="text-gray-600 mx-auto" />
                <p className="text-xs text-gray-500 font-bold">لا يوجد دوريات مطابقة للبحث حالياً.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-white/5 text-gray-400 border-b border-white/5 uppercase select-none">
                      <th className="p-4 px-6 text-right font-black">الشعار والبطولة الأصلي</th>
                      <th className="p-4 font-black">الاسم المخصص</th>
                      <th className="p-4 text-center font-black">الظهور بالموقع</th>
                      <th className="p-4 text-center font-black">مميز ⭐</th>
                      <th className="p-4 text-center font-black">الترتيب</th>
                      <th className="p-4 text-center font-black">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLeagues.map(l => {
                      const s = settings[l.id] || { id: l.id, enabled: false, featured: false, order: 999, customName: '', logoUrl: '', color: '' };
                      const status = saveStatus[l.id] || 'idle';

                      return (
                        <tr key={l.id} className={cn("hover:bg-white/5 transition-colors align-middle", s.enabled ? "bg-green-500/[0.01]" : "opacity-60 bg-black/20")}>
                          <td className="p-4 px-6">
                            <div className="flex items-center gap-3 font-sans">
                              {s.logoUrl ? (
                                <img src={s.logoUrl} className="w-9 h-9 p-1 rounded-xl bg-black/40 border border-white/10 object-contain shadow-md shrink-0" alt="" />
                              ) : l.logo ? (
                                <img src={l.logo} className="w-9 h-9 p-1 rounded-xl bg-black/40 border border-white/10 object-contain shadow-md shrink-0" alt="" />
                              ) : (
                                <Trophy size={16} className="text-white/20 shrink-0" />
                              )}
                              <div>
                                <span className="font-sans text-xs font-black block text-white max-w-[120px] truncate">{l.name}</span>
                                <span className="text-[10px] text-gray-400 font-medium block mt-0.5">ID: {l.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <input 
                              type="text" 
                              className="w-full max-w-[150px] px-3 py-2 bg-black/40 hover:bg-black/60 focus:bg-black/80 border border-white/5 focus:border-primary/20 rounded-xl text-xs text-white focus:outline-none font-sans font-bold placeholder-gray-600 transition-all text-right"
                              placeholder="الاسم العربي..."
                              value={s.customName || ''}
                              onChange={(e) => handleFieldChange(l.id, 'customName', e.target.value)}
                            />
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => toggleEnabled(l.id)} className="inline-flex justify-center items-center cursor-pointer transform hover:scale-105 transition-transform">
                              {s.enabled ? <ToggleRight size={24} className="text-green-400" /> : <ToggleLeft size={24} className="text-gray-500" />}
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => toggleFeatured(l.id)} className="inline-flex justify-center items-center cursor-pointer group">
                              <Star size={16} className={cn("transition-all duration-300", s.featured ? "text-yellow-400 fill-yellow-400 ring-4 ring-yellow-400/10 rounded-full scale-110" : "text-gray-500 group-hover:text-gray-300")} />
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-black/20 p-1 rounded-xl border border-white/5 select-none">
                              <button onClick={() => handleFieldChange(l.id, 'order', Math.max(0, (s.order ?? 999) - 1))} className="p-1 hover:bg-white/5 active:bg-white/10 rounded text-gray-400 hover:text-white"><ArrowUp size={13} /></button>
                              <input type="number" className="w-8 bg-transparent text-center font-mono text-[11px] font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={s.order ?? 999} onChange={(e) => { const v = parseInt(e.target.value); handleFieldChange(l.id, 'order', isNaN(v) ? 999 : v); }} />
                              <button onClick={() => handleFieldChange(l.id, 'order', (s.order ?? 999) + 1)} className="p-1 hover:bg-white/5 active:bg-white/10 rounded text-gray-400 hover:text-white"><ArrowDown size={13} /></button>
                            </div>
                          </td>
                          <td className="p-4 text-center flex items-center justify-center gap-2">
                            {status === 'saving' && <span className="text-primary text-[10px] animate-pulse">يُحفظ...</span>}
                            {status === 'saved' && <span className="text-green-400 font-bold"><Check size={14} /></span>}
                            {status === 'failed' && <span className="text-red-400"><AlertCircle size={14} /></span>}
                            <button onClick={() => handleDeleteLeague(l.id)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <Plus className="text-primary" size={16} />
              إضافة بطولة جديدة مباشرة لقاعدة البيانات
            </h3>
            <p className="text-[11px] text-gray-400">ستضاف البطولة إلى جدول Firebase بشكل دائم دون الاعتماد على المزود الخارجي.</p>

            <form onSubmit={handleAddCustomLeague} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">معرف البطولة ID (رقم فريد)</label>
                <input type="text" required placeholder="مثال: c_1001" value={customId} onChange={(e) => setCustomId(e.target.value)} className="w-full bg-black/40 border border-white/15 p-3 rounded-xl text-xs font-bold text-white outline-0 focus:border-primary/50 font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">اسم البطولة (بالعربية)</label>
                <input type="text" required placeholder="مثال: كأس الملك" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full bg-black/40 border border-white/15 p-3 rounded-xl text-xs font-bold text-white outline-0 focus:border-primary/50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">الدولة / النطاق</label>
                <input type="text" placeholder="مثال: السعودية (اختياري)" value={customCountry} onChange={(e) => setCustomCountry(e.target.value)} className="w-full bg-black/40 border border-white/15 p-3 rounded-xl text-xs font-bold text-white outline-0 focus:border-primary/50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">رابط الشعار URL أو رفعه</label>
                <div className="flex gap-2">
                  <input type="url" required placeholder="https://..." value={customLogo} onChange={(e) => setCustomLogo(e.target.value)} className="flex-1 bg-black/40 border border-white/15 p-3 rounded-xl text-xs font-bold text-white outline-0 focus:border-primary/50" />
                  <label className={cn("p-3 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0", uploading ? "bg-white/5 text-gray-500" : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20")}>
                    {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                    <input type="file" className="hidden" accept="image/*" disabled={uploading} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const res = await uploadImage(file, 'leagues');
                        setCustomLogo(res.url);
                        showToast('تم رفع شعار البطولة بنجاح', 'success');
                      } catch (err: any) {
                        showToast(err.message || 'فشل رفع الشعار', 'error');
                      } finally {
                        setUploading(false);
                      }
                    }} />
                  </label>
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-black font-black py-3 rounded-xl text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                إضافة البطولة
              </button>
            </form>
          </div>
          
          <div className="p-5 bg-white/5 border border-white/5 rounded-[2rem] text-[10px] text-gray-400 leading-relaxed font-semibold flex items-start gap-3">
            <Settings2 size={16} className="text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-xs block mb-1">دليل الاستخدام السريع:</strong>
              <ul className="list-disc pr-4 mt-2 space-y-2">
                <li>المعرف <span className="font-mono text-primary">ID</span> يجب أن يكون فريداً لكل بطولة (مثلاً <span className="font-mono text-gray-300">custom_1</span>).</li>
                <li>لتعديل ترتيب ظهور البطولات، غيّر أرقام حقل "الترتيب" وضع رقماً أقل لتظهر البطولة أولاً.</li>
                <li>يتم حفظ وإدارة البطولات بالكامل داخل قاعدة البيانات Firebase بمرونة وتكامل مع لوحة التحكم.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
