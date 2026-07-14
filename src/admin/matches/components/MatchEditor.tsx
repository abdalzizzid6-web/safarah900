import React from 'react';
import { ITeam } from '../../../core/api-management/models/team.model';
import { LeagueSettings } from '../../../types';
import { apiManagementRepository } from '../../../core/api-management';
import { useEffect, useState, useRef } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit, X, Star, Trophy, Calendar, CheckSquare, Sparkles, Layers, Activity, Search, ShieldCheck, Lock, AlertCircle, Save, Clock, Upload, RefreshCw } from 'lucide-react';
import { useMatchLock } from '../hooks/useMatchLock';
import { useAutoSave } from '../hooks/useAutoSave';
import { MatchStatus } from '../services/matchEnterpriseService';
import { cn } from '@/lib/utils';
import { uploadImage } from '../../../services/imagekitService';

interface MatchModalProps {
  showMatchModal: boolean;
  setShowMatchModal: (show: boolean) => void;
  modalType: 'add' | 'edit';
  formData: any;
  setFormData: (data: any) => void;
  handleSaveMatch: (e: React.FormEvent) => void;
}

const ImageUploadField: React.FC<{
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
}> = ({ label, value, onChange, folder }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImage(file, folder);
      onChange(res.url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">{label}</label>
      <div 
        className={cn(
          "relative border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center transition-all cursor-pointer text-center",
          dragActive ? "border-primary bg-primary/10" : "border-white/10 bg-black/20 hover:border-white/20",
          value ? "py-2" : "py-4"
        )}
        onDragEnter={onDrag}
        onDragOver={onDrag}
        onDragLeave={onDrag}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-1.5 text-xs text-gray-400">
            <RefreshCw className="animate-spin text-primary" size={16} />
            <span>جاري الرفع...</span>
          </div>
        ) : value ? (
          <div className="flex items-center gap-3 w-full">
            <img src={value} alt="Logo" className="w-8 h-8 object-contain bg-black/40 rounded p-1" referrerPolicy="no-referrer" />
            <div className="flex-1 text-[10px] text-gray-400 truncate text-left dir-ltr">{value}</div>
            <button 
              type="button"
              className="text-[10px] bg-red-500/10 text-red-500 font-bold px-2 py-1 rounded hover:bg-red-500/20"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            >
              حذف
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-500">
            <Upload size={16} className="text-gray-400" />
            <span className="text-[10px] font-bold">اسحب الصورة هنا أو اضغط للاختيار</span>
          </div>
        )}
      </div>
    </div>
  );
};

