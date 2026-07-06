import React, { useState } from 'react';
import { 
  Search, Eye, Trash2, Pin, Heart, Download, Copy, Edit3, X, Info, Check, 
  Link as LinkIcon, User, Shield, Trophy, Activity, Globe, Grid, List, Sparkles, AlertTriangle
} from 'lucide-react';
import { MediaAsset, MediaType, MediaFolder, MediaCollection } from '../types';

interface MediaLibraryViewProps {
  assets: MediaAsset[];
  folders: MediaFolder[];
  collections: MediaCollection[];
  onUpdateAsset: (id: string, updates: Partial<MediaAsset>) => Promise<void>;
  onDeleteAsset: (id: string) => Promise<void>;
  onFolderSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
}

export default function MediaLibraryView({
  assets,
  folders,
  collections,
  onUpdateAsset,
  onDeleteAsset,
  onFolderSelect,
  selectedFolderId
}: MediaLibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType | 'all'>('all');
  const [selectedCollection, setSelectedCollection] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeAsset, setActiveAsset] = useState<MediaAsset | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit fields state
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<MediaType>('Images');
  const [editTags, setEditTags] = useState('');
  const [linkPlayerId, setLinkPlayerId] = useState('');
  const [linkPlayerName, setLinkPlayerName] = useState('');
  const [linkTeamId, setLinkTeamId] = useState('');
  const [linkTeamName, setLinkTeamName] = useState('');

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleOpenDetails = (asset: MediaAsset) => {
    setActiveAsset(asset);
    setEditName(asset.name);
    setEditType(asset.mediaType);
    setEditTags(asset.tags.join(', '));
    setIsEditing(false);
  };

  const handleSaveMetadata = async () => {
    if (!activeAsset) return;
    const tagsArray = editTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    await onUpdateAsset(activeAsset.id, {
      name: editName,
      mediaType: editType,
      tags: tagsArray
    });

    // Update locally displayed active asset
    setActiveAsset(prev => prev ? { ...prev, name: editName, mediaType: editType, tags: tagsArray } : null);
    setIsEditing(false);
  };

  const handleAddPlayerLink = async () => {
    if (!activeAsset || !linkPlayerId || !linkPlayerName) return;
    const currentLinks = activeAsset.smartLinks || { players: [], teams: [], competitions: [], matches: [], news: [] };
    const players = [...(currentLinks.players || [])];
    if (!players.some(p => p.id === linkPlayerId)) {
      players.push({ id: linkPlayerId, name: linkPlayerName });
    }

    const updatedLinks = { ...currentLinks, players };
    await onUpdateAsset(activeAsset.id, { smartLinks: updatedLinks });
    setActiveAsset(prev => prev ? { ...prev, smartLinks: updatedLinks } : null);
    setLinkPlayerId('');
    setLinkPlayerName('');
  };

  const handleAddTeamLink = async () => {
    if (!activeAsset || !linkTeamId || !linkTeamName) return;
    const currentLinks = activeAsset.smartLinks || { players: [], teams: [], competitions: [], matches: [], news: [] };
    const teams = [...(currentLinks.teams || [])];
    if (!teams.some(t => t.id === linkTeamId)) {
      teams.push({ id: linkTeamId, name: linkTeamName });
    }

    const updatedLinks = { ...currentLinks, teams };
    await onUpdateAsset(activeAsset.id, { smartLinks: updatedLinks });
    setActiveAsset(prev => prev ? { ...prev, smartLinks: updatedLinks } : null);
    setLinkTeamId('');
    setLinkTeamName('');
  };

  const handleRemoveLink = async (type: 'players' | 'teams', itemId: string) => {
    if (!activeAsset) return;
    const currentLinks = activeAsset.smartLinks;
    const list = [...(currentLinks[type] || [])];
    const filtered = list.filter((item: any) => item.id !== itemId);

    const updatedLinks = { ...currentLinks, [type]: filtered };
    await onUpdateAsset(activeAsset.id, { smartLinks: updatedLinks });
    setActiveAsset(prev => prev ? { ...prev, smartLinks: updatedLinks } : null);
  };

  const toggleFavorite = async (asset: MediaAsset) => {
    const isFav = !asset.isFavorite;
    await onUpdateAsset(asset.id, { isFavorite: isFav });
    if (activeAsset?.id === asset.id) {
      setActiveAsset(prev => prev ? { ...prev, isFavorite: isFav } : null);
    }
  };

  const togglePin = async (asset: MediaAsset) => {
    const isPinned = !asset.isPinned;
    await onUpdateAsset(asset.id, { isPinned });
    if (activeAsset?.id === asset.id) {
      setActiveAsset(prev => prev ? { ...prev, isPinned } : null);
    }
  };

  // Filter & Search Engine logic
  const filteredAssets = assets.filter(asset => {
    // 1. Search Query Match
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Folder Match
    const matchesFolder = selectedFolderId === null || asset.folderId === selectedFolderId;

    // 3. Media Type Match
    const matchesType = selectedMediaType === 'all' || asset.mediaType === selectedMediaType;

    // 4. Collection/Album Match
    let matchesCollection = true;
    if (selectedCollection !== 'all') {
      const coll = collections.find(c => c.id === selectedCollection);
      if (coll) {
        if (coll.isSmart && coll.smartRules) {
          const ruleTags = coll.smartRules.tags || [];
          const ruleType = coll.smartRules.mediaType;
          
          const tagsMatch = ruleTags.length === 0 || ruleTags.some(t => asset.tags.includes(t));
          const typeMatch = !ruleType || asset.mediaType === ruleType;
          matchesCollection = tagsMatch && typeMatch;
        } else {
          matchesCollection = asset.collectionIds?.includes(selectedCollection);
        }
      }
    }

    return matchesSearch && matchesFolder && matchesType && matchesCollection;
  });

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Search and Quick Filters Strip */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-[#111112] p-4 rounded-2xl border border-white/5">
        <div className="relative w-full lg:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم الأصل الرقمي، وسم الذكاء الاصطناعي..."
            className="w-full pr-11 pl-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center justify-start lg:justify-end">
          {/* MediaType Filter */}
          <select
            value={selectedMediaType}
            onChange={(e) => setSelectedMediaType(e.target.value as MediaType | 'all')}
            className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">كل الأنواع والوسائط</option>
            <option value="Images">الصور العامة</option>
            <option value="Logos">الشعارات والرموز</option>
            <option value="Player Photos">صور اللاعبين</option>
            <option value="Team Logos">شعارات الأندية</option>
            <option value="Competition Logos">شعارات البطولات</option>
            <option value="Stadium Images">صور الملاعب</option>
            <option value="Backgrounds">خلفيات المنصة</option>
            <option value="Videos">مقاطع فيديو</option>
            <option value="SVG">ملفات SVG</option>
          </select>

          {/* Collection Filter */}
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">كل الألبومات والمجموعات</option>
            {collections.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.isSmart ? '(ذكي)' : ''}</option>
            ))}
          </select>

          {/* Folder Filter Reset indicator */}
          {selectedFolderId && (
            <button
              onClick={() => onFolderSelect(null)}
              className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl flex items-center gap-1 hover:bg-amber-500/20"
            >
              <span>تصفية المجلد نشطة</span>
              <X size={12} />
            </button>
          )}

          {/* Grid/List View switcher */}
          <div className="flex bg-black border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Asset Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className={`lg:col-span-3 space-y-4`}>
          {filteredAssets.length === 0 ? (
            <div className="bg-[#111112] border border-white/5 p-16 rounded-3xl text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-500">
                <Info size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">لا توجد ملفات مطابقة</h4>
                <p className="text-xs text-gray-400 mt-1">تأكد من كلمات البحث، أو أزل تصفية المجلدات والألبومات لرؤية كامل الأصول.</p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredAssets.map(asset => (
                <div 
                  key={asset.id} 
                  className={`
                    bg-[#111112] border rounded-2xl overflow-hidden group hover:border-white/10 transition-all flex flex-col justify-between
                    ${activeAsset?.id === asset.id ? 'border-amber-500/60 ring-1 ring-amber-500/20' : 'border-white/5'}
                  `}
                >
                  {/* Thumbnail stage */}
                  <div className="aspect-video bg-[#0c0c0d] relative overflow-hidden flex items-center justify-center">
                    {/* Tiny dominant color accent background */}
                    <div className="absolute inset-0 opacity-10 transition-all" style={{ backgroundColor: asset.dominantColor }} />
                    
                    {asset.mediaType === 'Videos' ? (
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-amber-500">
                        <Activity size={20} />
                      </div>
                    ) : (
                      <img 
                        src={asset.urls.thumbnail || asset.url} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                    )}

                    {/* Quick overlay options */}
                    <div className="absolute top-2.5 right-2.5 left-2.5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleFavorite(asset)}
                          className={`p-1.5 rounded-lg border backdrop-blur-md transition-all ${asset.isFavorite ? 'bg-red-500 border-red-500 text-white' : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'}`}
                        >
                          <Heart size={12} fill={asset.isFavorite ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={() => togglePin(asset)}
                          className={`p-1.5 rounded-lg border backdrop-blur-md transition-all ${asset.isPinned ? 'bg-blue-500 border-blue-500 text-white' : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'}`}
                        >
                          <Pin size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white border border-red-500/20 backdrop-blur-md transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[8px] font-black text-gray-300">
                      {asset.width > 0 ? `${asset.width}x${asset.height}` : asset.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                    </div>
                  </div>

                  {/* Details card info */}
                  <div className="p-3.5 space-y-2 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          {asset.mediaType}
                        </span>
                        <span className="text-[9px] text-gray-500 font-bold">
                          {(asset.fileSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white mt-1.5 line-clamp-1 group-hover:text-amber-500 transition-colors">
                        {asset.name}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-white/[0.03] flex items-center justify-between">
                      <button
                        onClick={() => handleOpenDetails(asset)}
                        className="text-[10px] font-black text-gray-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>تفاصيل الاستوديو</span>
                      </button>

                      <button
                        onClick={() => handleCopyLink(asset.url, asset.id)}
                        className="text-gray-500 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="نسخ رابط CDN"
                      >
                        {copiedId === asset.id ? <Check size={14} className="text-emerald-400 animate-pulse" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-[#111112] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
              {filteredAssets.map(asset => (
                <div key={asset.id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-all">
                  <div className="flex items-center gap-3">
                    <img src={asset.urls.thumbnail || asset.url} alt="" className="w-10 h-10 object-cover rounded-lg bg-black border border-white/10" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="text-xs font-black text-white">{asset.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-bold">
                        {asset.fileName} • {(asset.fileSize / 1024).toFixed(1)} KB • {asset.width}x{asset.height}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                      {asset.mediaType}
                    </span>

                    <button
                      onClick={() => handleOpenDetails(asset)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all"
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      onClick={() => handleCopyLink(asset.url, asset.id)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-emerald-400 rounded-lg transition-all"
                    >
                      {copiedId === asset.id ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    <button
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all border border-red-500/10"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar details panels & smart associations */}
        <div className="space-y-6">
          {activeAsset ? (
            <div className="bg-[#111112] border border-white/5 rounded-2xl p-4.5 space-y-5">
              {/* Header and Quick controls */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider block">فاحص الأصول الرقمية</span>
                  <h4 className="text-xs font-black text-white mt-0.5 truncate max-w-[150px]">{activeAsset.name}</h4>
                </div>
                <button
                  onClick={() => setActiveAsset(null)}
                  className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Dominant Color Swatches */}
              <div className="flex gap-2 items-center bg-black/40 p-2.5 rounded-xl border border-white/[0.03]">
                <div className="w-8 h-8 rounded-lg shadow border border-white/10" style={{ backgroundColor: activeAsset.dominantColor }} />
                <div className="w-8 h-8 rounded-lg shadow border border-white/10" style={{ backgroundColor: activeAsset.averageColor }} />
                <div className="text-[9px] font-bold">
                  <span className="text-gray-400 block">اللون المهيمن: <b className="text-white uppercase font-mono">{activeAsset.dominantColor}</b></span>
                  <span className="text-gray-400 block mt-0.5">متوسط اللون: <b className="text-white uppercase font-mono">{activeAsset.averageColor}</b></span>
                </div>
              </div>

              {/* Meta information tags */}
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-500 font-bold">اسم الملف الأصلي</span>
                      <span className="text-white font-mono break-all max-w-[150px]">{activeAsset.fileName}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-500 font-bold">المقاسات والكثافة</span>
                      <span className="text-white font-mono">{activeAsset.width} × {activeAsset.height} px</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-500 font-bold">نسبة العرض للارتفاع</span>
                      <span className="text-white font-mono">{activeAsset.aspectRatio} ({activeAsset.aspectRatio === '1.78' ? '16:9' : activeAsset.aspectRatio === '1.00' ? '1:1' : 'مخصص'})</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-500 font-bold">شفافية ألفا (PNG)</span>
                      <span className={`font-black ${activeAsset.hasTransparency ? 'text-emerald-400' : 'text-gray-400'}`}>{activeAsset.hasTransparency ? 'مكتشفة نشطة' : 'صورة معتمة'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-500 font-bold">رمز التشفير SHA256</span>
                      <span className="text-white font-mono truncate max-w-[120px]" title={activeAsset.sha256}>{activeAsset.sha256.substring(0, 16)}...</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-500 font-bold">البصمة المرئية pHash</span>
                      <span className="text-amber-500 font-mono" title="المرجعية المعرفية دقيقة جداً">{activeAsset.pHash || 'غير متوفرة'}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <span className="text-[10px] font-black text-gray-500 block mb-1.5">أوسمة وتصنيفات الذكاء الاصطناعي</span>
                    <div className="flex flex-wrap gap-1">
                      {activeAsset.tags.map((t, idx) => (
                        <span key={idx} className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Sparkles size={8} /> {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>تعديل التفاصيل والتسميات</span>
                  </button>
                </div>
              ) : (
                /* Metadata Editing Panel */
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5">اسم الأصل الرقمي</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5">نوع الوسيط</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as MediaType)}
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Images">صورة عامة</option>
                      <option value="Logos">شعارات ورموز</option>
                      <option value="Player Photos">صور اللاعبين</option>
                      <option value="Team Logos">شعارات الأندية</option>
                      <option value="Stadium Images">صور الملاعب</option>
                      <option value="Backgrounds">خلفية صفحة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5">الأوسمة (مفصولة بفاصلة)</label>
                    <textarea
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-black border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 resize-none font-bold"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveMetadata}
                      className="flex-1 py-2.5 bg-amber-500 text-black font-black text-xs rounded-xl hover:bg-amber-400 transition-all cursor-pointer"
                    >
                      حفظ التغييرات
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2.5 bg-white/5 border border-white/10 text-gray-300 font-black text-xs rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* SMART LINKING MODULE (Rule 9: No public endpoints for secure logic) */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-1.5">
                  <LinkIcon size={14} className="text-amber-500" />
                  <span className="text-[11px] font-black text-white">الروابط الذكية للكيانات (Smart Links)</span>
                </div>

                {/* Display Current Links */}
                <div className="space-y-2">
                  {/* Players linked */}
                  {activeAsset.smartLinks?.players?.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 font-bold block">اللاعبين المرتبطين:</span>
                      <div className="flex flex-wrap gap-1">
                        {activeAsset.smartLinks.players.map(p => (
                          <span key={p.id} className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <User size={10} />
                            <span>{p.name}</span>
                            <button onClick={() => handleRemoveLink('players', p.id)} className="text-gray-500 hover:text-red-400 mr-1 font-bold">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teams linked */}
                  {activeAsset.smartLinks?.teams?.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 font-bold block">الأندية المرتبطة:</span>
                      <div className="flex flex-wrap gap-1">
                        {activeAsset.smartLinks.teams.map(t => (
                          <span key={t.id} className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Shield size={10} />
                            <span>{t.name}</span>
                            <button onClick={() => handleRemoveLink('teams', t.id)} className="text-gray-500 hover:text-red-400 mr-1 font-bold">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form to add links */}
                <div className="space-y-3 bg-black/40 p-3 rounded-xl border border-white/[0.03]">
                  {/* Link player */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-gray-400 font-bold block">ربط مع لاعب</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="الاسم"
                        value={linkPlayerName}
                        onChange={(e) => setLinkPlayerName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-black border border-white/10 rounded-lg text-[10px] text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="الرمز"
                        value={linkPlayerId}
                        onChange={(e) => setLinkPlayerId(e.target.value)}
                        className="w-16 px-2.5 py-1.5 bg-black border border-white/10 rounded-lg text-[10px] text-white focus:outline-none font-mono"
                      />
                      <button
                        onClick={handleAddPlayerLink}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] px-3 py-1.5 rounded-lg transition-all"
                      >
                        ربط
                      </button>
                    </div>
                  </div>

                  {/* Link team */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-gray-400 font-bold block">ربط مع فريق / نادٍ</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="الاسم"
                        value={linkTeamName}
                        onChange={(e) => setLinkTeamName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-black border border-white/10 rounded-lg text-[10px] text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="الرمز"
                        value={linkTeamId}
                        onChange={(e) => setLinkTeamId(e.target.value)}
                        className="w-16 px-2.5 py-1.5 bg-black border border-white/10 rounded-lg text-[10px] text-white focus:outline-none font-mono"
                      />
                      <button
                        onClick={handleAddTeamLink}
                        className="bg-amber-600 hover:bg-amber-500 text-black font-black text-[10px] px-3 py-1.5 rounded-lg transition-all"
                      >
                        ربط
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#111112]/50 border border-white/5 border-dashed rounded-2xl p-6 text-center space-y-2">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-500 mx-auto">
                <Info size={16} />
              </div>
              <h5 className="text-[11px] font-black text-white">لم يتم تحديد أصل رقمي</h5>
              <p className="text-[10px] text-gray-400 leading-relaxed">اختر صورة أو شعار من المكتبة لمعاينة الأبعاد، الألوان السائدة، الأوسمة، أو إدارة الروابط الذكية دون تكرار مجهد.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  async function handleDeleteAsset(id: string) {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الأصل الرقمي نهائياً من مخدمات المنصة؟')) {
      await onDeleteAsset(id);
      if (activeAsset?.id === id) {
        setActiveAsset(null);
      }
    }
  }
}
