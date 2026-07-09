import React, { useState, useEffect } from 'react';
import { cmsService, LeagueSettings } from '../../services/cmsService';
import { leagueService } from '../../services/leagueService';
import { db, auth } from '../../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { 
  Trophy, Star, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, 
  Search, RefreshCw, Upload, Image, Check, AlertCircle, Trash2, 
  Settings2, HelpCircle, Plus, Sparkles, Home, Activity, Calendar, GripVertical, Eye, EyeOff, Filter
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
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'failed'>>({});
  const [uploading, setUploading] = useState(false);
  const [arabizingId, setArabizingId] = useState<string | null>(null);
  const [expandedLeagueId, setExpandedLeagueId] = useState<string | null>(null);

  // Drag and Drop row-reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updatedList = [...filteredLeagues];
    const [draggedItem] = updatedList.splice(draggedIndex, 1);
    updatedList.splice(targetIndex, 0, draggedItem);

    const updatedSettings = { ...settings };
    
    setSaveStatus(prev => {
      const copy = { ...prev };
      updatedList.forEach(item => { copy[item.id] = 'saving'; });
      return copy;
    });

    try {
      for (let i = 0; i < updatedList.length; i++) {
        const item = updatedList[i];
        const currentSetting = updatedSettings[item.id] || { 
          id: item.id, 
          leagueId: item.id,
          name: item.name,
          country: item.country || 'Global',
          logo: item.logo || '',
          enabled: true, 
          featured: false, 
          order: i,
          sortOrder: i,
          visibleInHome: true,
          visibleInLive: true,
          visibleInSchedule: true
        };
        
        const newSetting = { 
          ...currentSetting, 
          order: i, 
          sortOrder: i,
          updatedAt: new Date().toISOString()
        };
        
        updatedSettings[item.id] = newSetting as any;
        await cmsService.updateLeagueSettings(item.id, newSetting);
        setSaveStatus(prev => ({ ...prev, [item.id]: 'saved' }));
      }
      setSettings(updatedSettings);
      showToast('تم حفظ الترتيب الجديد للبطولات بنجاح', 'success');
    } catch (err) {
      showToast('فشل حفظ الترتيب الجديد', 'error');
    } finally {
      setDraggedIndex(null);
      setTimeout(() => {
        setSaveStatus(prev => {
          const copy = { ...prev };
          Object.keys(copy).forEach(k => { copy[k] = 'idle'; });
          return copy;
        });
      }, 1500);
    }
  };

  const handleArabizeLeague = async (id: string, name: string) => {
    if (!window.confirm('هل أنت متأكد من تعريب هذه البطولة وجميع فرقها تلقائياً؟ قد تستغرق هذه العملية بعض الوقت وتستهلك من رصيد الذكاء الاصطناعي.')) return;
    setArabizingId(id);
    try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/admin/arabize-league', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || ''}`
            },
            body: JSON.stringify({ leagueId: id, leagueName: name })
        });
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error || 'فشل في عملية التعريب');
        
        showToast(result.message, 'success');
        await loadData(); // Reload to see new customNames
    } catch (err: any) {
        showToast(err.message, 'error');
    } finally {
        setArabizingId(null);
    }
  };

  // Custom League Form
  const [customId, setCustomId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customLogo, setCustomLogo] = useState('');
  const [customCountry, setCustomCountry] = useState('Global');
  const [customSeason, setCustomSeason] = useState('2026/2027');
  const [customSport, setCustomSport] = useState('Football');
  
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
    const l = leagues.find(item => item.id === id) || { name: '', country: 'Global', logo: '' };
    const current = settings[id] || { 
      id, 
      leagueId: id,
      name: l.name,
      country: l.country,
      logo: l.logo,
      enabled: false, 
      featured: false, 
      order: 0, 
      sortOrder: 0,
      customName: '', 
      logoUrl: '', 
      color: '',
      visibleInHome: true,
      visibleInLive: true,
      visibleInSchedule: true
    };
    const enabled = !current.enabled;
    const updated = { ...current, enabled, updatedAt: new Date().toISOString() };
    
    setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
    try {
      await cmsService.updateLeagueSettings(id, updated);
      setSettings(prev => ({ ...prev, [id]: updated as any }));
      setSaveStatus(prev => ({ ...prev, [id]: 'saved' }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [id]: 'idle' })), 1500);
    } catch (e) {
      setSaveStatus(prev => ({ ...prev, [id]: 'failed' }));
    }
  };

  const toggleFeatured = async (id: string) => {
    const l = leagues.find(item => item.id === id) || { name: '', country: 'Global', logo: '' };
    const current = settings[id] || { 
      id, 
      leagueId: id,
      name: l.name,
      country: l.country,
      logo: l.logo,
      enabled: false, 
      featured: false, 
      order: 0, 
      sortOrder: 0,
      customName: '', 
      logoUrl: '', 
      color: '',
      visibleInHome: true,
      visibleInLive: true,
      visibleInSchedule: true
    };
    const featured = !current.featured;
    const updated = { ...current, featured, updatedAt: new Date().toISOString() };

    setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
    try {
      await cmsService.updateLeagueSettings(id, updated);
      setSettings(prev => ({ ...prev, [id]: updated as any }));
      setSaveStatus(prev => ({ ...prev, [id]: 'saved' }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [id]: 'idle' })), 1500);
    } catch (e) {
      setSaveStatus(prev => ({ ...prev, [id]: 'failed' }));
    }
  };

  const toggleVisibility = async (id: string, field: 'visibleInHome' | 'visibleInLive' | 'visibleInSchedule') => {
    const l = leagues.find(item => item.id === id) || { name: '', country: 'Global', logo: '' };
    const current = settings[id] || { 
      id, 
      leagueId: id,
      name: l.name,
      country: l.country,
      logo: l.logo,
      enabled: true, 
      featured: false, 
      order: 0, 
      sortOrder: 0,
      customName: '', 
      logoUrl: '', 
      color: '',
      visibleInHome: true,
      visibleInLive: true,
      visibleInSchedule: true
    };
    const currentVal = current[field] !== false; // defaults to true
    const updated = { ...current, [field]: !currentVal, updatedAt: new Date().toISOString() };

    setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
    try {
      await cmsService.updateLeagueSettings(id, updated);
      setSettings(prev => ({ ...prev, [id]: updated as any }));
      setSaveStatus(prev => ({ ...prev, [id]: 'saved' }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [id]: 'idle' })), 1500);
    } catch (e) {
      setSaveStatus(prev => ({ ...prev, [id]: 'failed' }));
    }
  };

  const handleFieldChange = async (id: string, field: keyof LeagueSettings, value: any) => {
    const l = leagues.find(item => item.id === id) || { name: '', country: 'Global', logo: '' };
    const current = settings[id] || { 
      id, 
      leagueId: id,
      name: l.name,
      country: l.country,
      logo: l.logo,
      enabled: true, 
      featured: false, 
      order: 0, 
      sortOrder: 0,
      customName: '', 
      logoUrl: '', 
      color: '',
      visibleInHome: true,
      visibleInLive: true,
      visibleInSchedule: true
    };
    const updated = { ...current, [field]: value, updatedAt: new Date().toISOString() };
    
    setSettings(prev => ({ ...prev, [id]: updated as any }));
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
        leagueId: customId,
        name: customName,
        logo: customLogo,
        country: customCountry,
        sport: customSport || 'Football',
        season: customSeason || '2026/2027'
      };
      
      await leagueService.saveCustomLeague(newLeague as any);
      
      const newSettings = {
        id: customId,
        leagueId: customId,
        name: customName,
        country: customCountry,
        logo: customLogo,
        sport: customSport || 'Football',
        season: customSeason || '2026/2027',
        enabled: true,
        featured: false,
        order: 0,
        sortOrder: 0,
        visibleInHome: true,
        visibleInLive: true,
        visibleInSchedule: true,
        customName: customName,
        logoUrl: customLogo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await cmsService.updateLeagueSettings(customId, newSettings);
      
      showToast('تمت إضافة البطولة بنجاح', 'success');
      setCustomId('');
      setCustomName('');
      setCustomLogo('');
      setCustomCountry('Global');
      setCustomSeason('2026/2027');
      setCustomSport('Football');
      
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
    
    // Search filter
    const nameSearch = String(l.name).toLowerCase();
    const customSearch = customSetting?.customName ? String(customSetting.customName).toLowerCase() : '';
    const queryStr = searchTerm.toLowerCase();
    const matchesSearch = nameSearch.includes(queryStr) || customSearch.includes(queryStr);

    // Country filter
    const leagueCountry = l.country || 'Global';
    const matchesCountry = !selectedCountry || leagueCountry === selectedCountry;

    // Sport filter
    const leagueSport = customSetting?.sport || l.sport || 'Football';
    const matchesSport = !selectedSport || leagueSport === selectedSport;

    return matchesSearch && matchesCountry && matchesSport;
  });

  const countries = Array.from(new Set(leagues.map(l => l.country || 'Global'))).filter(Boolean).sort() as string[];
  const sports = Array.from(new Set(leagues.map(l => {
    const s = settings[l.id];
    return s?.sport || l.sport || 'Football';
  }))).filter(Boolean).sort() as string[];

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/5 rounded-[2.5rem] p-6">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Trophy className="text-primary" /> مدير البطولات المتقدم
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            إضافة وتعديل وحذف البطولات مباشرة من قاعدة بيانات Firebase للتحكم الكامل. ترتب القائمة بالسحب والإفلات وتتحكم في تفعيل البطولات وظهورها في أجزاء الموقع المختلفة.
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
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-black/40 border border-white/5 p-4 rounded-2xl w-full">
            <div className="relative w-full md:flex-1">
              <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pr-11 pl-4 py-3 bg-white/5 hover:bg-white/10 focus:bg-white/10 rounded-2xl text-xs text-white border border-white/5 focus:border-white/15 focus:outline-none placeholder-gray-500 font-sans text-right"
                placeholder="ابحث عن بطولة ومسابقة لتخصيصها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {/* Country Filter */}
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-2 rounded-2xl border border-white/5 text-xs text-gray-300 w-full md:w-auto">
                <Filter size={12} className="text-gray-400" />
                <select 
                  value={selectedCountry} 
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-transparent text-white outline-none cursor-pointer text-xs min-w-[100px] text-right"
                >
                  <option value="" className="bg-neutral-900 text-white">كل الدول</option>
                  {countries.map(c => (
                    <option key={c} value={c} className="bg-neutral-900 text-white">{c}</option>
                  ))}
                </select>
              </div>

              {/* Sport Filter */}
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-2 rounded-2xl border border-white/5 text-xs text-gray-300 w-full md:w-auto">
                <Filter size={12} className="text-gray-400" />
                <select 
                  value={selectedSport} 
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="bg-transparent text-white outline-none cursor-pointer text-xs min-w-[100px] text-right"
                >
                  <option value="" className="bg-neutral-900 text-white">كل الرياضات</option>
                  {sports.map(s => (
                    <option key={s} value={s} className="bg-neutral-900 text-white">{s}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5 flex items-center justify-center text-xs font-bold font-mono text-white shrink-0">
                {filteredLeagues.length} / {leagues.length}
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
                <p className="text-xs text-gray-500 font-bold">لا يوجد دوريات مطابقة للبحث أو التصفية حالياً.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-white/5 text-gray-400 border-b border-white/5 uppercase select-none">
                      <th className="p-4 px-6 text-right font-black">البطولة والشعار (اسحب للترتيب)</th>
                      <th className="p-4 font-black">الاسم المخصص</th>
                      <th className="p-4 text-center font-black">الظهور العام</th>
                      <th className="p-4 text-center font-black">أماكن العرض بالموقع</th>
                      <th className="p-4 text-center font-black">مميز ⭐</th>
                      <th className="p-4 text-center font-black">الترتيب الرقمي</th>
                      <th className="p-4 text-center font-black">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLeagues.map((l, index) => {
                      const s = (settings[l.id] || { 
                        id: l.id, 
                        enabled: false, 
                        featured: false, 
                        order: 999, 
                        sortOrder: 999,
                        customName: '', 
                        logoUrl: '', 
                        color: '',
                        visibleInHome: true,
                        visibleInLive: true,
                        visibleInSchedule: true,
                        visibleInLeaguePage: true,
                        maxMatches: 5
                      }) as LeagueSettings;
                      const status = saveStatus[l.id] || 'idle';

                      return (
                        <React.Fragment key={l.id}>
                          <tr 
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            className={cn(
                              "hover:bg-white/5 transition-colors align-middle cursor-grab active:cursor-grabbing border-b border-white/5",
                              draggedIndex === index ? "opacity-30 bg-primary/10" : "",
                              s.enabled ? "bg-green-500/[0.01]" : "opacity-60 bg-black/20"
                            )}
                          >
                            <td className="p-4 px-6">
                              <div className="flex items-center gap-2">
                                <div className="text-gray-500 hover:text-white cursor-grab shrink-0 p-1">
                                  <GripVertical size={14} />
                                </div>
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
                                    <span className="text-[10px] text-gray-400 font-medium block mt-0.5">ID: {l.id} | {s.sport || l.sport || 'Football'}</span>
                                  </div>
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
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => toggleVisibility(l.id, 'visibleInHome')} 
                                  className={cn("p-1.5 rounded-xl transition-all flex flex-col items-center gap-1 border border-transparent", s.visibleInHome !== false ? "text-primary bg-primary/10 border-primary/20" : "text-gray-500 bg-white/5 hover:text-gray-400")}
                                  title="عرض في الصفحة الرئيسية"
                                >
                                  <Home size={13} />
                                  <span className="text-[8px] font-bold">الرئيسية</span>
                                </button>
                                <button 
                                  onClick={() => toggleVisibility(l.id, 'visibleInLive')} 
                                  className={cn("p-1.5 rounded-xl transition-all flex flex-col items-center gap-1 border border-transparent", s.visibleInLive !== false ? "text-red-400 bg-red-400/10 border-red-400/20" : "text-gray-500 bg-white/5 hover:text-gray-400")}
                                  title="عرض في المباريات المباشرة"
                                >
                                  <Activity size={13} />
                                  <span className="text-[8px] font-bold">المباشر</span>
                                </button>
                                <button 
                                  onClick={() => toggleVisibility(l.id, 'visibleInSchedule')} 
                                  className={cn("p-1.5 rounded-xl transition-all flex flex-col items-center gap-1 border border-transparent", s.visibleInSchedule !== false ? "text-blue-400 bg-blue-400/10 border-blue-400/20" : "text-gray-500 bg-white/5 hover:text-gray-400")}
                                  title="عرض في جدول المباريات"
                                >
                                  <Calendar size={13} />
                                  <span className="text-[8px] font-bold">الجدول</span>
                                </button>
                              </div>
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
                              
                              <button 
                                onClick={() => setExpandedLeagueId(expandedLeagueId === l.id ? null : l.id)}
                                title="إعدادات المزامنة والربط المتقدمة"
                                className={cn("p-1.5 rounded-xl transition-all flex items-center justify-center", expandedLeagueId === l.id ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-gray-400 hover:bg-white/10")}
                              >
                                <Settings2 size={14} />
                              </button>
                              <button 
                                  onClick={() => handleArabizeLeague(l.id, l.name)} 
                                  disabled={arabizingId === l.id}
                                  title="تعريب البطولة والفرق بالذكاء الاصطناعي"
                                  className={cn("p-1.5 rounded-xl transition-all flex items-center justify-center", arabizingId === l.id ? "bg-primary/10 text-primary animate-pulse" : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20")}>
                                  {arabizingId === l.id ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                              </button>
                              <button onClick={() => handleDeleteLeague(l.id)} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all" title="حذف"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                          {expandedLeagueId === l.id && (
                            <tr className="bg-white/[0.02] border-b border-white/5 font-sans">
                              <td colSpan={7} className="p-5">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-right">
                                  {/* Season field */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 font-bold block">الموسم (Season)</label>
                                    <input 
                                      type="text" 
                                      className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white outline-none focus:border-primary/40 font-mono text-right"
                                      placeholder="مثال: 2026/2027"
                                      value={s.season ?? l.season ?? ''}
                                      onChange={(e) => handleFieldChange(l.id, 'season', e.target.value)}
                                    />
                                  </div>
                                  
                                  {/* Country field */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 font-bold block">الدولة (Country)</label>
                                    <input 
                                      type="text" 
                                      className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white outline-none focus:border-primary/40 text-right"
                                      placeholder="مثال: England"
                                      value={s.country ?? l.country ?? ''}
                                      onChange={(e) => handleFieldChange(l.id, 'country', e.target.value)}
                                    />
                                  </div>

                                  {/* Sport field */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 font-bold block">الرياضة (Sport)</label>
                                    <input 
                                      type="text" 
                                      className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white outline-none focus:border-primary/40 text-right"
                                      placeholder="مثال: Football"
                                      value={s.sport ?? l.sport ?? ''}
                                      onChange={(e) => handleFieldChange(l.id, 'sport', e.target.value)}
                                    />
                                  </div>

                                  {/* Provider field */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 font-bold block">مزود البيانات (Provider)</label>
                                    <select
                                      className="w-full bg-black/40 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white outline-none focus:border-primary/40 text-right cursor-pointer"
                                      value={s.provider ?? 'API-Football'}
                                      onChange={(e) => handleFieldChange(l.id, 'provider', e.target.value)}
                                    >
                                      <option value="API-Football" className="bg-neutral-900 text-white">API-Football</option>
                                      <option value="TheSportsDB" className="bg-neutral-900 text-white">TheSportsDB</option>
                                      <option value="SportMonks" className="bg-neutral-900 text-white">SportMonks</option>
                                      <option value="Custom" className="bg-neutral-900 text-white">Custom (يدوي)</option>
                                      <option value="None" className="bg-neutral-900 text-white">None (معطل)</option>
                                    </select>
                                  </div>
                                </div>
                                
                                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 bg-white/5 p-3 rounded-xl border border-white/5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white">الظهور في صفحة البطولة:</span>
                                    <button 
                                      onClick={() => handleFieldChange(l.id, 'visibleInLeaguePage', s.visibleInLeaguePage !== false ? false : true)}
                                      className={cn("px-2.5 py-1 rounded-lg font-bold transition-all border", s.visibleInLeaguePage !== false ? "bg-primary/10 text-primary border-primary/20" : "bg-white/5 text-gray-400 border-white/5")}
                                    >
                                      {s.visibleInLeaguePage !== false ? 'مفعّل' : 'معطّل'}
                                    </button>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white">الحد الأقصى للمباريات بالصفحة الرئيسية:</span>
                                    <div className="inline-flex items-center gap-1.5 bg-black/20 p-1 rounded-lg border border-white/5">
                                      <button onClick={() => handleFieldChange(l.id, 'maxMatches', Math.max(1, (s.maxMatches ?? 5) - 1))} className="p-0.5 hover:bg-white/5 active:bg-white/10 rounded text-gray-400"><ArrowDown size={11} /></button>
                                      <input 
                                        type="number" 
                                        className="w-8 bg-transparent text-center font-mono text-[11px] font-black text-white focus:outline-none [appearance:textfield]" 
                                        value={s.maxMatches ?? 5} 
                                        onChange={(e) => { const v = parseInt(e.target.value); handleFieldChange(l.id, 'maxMatches', isNaN(v) ? 5 : v); }} 
                                      />
                                      <button onClick={() => handleFieldChange(l.id, 'maxMatches', (s.maxMatches ?? 5) + 1)} className="p-0.5 hover:bg-white/5 active:bg-white/10 rounded text-gray-400"><ArrowUp size={11} /></button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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
              إضافة بطولة جديدة لقاعدة البيانات
            </h3>
            <p className="text-[11px] text-gray-400">ستضاف البطولة إلى جدول Firebase بشكل دائم دون الاعتماد على المزود الخارجي.</p>

            <form onSubmit={handleAddCustomLeague} className="space-y-4 text-right">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">معرف البطولة ID (رقم فريد)</label>
                <input type="text" required placeholder="مثال: c_1001" value={customId} onChange={(e) => setCustomId(e.target.value)} className="w-full bg-black/40 border border-white/15 p-3 rounded-xl text-xs font-bold text-white outline-0 focus:border-primary/50 font-mono text-right" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">اسم البطولة (بالعربية)</label>
                <input type="text" required placeholder="مثال: كأس الملك" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full bg-black/40 border border-white/15 p-3 rounded-xl text-xs font-bold text-white outline-0 focus:border-primary/50 text-right" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold block">الرياضة</label>
                  <input type="text" required placeholder="Football" value={customSport} onChange={(e) => setCustomSport(e.target.value)} className="w-full bg-black/40 border border-white/15 p-3 rounded-xl text-xs font-bold text-white outline-0 focus:border-primary/50 text-right" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold block">الموسم</label>
                  <input type="text" required placeholder="2026/2027" value={customSeason} onChange={(e) => setCustomSeason(e.target.value)} className="w-full bg-black/40 border border-white/15 p-3 rounded-xl text-xs font-bold text-white outline-0 focus:border-primary/50 font-mono text-right" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">الدولة / النطاق</label>
                <input type="text" placeholder="مثال: السعودية (اختياري)" value={customCountry} onChange={(e) => setCustomCountry(e.target.value)} className="w-full bg-black/40 border border-white/15 p-3 rounded-xl text-xs font-bold text-white outline-0 focus:border-primary/50 text-right" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">رابط الشعار URL أو رفعه</label>
                <div className="flex gap-2">
                  <input type="url" required placeholder="https://..." value={customLogo} onChange={(e) => setCustomLogo(e.target.value)} className="flex-1 bg-black/40 border border-white/15 p-3 rounded-xl text-xs font-bold text-white outline-0 focus:border-primary/50 text-right font-mono" />
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
              <strong className="text-white text-xs block mb-1 font-sans">دليل الاستخدام والترتيب بالسحب والإفلات:</strong>
              <ul className="list-disc pr-4 mt-2 space-y-2 font-sans">
                <li>يمكنك ترتيب البطولات بسهولة عن طريق الضغط مطولاً على أي صف ثم سحبه للأعلى أو الأسفل وإفلاته.</li>
                <li>تتيح لك أيقونات (الرئيسية 🏠، المباشر ⚡، الجدول 📅) تحديد الأماكن التي يُسمح للبطولة ومبارياتها بالظهور فيها.</li>
                <li>عند تفعيل بطولة أو تعطيلها، ينعكس ذلك فورياً على كامل الموقع وعمليات جلب المباريات.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
