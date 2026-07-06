import React, { useState, useEffect } from 'react';
import { 
  Folder, Layers, Settings, FileImage, BarChart, HardDrive, Sparkles, 
  Upload, Sliders, Globe, RefreshCw, Star, Pin, Heart, Info, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { mediaService } from '../services/mediaService';
import { MediaAsset, MediaFolder, MediaCollection, DAMConfig, MediaType } from '../types';

// Import subcomponents
import MediaLibraryView from '../components/MediaLibraryView';
import MediaFoldersView from '../components/MediaFoldersView';
import MediaCollectionsView from '../components/MediaCollectionsView';
import MediaUploadsView from '../components/MediaUploadsView';
import MediaOptimizerView from '../components/MediaOptimizerView';
import MediaDuplicatesView from '../components/MediaDuplicatesView';
import MediaCDNView from '../components/MediaCDNView';
import MediaAnalyticsView from '../components/MediaAnalyticsView';
import MediaSettingsView from '../components/MediaSettingsView';

export default function MediaDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'folders' | 'collections' | 'uploads' | 'optimizer' | 'duplicates' | 'cdn' | 'analytics' | 'settings'>('dashboard');
  
  // Workspace state
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [collections, setCollections] = useState<MediaCollection[]>([]);
  const [config, setConfig] = useState<DAMConfig>({
    cdnProvider: 'Firebase',
    bucketName: 'safara90-media-assets',
    quality: 80,
    stripExif: true,
    defaultFormat: 'webp',
    autoAiTagging: true,
    autoDuplicateDetect: true,
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
    maxUploadSize: 10
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  const loadWorkspaceData = async () => {
    setIsLoading(true);
    try {
      const [fetchedAssets, fetchedFolders, fetchedCollections, fetchedConfig] = await Promise.all([
        mediaService.getAssets(),
        mediaService.getFolders(),
        mediaService.getCollections(),
        mediaService.getConfig()
      ]);

      setAssets(fetchedAssets);
      setFolders(fetchedFolders);
      setCollections(fetchedCollections);
      if (fetchedConfig) {
        setConfig(fetchedConfig);
      }
    } catch (error) {
      console.error('[Load DAM Data Error]:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Asset Actions
  const handleUpdateAsset = async (id: string, updates: Partial<MediaAsset>) => {
    try {
      await mediaService.updateAsset(id, updates);
      setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    } catch (error) {
      console.error('[Update Asset Error]:', error);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await mediaService.deleteAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('[Delete Asset Error]:', error);
    }
  };

  // Folder Actions
  const handleCreateFolder = async (name: string, parentId: string | null) => {
    try {
      const newF = await mediaService.createFolder(name, parentId);
      setFolders(prev => [newF, ...prev]);
    } catch (error) {
      console.error('[Create Folder Error]:', error);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await mediaService.deleteFolder(id);
      setFolders(prev => prev.filter(f => f.id !== id));
      // Reset selected folder if it was deleted
      if (selectedFolderId === id) setSelectedFolderId(null);
    } catch (error) {
      console.error('[Delete Folder Error]:', error);
    }
  };

  // Collection Actions
  const handleCreateCollection = async (name: string, description: string, isSmart: boolean, rules?: MediaCollection['smartRules']) => {
    try {
      const newC = await mediaService.createCollection(name, description, isSmart, rules);
      setCollections(prev => [newC, ...prev]);
    } catch (error) {
      console.error('[Create Collection Error]:', error);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await mediaService.deleteCollection(id);
      setCollections(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('[Delete Collection Error]:', error);
    }
  };

  const handleUpdateCollection = async (id: string, updates: Partial<MediaCollection>) => {
    try {
      await mediaService.updateCollection(id, updates);
      setCollections(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (error) {
      console.error('[Update Collection Error]:', error);
    }
  };

  // Config Action
  const handleSaveConfig = async (newCfg: DAMConfig) => {
    try {
      await mediaService.saveConfig(newCfg);
      setConfig(newCfg);
    } catch (error) {
      console.error('[Save Config Error]:', error);
    }
  };

  // Cleanup Action
  const handleTriggerCleanup = async (type: 'unused' | 'broken' | 'orphans' | 'missing-logos') => {
    try {
      await mediaService.triggerCleanup(type);
      await loadWorkspaceData(); // Reload whole state to reflect cleanup
    } catch (error) {
      console.error('[Trigger Cleanup Error]:', error);
    }
  };

  const handleSelectFolderAndView = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setActiveTab('library');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-t-2 border-r-2 border-amber-500 rounded-full animate-spin" />
        <span className="text-xs font-black text-gray-400 animate-pulse" dir="rtl">جاري استدعاء مخزن الوسائط الرقمية SAFARA90...</span>
      </div>
    );
  }

  // Sidebar Tabs Config
  const tabs = [
    { id: 'dashboard', name: 'نظرة عامة', icon: HardDrive },
    { id: 'library', name: 'المكتبة والروابط', icon: FileImage },
    { id: 'folders', name: 'المجلدات', icon: Folder },
    { id: 'collections', name: 'ألبومات ذكية', icon: Layers },
    { id: 'uploads', name: 'تلقيم ورفع', icon: Upload },
    { id: 'optimizer', name: 'تحسين وضغط', icon: Sliders },
    { id: 'duplicates', name: 'كاشف التكرار', icon: AlertTriangle },
    { id: 'cdn', name: 'شبكة CDN', icon: Globe },
    { id: 'analytics', name: 'التحليلات والصيانة', icon: BarChart },
    { id: 'settings', name: 'الإعدادات الأمنية', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-8" dir="rtl">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
              SAFARA90 ENTERPRISE
            </span>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles size={10} /> معزز بالذكاء الاصطناعي
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-white mt-2">مركز الأصول الرقمية (Digital Asset Management)</h1>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            المنصة المركزية لإدارة وتوزيع وتحسين الشعارات، صور الملاعب واللاعبين، وبنرات التغطية مع الروابط الذكية للكيانات والتحليل التلقائي.
          </p>
        </div>

        <button
          onClick={loadWorkspaceData}
          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* Main layout container with responsive workspace sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 bg-[#111112] border border-white/5 p-3 rounded-2xl space-y-1.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  w-full px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-3 cursor-pointer
                  ${isActive ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
              >
                <Icon size={16} className={isActive ? 'text-black' : 'text-gray-400'} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Canvas Workspace */}
        <div className="lg:col-span-5">
          {activeTab === 'dashboard' && renderOverviewTab()}
          {activeTab === 'library' && (
            <MediaLibraryView 
              assets={assets} 
              folders={folders} 
              collections={collections} 
              onUpdateAsset={handleUpdateAsset} 
              onDeleteAsset={handleDeleteAsset}
              onFolderSelect={setSelectedFolderId}
              selectedFolderId={selectedFolderId}
            />
          )}
          {activeTab === 'folders' && (
            <MediaFoldersView 
              folders={folders} 
              assets={assets} 
              onCreateFolder={handleCreateFolder} 
              onDeleteFolder={handleDeleteFolder} 
              onSelectFolder={handleSelectFolderAndView}
              selectedFolderId={selectedFolderId}
            />
          )}
          {activeTab === 'collections' && (
            <MediaCollectionsView 
              collections={collections} 
              assets={assets} 
              onCreateCollection={handleCreateCollection} 
              onDeleteCollection={handleDeleteCollection} 
              onUpdateCollection={handleUpdateCollection}
            />
          )}
          {activeTab === 'uploads' && (
            <MediaUploadsView 
              onUploadSuccess={loadWorkspaceData} 
              folders={folders} 
              currentFolderId={selectedFolderId}
            />
          )}
          {activeTab === 'optimizer' && (
            <MediaOptimizerView 
              config={config} 
              assets={assets} 
              onSaveConfig={handleSaveConfig}
            />
          )}
          {activeTab === 'duplicates' && (
            <MediaDuplicatesView 
              assets={assets} 
              onRefreshAssets={loadWorkspaceData}
            />
          )}
          {activeTab === 'cdn' && <MediaCDNView />}
          {activeTab === 'analytics' && (
            <MediaAnalyticsView 
              assets={assets} 
              onTriggerCleanup={handleTriggerCleanup}
            />
          )}
          {activeTab === 'settings' && (
            <MediaSettingsView 
              config={config} 
              onSaveConfig={handleSaveConfig}
            />
          )}
        </div>
      </div>
    </div>
  );

  function renderOverviewTab() {
    // Generate simple metrics for the home dashboard view
    const stats = {
      images: assets.filter(a => a.mediaType === 'Images').length,
      logos: assets.filter(a => a.mediaType === 'Logos' || a.mediaType === 'Team Logos' || a.mediaType === 'Competition Logos').length,
      pinned: assets.filter(a => a.isPinned).length,
      favs: assets.filter(a => a.isFavorite).length
    };

    return (
      <div className="space-y-6 text-right" dir="rtl">
        {/* Welcome and key indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#111112] border border-white/5 p-5 rounded-2xl">
            <span className="text-[10px] text-gray-500 font-bold block">الصور والملفات الكلية</span>
            <h4 className="text-xl font-black text-amber-500 font-mono mt-1">{assets.length} أصل رقمي</h4>
          </div>
          <div className="bg-[#111112] border border-white/5 p-5 rounded-2xl">
            <span className="text-[10px] text-gray-500 font-bold block">شعارات الكيانات والأندية</span>
            <h4 className="text-xl font-black text-emerald-400 font-mono mt-1">{stats.logos} شعار رسمي</h4>
          </div>
          <div className="bg-[#111112] border border-white/5 p-5 rounded-2xl">
            <span className="text-[10px] text-gray-500 font-bold block">الألبومات والمجموعات المنسقة</span>
            <h4 className="text-xl font-black text-blue-400 font-mono mt-1">{collections.length} ألبوم</h4>
          </div>
          <div className="bg-[#111112] border border-white/5 p-5 rounded-2xl">
            <span className="text-[10px] text-gray-500 font-bold block">المجلدات الأساسية بالمستندات</span>
            <h4 className="text-xl font-black text-pink-500 font-mono mt-1">{folders.length} مجلد</h4>
          </div>
        </div>

        {/* Quick launch grid and guides */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Upload Action Banner */}
            <div className="bg-gradient-to-l from-amber-500/10 via-black to-black border border-amber-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center sm:text-right">
                <h3 className="text-sm font-black text-white flex items-center justify-center sm:justify-start gap-1">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>تلقيم الأصول السريعة بالذكاء الاصطناعي</span>
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed max-w-lg">
                  قم بسحب وإفلات صور اللاعبين، شعارات الأندية والبطولات ليتولى Gemini توليد الأوسمة الفنية باللغة العربية وتحسين دقة الألوان وتعرية بيانات EXIF للحمل الزائد فوراً.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('uploads')}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Upload size={14} />
                <span>افتح ملقم الدفعات</span>
              </button>
            </div>

            {/* Pinned & Favorite assets previews */}
            <div className="bg-[#111112] border border-white/5 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-black text-white">الأصول المثبتة أو المفضلة بالمكتبة</h4>
              
              {assets.filter(a => a.isPinned || a.isFavorite).length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500 font-bold">
                  لا توجد صور مثبتة في مركز الاختصار حالياً. تصفح المكتبة وقم بتثبيت الصور الأكثر استخداماً للوصول العاجل.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {assets.filter(a => a.isPinned || a.isFavorite).slice(0, 4).map(asset => (
                    <div 
                      key={asset.id} 
                      onClick={() => {
                        setSelectedFolderId(asset.folderId);
                        setActiveTab('library');
                      }}
                      className="bg-black/40 border border-white/5 rounded-xl p-2.5 space-y-2 cursor-pointer hover:border-white/10 transition-all group"
                    >
                      <div className="aspect-video bg-[#0a0a0b] rounded-lg overflow-hidden relative">
                        <img src={asset.urls.thumbnail || asset.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                        <div className="absolute top-1 right-1 flex gap-0.5">
                          {asset.isFavorite && <Heart size={10} className="text-red-500" fill="currentColor" />}
                          {asset.isPinned && <Pin size={10} className="text-blue-400" />}
                        </div>
                      </div>
                      <h5 className="text-[10px] font-black text-white truncate">{asset.name}</h5>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats sidebar widget */}
          <div className="bg-[#111112] border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-white">إحصائيات الصيانة وسرعة التحميل</h4>
              
              <div className="space-y-3 text-[11px] font-bold">
                <div className="flex justify-between">
                  <span className="text-gray-400">كفاءة محرك التوزيع CDN</span>
                  <span className="text-emerald-400 font-black">98.4% إصابة الكاش</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">متوسط زمن الاستدعاء للأصل</span>
                  <span className="text-emerald-400 font-mono">14 ms (Edge Delivery)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">التكرار الرقمي المرصود</span>
                  <span className={`font-black ${assets.length > 5 ? 'text-amber-500' : 'text-emerald-400'}`}>0 مجموعات مكررة</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex items-start gap-2 text-[10px] text-amber-300 font-bold leading-relaxed">
              <Info className="text-amber-500 shrink-0" size={14} />
              <span>
                تخزين ومسح الأصول الرقمية يمر مباشرة عبر خدمات Firebase Cloud Storage المؤمنة، ويتم حجب مفاتيح واجهة برمجة التطبيقات بالكامل للامتثال الصارم لقوانين الحماية البرمجية.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