export function MatchModal({
  showMatchModal,
  setShowMatchModal,
  modalType,
  formData,
  setFormData,
  handleSaveMatch
}: MatchModalProps) {
  const { lock, isLockedByOther, loading: lockLoading } = useMatchLock(showMatchModal && modalType === 'edit' ? formData.id : null);
  const { lastSaved, recover, clear } = useAutoSave(showMatchModal ? `match_${formData.id || 'new'}` : '', formData);

  const [teams, setTeams] = useState<ITeam[]>([]);
  const [leagues, setLeagues] = useState<LeagueSettings[]>([]);

  const [isCustomMatch, setIsCustomMatch] = useState(false);
  const [homeSearch, setHomeSearch] = useState('');
  const [awaySearch, setAwaySearch] = useState('');
  const [leagueSearch, setLeagueSearch] = useState('');
  const [showHomeResults, setShowHomeResults] = useState(false);
  const [showAwayResults, setShowAwayResults] = useState(false);
  const [showLeagueResults, setShowLeagueResults] = useState(false);

  useEffect(() => {
    if (showMatchModal) {
      apiManagementRepository.teamRepository.getTeams().then(data => setTeams(data));
      apiManagementRepository.leagueRepository.getLeagues().then(data => setLeagues(data));
    }
  }, [showMatchModal]);

  useEffect(() => {
    if (showMatchModal) {
      setHomeSearch(formData.homeTeamName || '');
      setAwaySearch(formData.awayTeamName || '');
      setLeagueSearch(formData.leagueName || '');
      
      const custom = formData.homeTeamId === 'custom' || formData.awayTeamId === 'custom' || formData.leagueId === 'custom';
      setIsCustomMatch(custom);
    }
  }, [showMatchModal, formData.homeTeamName, formData.awayTeamName, formData.leagueName, formData.homeTeamId, formData.awayTeamId, formData.leagueId]);

  const handleHomeTeamChange = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setFormData({ ...formData, homeTeamId: team.id, homeTeamName: team.nameAR, homeTeamLogo: team.logo });
    } else {
      setFormData({ ...formData, homeTeamId: 'custom', homeTeamName: '', homeTeamLogo: '' });
    }
  };

  const handleAwayTeamChange = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setFormData({ ...formData, awayTeamId: team.id, awayTeamName: team.nameAR, awayTeamLogo: team.logo });
    } else {
      setFormData({ ...formData, awayTeamId: 'custom', awayTeamName: '', awayTeamLogo: '' });
    }
  };

  const handleLeagueChange = (leagueId: string) => {
    const league = leagues.find(l => l.id === leagueId);
    if (league) {
      setFormData({ ...formData, leagueId: league.id, leagueName: league.name, leagueLogo: league.logo });
    } else {
      setFormData({ ...formData, leagueId: 'custom', leagueName: '', leagueLogo: '' });
    }
  };

  const handleRecover = () => {
    const saved = recover();
    if (saved) {
      setFormData(saved);
    }
  };

  return (
    <AnimatePresence>
        {showMatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMatchModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 shadow-2xl relative z-10 font-sans"
              style={{ direction: 'rtl' }}
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    {modalType === 'add' ? <Plus size={20} className="text-green-500" /> : <Edit size={20} className="text-blue-500" />}
                    {modalType === 'add' ? 'إضافة مباراة جديدة يدوياً' : 'تعديل تفاصيل المباراة'}
                    {modalType === 'edit' && formData.version && (
                      <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full font-mono">الإصدار {formData.version}</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-xs text-gray-400">تعبئة مواصفات الحدث الرياضي وتجهيز السيرفرات والبث التلفزيوني</p>
                    {lastSaved && (
                      <span className="text-[9px] text-gray-600 flex items-center gap-1">
                        <Clock size={10} />
                        تم الحفظ تلقائياً {lastSaved.toLocaleTimeString('ar-SA')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleRecover}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black border border-amber-500/20"
                    title="استعادة آخر نسخة محفوظة تلقائياً"
                  >
                    <Save size={12} />
                    استعادة المسودة
                  </button>
                  <button 
                    onClick={() => setShowMatchModal(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Conflict Detection Warning */}
              {isLockedByOther && lock && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                  <Lock className="text-red-500" size={24} />
                  <div>
                    <h4 className="text-sm font-black text-red-500">تنبيه: المباراة قيد التعديل حالياً</h4>
                    <p className="text-xs text-red-400">يقوم {lock.userName} بتعديل هذه المباراة الآن. قد تفقد تعديلاتك إذا قمت بالحفظ.</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSaveMatch} className="space-y-6">
                
                {/* Custom Match Toggle Option */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white">تفعيل مباراة مخصصة (Custom Match)</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">قم بتفعيل هذا الخيار لإدخال أسماء الفرق والشعارات والبطولة يدوياً بدلاً من الاختيار من قاعدة البيانات</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextCustom = !isCustomMatch;
                      setIsCustomMatch(nextCustom);
                      if (nextCustom) {
                        setFormData({ ...formData, homeTeamId: 'custom', awayTeamId: 'custom', leagueId: 'custom' });
                      } else {
                        setFormData({
                          ...formData,
                          homeTeamId: teams[0]?.id || 'custom',
                          homeTeamName: teams[0]?.nameAR || '',
                          homeTeamLogo: teams[0]?.logo || '',
                          awayTeamId: teams[1]?.id || 'custom',
                          awayTeamName: teams[1]?.nameAR || '',
                          awayTeamLogo: teams[1]?.logo || '',
                          leagueId: leagues[0]?.id || 'custom',
                          leagueName: leagues[0]?.name || '',
                          leagueLogo: leagues[0]?.logo || ''
                        });
                      }
                    }}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative p-1 duration-300",
                      isCustomMatch ? "bg-primary" : "bg-neutral-800 border border-white/10"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-black transition-all duration-300",
                      isCustomMatch ? "mr-6" : "mr-0"
                    )} />
                  </button>
                </div>

                {/* Section 1: Teams Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-primary border-r-2 border-primary pr-2">معلومات الناديين المتنافسين</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Home Team */}
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full">الفريق المستضيف (Home)</span>
                      
                      {isCustomMatch ? (
                        <>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-400 mb-1.5">اسم النادي</label>
                            <input 
                              type="text"
                              required
                              placeholder="مثال: الهلال، ريال مدريد"
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                              value={formData.homeTeamName || ''}
                              onChange={e => setFormData({ ...formData, homeTeamName: e.target.value })}
                            />
                          </div>
                          <ImageUploadField 
                            label="شعار النادي"
                            value={formData.homeTeamLogo || ''}
                            onChange={url => setFormData({ ...formData, homeTeamLogo: url })}
                            folder="teams"
                          />
                        </>
                      ) : (
                        <div className="relative">
                          <label className="block text-[11px] font-bold text-gray-400 mb-1.5">اختيار الفريق المستضيف</label>
                          <div className="relative">
                            <Search className="absolute right-3 top-3 text-gray-500" size={14} />
                            <input
                              type="text"
                              placeholder="ابحث عن الفريق المستضيف..."
                              className="w-full bg-black/40 border border-white/10 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white focus:border-primary outline-none transition-all font-bold"
                              value={homeSearch}
                              onChange={e => {
                                setHomeSearch(e.target.value);
                                setShowHomeResults(true);
                              }}
                              onFocus={() => setShowHomeResults(true)}
                              onBlur={() => setTimeout(() => setShowHomeResults(false), 200)}
                            />
                          </div>
                          
                          {showHomeResults && (
                            <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-zinc-900 border border-white/10 rounded-xl shadow-2xl divide-y divide-white/5">
                              {teams
                                .filter(t => t.nameAR.includes(homeSearch) || t.nameEN.toLowerCase().includes(homeSearch.toLowerCase()))
                                .map(t => (
                                  <button
                                    key={t.id}
                                    type="button"
                                    className="w-full text-right px-4 py-2.5 text-xs text-white hover:bg-primary/20 flex items-center gap-2 transition-all"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        homeTeamId: t.id,
                                        homeTeamName: t.nameAR,
                                        homeTeamLogo: t.logo,
                                        stadium: t.stadium || formData.stadium
                                      });
                                      setHomeSearch(t.nameAR);
                                      setShowHomeResults(false);
                                    }}
                                  >
                                    <img src={t.logo} alt="" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                                    <div className="font-bold text-right">{t.nameAR}</div>
                                    <div className="text-[10px] text-gray-500">{t.nameEN}</div>
                                  </button>
                                ))}
                              {teams.filter(t => t.nameAR.includes(homeSearch) || t.nameEN.toLowerCase().includes(homeSearch.toLowerCase())).length === 0 && (
                                <div className="p-3 text-[10px] text-gray-500 text-center">لا توجد فرق تطابق البحث</div>
                              )}
                            </div>
                          )}

                          {formData.homeTeamName && (
                            <div className="mt-3 flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                              <img src={formData.homeTeamLogo} alt="" className="w-8 h-8 object-contain bg-black/40 rounded p-1" referrerPolicy="no-referrer" />
                              <div className="flex-1">
                                <div className="text-xs font-black text-white">{formData.homeTeamName}</div>
                                <div className="text-[9px] text-gray-500">تم الاختيار بنجاح</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded-full">الفريق الضيف (Away)</span>
                      
                      {isCustomMatch ? (
                        <>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-400 mb-1.5">اسم النادي</label>
                            <input 
                              type="text"
                              required
                              placeholder="مثال: النصر، برشلونة"
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                              value={formData.awayTeamName || ''}
                              onChange={e => setFormData({ ...formData, awayTeamName: e.target.value })}
                            />
                          </div>
                          <ImageUploadField 
                            label="شعار النادي"
                            value={formData.awayTeamLogo || ''}
                            onChange={url => setFormData({ ...formData, awayTeamLogo: url })}
                            folder="teams"
                          />
                        </>
                      ) : (
                        <div className="relative">
                          <label className="block text-[11px] font-bold text-gray-400 mb-1.5">اختيار الفريق الضيف</label>
                          <div className="relative">
                            <Search className="absolute right-3 top-3 text-gray-500" size={14} />
                            <input
                              type="text"
                              placeholder="ابحث عن الفريق الضيف..."
                              className="w-full bg-black/40 border border-white/10 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white focus:border-primary outline-none transition-all font-bold"
                              value={awaySearch}
                              onChange={e => {
                                setAwaySearch(e.target.value);
                                setShowAwayResults(true);
                              }}
                              onFocus={() => setShowAwayResults(true)}
                              onBlur={() => setTimeout(() => setShowAwayResults(false), 200)}
                            />
                          </div>
                          
                          {showAwayResults && (
                            <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-zinc-900 border border-white/10 rounded-xl shadow-2xl divide-y divide-white/5">
                              {teams
                                .filter(t => t.nameAR.includes(awaySearch) || t.nameEN.toLowerCase().includes(awaySearch.toLowerCase()))
                                .map(t => (
                                  <button
                                    key={t.id}
                                    type="button"
                                    className="w-full text-right px-4 py-2.5 text-xs text-white hover:bg-primary/20 flex items-center gap-2 transition-all"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        awayTeamId: t.id,
                                        awayTeamName: t.nameAR,
                                        awayTeamLogo: t.logo
                                      });
                                      setAwaySearch(t.nameAR);
                                      setShowAwayResults(false);
                                    }}
                                  >
                                    <img src={t.logo} alt="" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                                    <div className="font-bold text-right">{t.nameAR}</div>
                                    <div className="text-[10px] text-gray-500">{t.nameEN}</div>
                                  </button>
                                ))}
                              {teams.filter(t => t.nameAR.includes(awaySearch) || t.nameEN.toLowerCase().includes(awaySearch.toLowerCase())).length === 0 && (
                                <div className="p-3 text-[10px] text-gray-500 text-center">لا توجد فرق تطابق البحث</div>
                              )}
                            </div>
                          )}

                          {formData.awayTeamName && (
                            <div className="mt-3 flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                              <img src={formData.awayTeamLogo} alt="" className="w-8 h-8 object-contain bg-black/40 rounded p-1" referrerPolicy="no-referrer" />
                              <div className="flex-1">
                                <div className="text-xs font-black text-white">{formData.awayTeamName}</div>
                                <div className="text-[9px] text-gray-500">تم الاختيار بنجاح</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Match Timing & Status */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-primary border-r-2 border-primary pr-2">مواعيد وتوقيت وحالة اللقاء</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <div className="relative">
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">البطولة / الدوري</label>
                      {isCustomMatch ? (
                        <>
                          <input 
                            type="text"
                            required
                            placeholder="اسم البطولة"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-primary outline-none transition-all font-bold mb-2"
                            value={formData.leagueName || ''}
                            onChange={e => setFormData({ ...formData, leagueName: e.target.value })}
                          />
                          <ImageUploadField 
                            label="شعار البطولة"
                            value={formData.leagueLogo || ''}
                            onChange={url => setFormData({ ...formData, leagueLogo: url })}
                            folder="leagues"
                          />
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <Search className="absolute right-3 top-3 text-gray-500" size={14} />
                            <input
                              type="text"
                              placeholder="ابحث عن البطولة..."
                              className="w-full bg-black/40 border border-white/10 rounded-xl pr-9 pl-3 py-2.5 text-xs text-white focus:border-primary outline-none transition-all font-bold mb-2"
                              value={leagueSearch}
                              onChange={e => {
                                setLeagueSearch(e.target.value);
                                setShowLeagueResults(true);
                              }}
                              onFocus={() => setShowLeagueResults(true)}
                              onBlur={() => setTimeout(() => setShowLeagueResults(false), 200)}
                            />
                          </div>
                          
                          {showLeagueResults && (
                            <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-zinc-900 border border-white/10 rounded-xl shadow-2xl divide-y divide-white/5">
                              {leagues
                                .filter(l => l.name.includes(leagueSearch))
                                .map(l => (
                                  <button
                                    key={l.id}
                                    type="button"
                                    className="w-full text-right px-4 py-2.5 text-xs text-white hover:bg-primary/20 flex items-center gap-2 transition-all"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        leagueId: l.id,
                                        leagueName: l.name,
                                        leagueLogo: l.logo
                                      });
                                      setLeagueSearch(l.name);
                                      setShowLeagueResults(false);
                                    }}
                                  >
                                    <img src={l.logo} alt="" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                                    <div className="font-bold text-right">{l.name}</div>
                                  </button>
                                ))}
                              {leagues.filter(l => l.name.includes(leagueSearch)).length === 0 && (
                                <div className="p-3 text-[10px] text-gray-500 text-center">لا توجد بطولات تطابق البحث</div>
                              )}
                            </div>
                          )}

                          {formData.leagueName && (
                            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 p-2 rounded-xl">
                              <img src={formData.leagueLogo} alt="" className="w-6 h-6 object-contain bg-black/40 rounded p-1" referrerPolicy="no-referrer" />
                              <div className="text-[10px] font-black text-white truncate">{formData.leagueName}</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">موعد وركلة البداية</label>
                      <input 
                        type="datetime-local"
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-primary outline-none transition-all font-bold"
                        value={formData.startTime || ''}
                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">حالة اللقاء الحالية</label>
                      <select 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-primary outline-none transition-all font-bold"
                        value={formData.status || ''}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="UPCOMING">لم تبدأ (UPCOMING)</option>
                        <option value="LIVE">مباشر الآن (LIVE)</option>
                        <option value="FINISHED">منتهية (FINISHED)</option>
                        <option value="FT">منتهية (FT)</option>
                        <option value="HT">استراحة بين الشوطين (HT)</option>
                        <option value="NS">لم تبدأ بعد (NS)</option>
                        <option value="CANC">ملغاة (CANC)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-500/80 mb-1.5">حالة العمل التحريري (Workflow)</label>
                      <select 
                        className="w-full bg-black/40 border border-amber-500/20 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-500 outline-none transition-all font-bold"
                        value={formData.editorialStatus || MatchStatus.Draft}
                        onChange={e => setFormData({ ...formData, editorialStatus: e.target.value })}
                      >
                        {Object.values(MatchStatus).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Scores, Commentary, Stadium & Referee */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-primary border-r-2 border-primary pr-2">الأهداف، القنوات، المعلق، الملعب والحكم</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">أهداف المستضيف</label>
                      <input 
                        type="number"
                        min="0"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-primary outline-none transition-all font-mono font-bold"
                        value={formData.homeScore ?? 0}
                        onChange={e => setFormData({ ...formData, homeScore: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">أهداف الضيف</label>
                      <input 
                        type="number"
                        min="0"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-primary outline-none transition-all font-mono font-bold"
                        value={formData.awayScore ?? 0}
                        onChange={e => setFormData({ ...formData, awayScore: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">القناة الناقلة</label>
                      <input 
                        type="text"
                        placeholder="مثال: beIN Sports 1 HD"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                        value={formData.channel || ''}
                        onChange={e => setFormData({ ...formData, channel: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">معلق المباراة</label>
                      <input 
                        type="text"
                        placeholder="مثال: عصام الشوالي"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                        value={formData.commentator || ''}
                        onChange={e => setFormData({ ...formData, commentator: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">استاد المباراة (Stadium)</label>
                      <input 
                        type="text"
                        placeholder="مثال: استاد الملك فهد الدولي"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                        value={formData.stadium || ''}
                        onChange={e => setFormData({ ...formData, stadium: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">حكم اللقاء (Referee)</label>
                      <input 
                        type="text"
                        placeholder="مثال: جهاد جريشة"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                        value={formData.referee || ''}
                        onChange={e => setFormData({ ...formData, referee: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Live broadcast stream details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-primary border-r-2 border-primary pr-2">رابط البث المباشر (Streaming Links)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">رابط البث المباشر (m3u8, iframe, youtube or stream URL) <span className="text-[10px] text-green-500 font-normal">(Change Match URL)</span></label>
                      <input 
                        type="text"
                        placeholder="مثال: https://server.com/live/stream.m3u8 أو كود الآيفريم iframe"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-mono"
                        value={formData.streamUrl || ''}
                        onChange={e => setFormData({ ...formData, streamUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">اسم السيرفر / القناة</label>
                      <input 
                        type="text"
                        required
                        placeholder="مثال: سيرفر رئيسي FHD"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                        value={formData.streamLabel || ''}
                        onChange={e => setFormData({ ...formData, streamLabel: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">رابط بديل يوتيوب (اختياري)</label>
                      <input 
                        type="text"
                        placeholder="مثال: https://youtube.com/watch?v=..."
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-mono"
                        value={formData.youtubeLink || ''}
                        onChange={e => setFormData({ ...formData, youtubeLink: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Premium Featured Match Settings */}
                <div className="space-y-4 border border-amber-500/20 bg-amber-500/[0.02] p-5 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                    <h4 className="text-xs font-black text-amber-500">تمكين وتخصيص المباراة المميزة (⭐⭐ Featured Match ⭐⭐)</h4>
                  </div>
                  <p className="text-[10px] text-gray-400">تحكم بظهور المباراة في شريط الأضواء الفاخر والمباريات المثبتة في أعلى الصفحة الرئيسية لقنوات سفراء 90</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Toggle: Is Featured */}
                    <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-white/5 rounded-xl">
                      <div>
                        <span className="block text-xs font-bold text-white">تمييز المباراة (Featured)</span>
                        <span className="text-[9px] text-gray-500">عرض المباراة كحدث هام</span>
                      </div>
                      <input 
                        type="checkbox"
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                        checked={formData.isFeatured}
                        onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                      />
                    </div>

                    {/* Toggle: Featured Enabled */}
                    <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-white/5 rounded-xl">
                      <div>
                        <span className="block text-xs font-bold text-white">حالة التمكين الفعال</span>
                        <span className="text-[9px] text-gray-500 text-amber-500">مفعل / معطل مؤقت</span>
                      </div>
                      <input 
                        type="checkbox"
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                        checked={formData.featuredEnabled}
                        onChange={e => setFormData({ ...formData, featuredEnabled: e.target.checked })}
                      />
                    </div>

                    {/* Toggle: Pinned Match */}
                    <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-white/5 rounded-xl">
                      <div>
                        <span className="block text-xs font-bold text-white">تثبيت في المقدمة (Pin)</span>
                        <span className="text-[9px] text-gray-500">تثبيت دائم في أول العرض</span>
                      </div>
                      <input 
                        type="checkbox"
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                        checked={formData.featuredPinned}
                        onChange={e => setFormData({ ...formData, featuredPinned: e.target.checked })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Display Order / Priority */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">ترتيب العرض والأولوية (Order) <span className="text-amber-500 font-mono">(100-0)</span></label>
                      <input 
                        type="number"
                        placeholder="أرقام أعلى = تظهر أولاً"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-amber-500 outline-none transition-all font-mono"
                        value={formData.featuredPriority ?? 0}
                        onChange={e => setFormData({ ...formData, featuredPriority: Number(e.target.value) })}
                      />
                    </div>

                    {/* Featured Start Date */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">بداية ظهور التميز (Start Date)</label>
                      <input 
                        type="datetime-local"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none transition-all font-mono"
                        value={formData.featuredStartDate || ''}
                        onChange={e => setFormData({ ...formData, featuredStartDate: e.target.value })}
                      />
                    </div>

                    {/* Featured End Date */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">نهاية ظهور التميز (End Date)</label>
                      <input 
                        type="datetime-local"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none transition-all font-mono"
                        value={formData.featuredEndDate || ''}
                        onChange={e => setFormData({ ...formData, featuredEndDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 5: SEO and Metadata */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-primary border-r-2 border-primary pr-2">تهيئة محركات البحث (SEO & Metadata)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">عنوان السيو (Meta Title)</label>
                      <input 
                        type="text"
                        placeholder="مثال: الهلال ضد النصر بث مباشر - دوري روشن"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                        value={formData.seoTitle || ''}
                        onChange={e => setFormData({ ...formData, seoTitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">كلمات رئيسية (Keywords)</label>
                      <input 
                        type="text"
                        placeholder="مثال: الهلال, النصر, بث مباشر, دوري روشن"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                        value={formData.seoKeywords || ''}
                        onChange={e => setFormData({ ...formData, seoKeywords: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1.5">وصف السيو (Meta Description)</label>
                      <textarea 
                        rows={1}
                        placeholder="وصف مختصر لصفحة المباراة يظهر في محركات البحث وجوجل..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:border-primary outline-none transition-all font-bold"
                        value={formData.seoDescription || ''}
                        onChange={e => setFormData({ ...formData, seoDescription: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Bar */}
                <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-6 mt-4">
                  <button 
                    type="button"
                    onClick={() => setShowMatchModal(false)}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl transition-all text-xs font-black cursor-pointer"
                  >
                    إلغاء وإغلاق
                  </button>
                  <button 
                    type="submit"
                    disabled={isLockedByOther}
                    className={cn(
                      "px-6 py-3 rounded-2xl transition-all text-xs font-black shadow-lg cursor-pointer hover:scale-[1.02]",
                      isLockedByOther ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-black shadow-green-500/15"
                    )}
                  >
                    {modalType === 'add' ? 'إضافة ونشر المباراة الآن' : 'حفظ التعديلات وتحديث لقاء البث'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
  );
}
