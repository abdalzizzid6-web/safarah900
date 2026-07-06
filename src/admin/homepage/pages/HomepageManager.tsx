import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import { HomepageBlock, BlockType } from '../../../types';
import { 
  Plus, Edit2, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Layout, RefreshCw, 
  Smartphone, Monitor, Tablet, Sparkles, Move, Check, ShieldAlert, Clock, Database, Play,
  Sliders, Info, HelpCircle, Save, ExternalLink, Trophy, Flame, Activity, Tv, TrendingUp,
  Newspaper, Grid, Video, Code, MessageSquare, ChevronDown, ChevronUp, Layers, Palette, Settings2
} from 'lucide-react';
import { BlockForm } from '../components/BlockForm';
import { HOMEPAGE_TEMPLATES, TemplateDefinition, RowDefinition } from '../../../premium/data/HomepageTemplates';
import { clearHomepageCache } from '../../../hooks/useHomepageLayout';
import { motion, AnimatePresence } from 'motion/react';

export const HomepageManager: React.FC = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'blueprint' | 'simulator'>('simulator');
  
  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Template active selection state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  // Quick Properties Inspector State
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickSubtitle, setQuickSubtitle] = useState('');
  const [quickTitleIcon, setQuickTitleIcon] = useState('None');
  const [quickTitleAlign, setQuickTitleAlign] = useState('text-right');
  const [savingQuick, setSavingQuick] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notification / Alert state
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'homepage_blocks'), orderBy('displayOrder', 'asc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBlocks(items);
      try {
        localStorage.setItem('admin_homepage_blocks_fallback', JSON.stringify(items));
      } catch (e) {}
    } catch (err) {
      console.error("[HomepageManager] Error loading layouts from Firestore: ", err);
      try {
        const cached = localStorage.getItem('admin_homepage_blocks_fallback');
        if (cached) {
          setBlocks(JSON.parse(cached));
        }
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    const template = HOMEPAGE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const confirmMsg = `تنبيه هام: هل أنت متأكد من تطبيق القالب المتكامل "${template.name}"؟\nسيقوم هذا بتفريغ الصفحة الرئيسية من كافة تخطيطاتها الحالية وإعادة إنشائها بالكامل وفق القالب المختار فوراً!`;
    if (!window.confirm(confirmMsg)) return;

    setApplyingTemplate(true);
    try {
      // 1. Delete all current blocks
      const q = query(collection(db, 'homepage_blocks'));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => {
        batch.delete(doc(db, 'homepage_blocks', d.id));
      });
      await batch.commit();

      // 2. Add the template rows as blocks
      for (let i = 0; i < template.rows.length; i++) {
        const row = template.rows[i];
        const title = row.columns[0]?.widgets[0]?.title || 'تخطيط الصفحة';
        const type = row.columns[0]?.widgets[0]?.type || 'HERO';
        
        const payload = {
          title,
          type,
          internalName: `row_layout_${templateId}_${i}`,
          displayOrder: (i + 1) * 10,
          enabled: true,
          visibility: { desktop: true, tablet: true, mobile: true },
          layoutConfig: {
            columns: row.columns.length,
            style: 'card'
          },
          cacheConfig: { durationMinutes: 5 },
          scheduling: {},
          seo: { index: true },
          analytics: { views: 0, clicks: 0 },
          rows: [row] 
        };

        await addDoc(collection(db, 'homepage_blocks'), payload);
      }

      clearHomepageCache();
      await fetchBlocks();
      triggerAlert('success', `تم تطبيق قالب البناء المباشر "${template.name}" بنجاح!`);
    } catch (err) {
      console.error("[HomepageManager] Failed to apply experience template:", err);
      triggerAlert('error', 'حدث خطأ أثناء تطبيق قالب الهيكل المخصص.');
    } finally {
      setApplyingTemplate(false);
    }
  };

  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const toggleBlockEnabled = async (block: any) => {
    try {
      const updatedValue = !block.enabled;
      await updateDoc(doc(db, 'homepage_blocks', block.id), { enabled: updatedValue });
      setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, enabled: updatedValue } : b));
      clearHomepageCache();
      triggerAlert('success', `تم ${updatedValue ? 'تفعيل' : 'تعطيل'} قسم "${block.title}" بنجاح.`);
    } catch (err) {
      console.error("[HomepageManager] Error toggling block: ", err);
      triggerAlert('error', 'فشل تغيير حالة البث للمكون.');
    }
  };

  const deleteBlock = async (id: string, title: string) => {
    if (confirm(`هل أنت متأكد من حذف قسم "${title}" نهائياً من الصفحة الرئيسية؟`)) {
      try {
        await deleteDoc(doc(db, 'homepage_blocks', id));
        clearHomepageCache();
        if (selectedBlockId === id) setSelectedBlockId(null);
        await fetchBlocks();
        triggerAlert('success', 'تم حذف القسم وتزامن المخطط بنجاح.');
      } catch (err) {
        console.error("[HomepageManager] Error deleting block: ", err);
        triggerAlert('error', 'فشل حذف المكون.');
      }
    }
  };

  const moveBlock = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const currentBlock = blocks[index];
    const targetBlock = blocks[targetIndex];

    try {
      const currentOrder = currentBlock.displayOrder || (index + 1) * 10;
      const targetOrder = targetBlock.displayOrder || (targetIndex + 1) * 10;

      const updatedBlocks = [...blocks];
      updatedBlocks[index] = { ...currentBlock, displayOrder: targetOrder };
      updatedBlocks[targetIndex] = { ...targetBlock, displayOrder: currentOrder };
      updatedBlocks.sort((a, b) => a.displayOrder - b.displayOrder);
      setBlocks(updatedBlocks);

      await Promise.all([
        updateDoc(doc(db, 'homepage_blocks', currentBlock.id), { displayOrder: targetOrder }),
        updateDoc(doc(db, 'homepage_blocks', targetBlock.id), { displayOrder: currentOrder })
      ]);
      clearHomepageCache();
    } catch (err) {
      console.error("[HomepageManager] Error updating order: ", err);
      fetchBlocks();
    }
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDragOverIndex(null);
      setDraggedIndex(null);
      return;
    }

    const updatedBlocks = [...blocks];
    const draggedBlock = updatedBlocks[draggedIndex];
    
    updatedBlocks.splice(draggedIndex, 1);
    updatedBlocks.splice(targetIndex, 0, draggedBlock);

    const reindexed = updatedBlocks.map((b, idx) => ({
      ...b,
      displayOrder: (idx + 1) * 10
    }));

    setBlocks(reindexed);
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      const promises = reindexed.map(b => 
        updateDoc(doc(db, 'homepage_blocks', b.id), { displayOrder: b.displayOrder })
      );
      await Promise.all(promises);
      clearHomepageCache();
      triggerAlert('success', 'تم إعادة ترتيب وتزامن هيكل الصفحة.');
    } catch (err) {
      console.error("[HomepageManager] Failed drag reorder: ", err);
      fetchBlocks();
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Quick 1-Click Spawners
  const handleQuickSpawnBlock = async (type: BlockType, label: string) => {
    const nextOrder = blocks.length > 0 ? Math.max(...blocks.map(b => b.displayOrder || 0)) + 10 : 10;
    
    let defaultSubtitle = '';
    let iconChoice = 'None';
    if (type === BlockType.LIVE_MATCHES) {
      defaultSubtitle = 'تابع البث المباشر لأهم مواجهات اللحظة بدقة عالية';
      iconChoice = 'Tv';
    } else if (type === BlockType.TODAY_MATCHES) {
      defaultSubtitle = 'جدول المواجهات الكروية المقررة لليوم بالتوقيت المحلي';
      iconChoice = 'Activity';
    } else if (type === BlockType.LEAGUE_STANDINGS) {
      defaultSubtitle = 'جدول الترتيب الحصري لأقوى الأندية والبطولات الأوروبية';
      iconChoice = 'Trophy';
    } else if (type === BlockType.LATEST_NEWS) {
      defaultSubtitle = 'تقارير عاجلة ومقالات رياضية ساخنة من قلب الحدث';
      iconChoice = 'Newspaper';
    } else if (type === BlockType.BENTO_ACTIONS) {
      defaultSubtitle = 'روابط سريعة لأهم الأقسام والقصص الرياضية السريعة';
      iconChoice = 'Sparkles';
    }

    const payload = {
      title: label,
      type,
      internalName: `quick_${type.toLowerCase()}_${Date.now()}`,
      displayOrder: nextOrder,
      enabled: true,
      visibility: { desktop: true, tablet: true, mobile: true },
      permissions: { guests: true, members: true },
      dataConfig: {
        maxItems: 5,
        showMoreButton: false
      },
      styleConfig: {
        backgroundColor: '#0e1622',
        textColor: '#e2e8f0',
        titleColor: '#ffffff',
        accentColor: '#10b981',
        fontFamily: '',
        borderRadius: '1.5rem',
        borderStyle: 'none',
        borderWidth: '1px',
        shadowIntensity: 'none',
        hoverEffect: 'none',
        paddingSize: 'standard',
        subtitle: defaultSubtitle,
        titleSize: 'text-sm',
        titleWeight: 'font-black',
        titleAlign: 'text-right',
        titleIcon: iconChoice,
        skeletonType: 'pulsing',
        bgGradient: false,
        bgGradientStart: '#0e1622',
        bgGradientEnd: '#070b11'
      },
      layoutConfig: {
        columns: 1,
        style: 'card'
      },
      cacheConfig: { durationMinutes: 5 },
      scheduling: {},
      seo: { index: true },
      analytics: { views: 0, clicks: 0 },
      rows: [
        {
          id: `row-quick-${Date.now()}`,
          spacing: 'gap-6',
          alignment: 'items-start',
          columns: [
            {
              id: `col-quick-${Date.now()}`,
              width: 'w-full',
              widgets: [
                {
                  id: `widget-quick-${Date.now()}`,
                  type,
                  title: label,
                  status: 'active',
                  order: 10,
                  dataSource: 'api',
                  layout: { width: 'full', spacing: 'gap-4', alignment: 'center' },
                  visibility: { desktop: true, tablet: true, mobile: true },
                  permissions: { guests: true, members: true },
                  responsiveSettings: { mobileColumns: 1, tabletColumns: 1, desktopColumns: 1 },
                  cacheSettings: { durationMinutes: 5 },
                  animation: { type: 'fade', duration: 0.4, delay: 0 },
                  scheduling: {},
                  dataConfig: { maxItems: 5 }
                }
              ]
            }
          ]
        }
      ]
    };

    try {
      await addDoc(collection(db, 'homepage_blocks'), payload);
      clearHomepageCache();
      await fetchBlocks();
      triggerAlert('success', `تم توليد قسم "${label}" فوري بنجاح، وتحميل الإعدادات الرياضية القياسية!`);
    } catch (err) {
      console.error("[HomepageManager] Quick spawn failed:", err);
      triggerAlert('error', 'فشل توليد القسم السريع.');
    }
  };

  // Open Quick Inspector for selected block
  const openQuickInspector = (block: any) => {
    setSelectedBlockId(block.id);
    setQuickTitle(block.title || '');
    setQuickSubtitle(block.styleConfig?.subtitle || '');
    setQuickTitleIcon(block.styleConfig?.titleIcon || 'None');
    setQuickTitleAlign(block.styleConfig?.titleAlign || 'text-right');
    setSaveSuccess(false);
  };

  // Handle Quick Save from Inspector
  const handleQuickSave = async () => {
    if (!selectedBlockId) return;
    setSavingQuick(true);
    try {
      const block = blocks.find(b => b.id === selectedBlockId);
      if (!block) return;

      const styleConfig = {
        ...(block.styleConfig || {}),
        subtitle: quickSubtitle,
        titleIcon: quickTitleIcon,
        titleAlign: quickTitleAlign
      };

      const payload = {
        title: quickTitle,
        styleConfig
      };

      await updateDoc(doc(db, 'homepage_blocks', selectedBlockId), payload);
      
      // Update local state instantly
      setBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, title: quickTitle, styleConfig } : b));
      clearHomepageCache();
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      triggerAlert('success', `تم تحديث خصائص "${quickTitle}" فوراً وتزامن التصفح.`);
    } catch (err) {
      console.error("[HomepageManager] Quick save failed:", err);
      triggerAlert('error', 'حدث خطأ أثناء تدوين التحديثات الفورية.');
    } finally {
      setSavingQuick(false);
    }
  };

  // Apply Quick Theme Preset to Block
  const applyQuickThemePreset = async (preset: typeof THEME_PRESETS[0]) => {
    if (!selectedBlockId) return;
    try {
      const block = blocks.find(b => b.id === selectedBlockId);
      if (!block) return;

      const styleConfig = {
        ...(block.styleConfig || {}),
        backgroundColor: preset.backgroundColor,
        textColor: preset.textColor,
        titleColor: preset.titleColor,
        accentColor: preset.accentColor,
        borderStyle: preset.borderStyle,
        borderRadius: preset.borderRadius,
        bgGradient: preset.bgGradient,
        bgGradientStart: preset.bgGradientStart,
        bgGradientEnd: preset.bgGradientEnd,
        shadowIntensity: preset.shadowIntensity
      };

      await updateDoc(doc(db, 'homepage_blocks', selectedBlockId), { styleConfig });
      setBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, styleConfig } : b));
      clearHomepageCache();
      triggerAlert('success', `تم تطبيق المظهر الرياضي "${preset.name}" على القسم.`);
    } catch (err) {
      console.error("[HomepageManager] Quick preset failed: ", err);
      triggerAlert('error', 'فشل تطبيق المظهر السريع.');
    }
  };

  const getFriendlyTypeName = (type: any) => {
    switch (type) {
      case BlockType.HERO: return 'المباراة المميزة (Hero)';
      case BlockType.BENTO_ACTIONS: return 'صندوق الوصول السريع (Bento)';
      case BlockType.LIVE_MATCHES: return 'المباريات الحية والجارية الآن (Live)';
      case BlockType.BREAKING_NEWS: return 'كأس العالم ٢٠٢٦ (World Cup)';
      case BlockType.LEAGUE_STANDINGS: return 'جدول ترتيب الدوري (Standings)';
      case BlockType.LATEST_NEWS: return 'آخر الأخبار الرياضية (Latest)';
      case BlockType.TODAY_MATCHES: return 'جدول مباريات اليوم بالكامل (Today)';
      case BlockType.TOMORROW_MATCHES: return 'جدول مباريات الغد (Tomorrow)';
      case BlockType.FINISHED_MATCHES: return 'مباريات منتهية مسبقاً (Finished)';
      case BlockType.FEATURED_NEWS: return 'الأخبار المميزة (Featured News)';
      case BlockType.TRENDING_NEWS: return 'الأخبار الرائجة والأكثر قراءة (Trending)';
      case BlockType.LEAGUES: return 'قائمة الدوريات الرئيسية (Leagues)';
      case BlockType.TOP_PLAYERS: return 'إحصائيات وأفضل اللاعبين (Top Players)';
      case BlockType.ADS: return 'إعلان مخصص (Advertisements)';
      case BlockType.VIDEOS: return 'مقاطع الفيديو والأهداف (Videos)';
      case BlockType.CUSTOM_WIDGETS: return 'أداة مخصصة (Custom Widgets HTML/Code)';
      default: return String(type);
    }
  };

  // Metrics calculators
  const totalActive = blocks.filter(b => b.enabled).length;
  const mobileVisible = blocks.filter(b => b.visibility?.mobile !== false).length;
  const customScriptsCount = blocks.filter(b => b.type === BlockType.CUSTOM_WIDGETS).length;
  const cachedDurationAvg = blocks.length > 0 ? 5 : 0;

  return (
    <div className="p-6 bg-[#070b11] min-h-screen text-gray-100 font-sans selection:bg-primary/30" dir="rtl">
      {/* Alert Banner */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-6 z-50 px-6 py-4 rounded-2xl border flex items-center gap-3 shadow-2xl backdrop-blur-md ${
              alertMsg.type === 'success' 
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' 
                : 'bg-red-950/80 border-red-500/30 text-red-300'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${alertMsg.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'} animate-ping`} />
            <span className="text-xs font-black">{alertMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Brand */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary p-2.5 rounded-2xl border border-primary/20">
              <Layout className="animate-spin-slow" size={24} />
            </span>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>منشئ ومخطط الصفحة الرئيسية الاحترافي</span>
                <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full font-mono font-black">PRO BUILDER v2.5</span>
              </h1>
              <p className="text-xs text-gray-400 mt-1 font-bold">
                لوحة تحكم إدارية متكاملة لترتيب، هيكلة، وتصميم الصفحة الرئيسية للموقع بشكل مباشر وقابل للتخصيص الكامل.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggles */}
          <div className="bg-[#0e1622] border border-white/10 rounded-2xl p-1.5 flex items-center gap-1">
            <button
              onClick={() => setViewMode('simulator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${viewMode === 'simulator' ? 'bg-primary text-black font-extrabold shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <Smartphone size={14} />
              <span>المحاكي التفاعلي المباشر</span>
            </button>
            <button
              onClick={() => setViewMode('blueprint')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${viewMode === 'blueprint' ? 'bg-primary text-black font-extrabold shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid size={14} />
              <span>المخطط الهيكلي المفصل</span>
            </button>
          </div>

          <button
            onClick={fetchBlocks}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-300 border border-white/5 transition flex items-center justify-center"
            title="تحديث البيانات"
          >
            <RefreshCw size={16} />
          </button>

          <button 
            className="bg-primary hover:bg-primary-hover text-black font-black text-xs px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/25 transition active:scale-95"
            onClick={() => {
              setEditingBlock(null);
              setShowForm(!showForm);
            }}
          >
            <Plus size={16} /> 
            <span>{showForm ? 'إلغاء الإجراء' : 'إضافة مكون مخصص'}</span>
          </button>
        </div>
      </div>

      {/* Real-time stats widgets block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0e1622] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <Check size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400">الأقسام النشطة بالبث</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{totalActive} <span className="text-xs text-gray-500 font-sans">/ {blocks.length}</span></div>
          </div>
        </div>

        <div className="bg-[#0e1622] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400">ظهور كامل على الموبايل</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{mobileVisible} <span className="text-xs text-gray-500 font-sans">أقسام</span></div>
          </div>
        </div>

        <div className="bg-[#0e1622] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
            <Code size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400">كود مخصص HTML/Widgets</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{customScriptsCount} <span className="text-xs text-gray-500 font-sans">مكونات</span></div>
          </div>
        </div>

        <div className="bg-[#0e1622] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400">زمن تخزين الاستجابة</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{cachedDurationAvg} <span className="text-xs text-gray-500 font-sans">دقائق (ذكي)</span></div>
          </div>
        </div>
      </div>

      {/* Block Form Expanded */}
      {showForm && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <BlockForm 
            blockToEdit={editingBlock}
            onSave={() => { 
              setShowForm(false); 
              setEditingBlock(null);
              fetchBlocks(); 
            }} 
            onCancel={() => {
              setShowForm(false);
              setEditingBlock(null);
            }}
          />
        </motion.div>
      )}

      {/* SIMULATOR & CONTROL DOUBLE VIEW */}
      {viewMode === 'simulator' && !loading && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* COLUMN 1: Visual Mobile Phone Simulator (Sticky) */}
          <div className="xl:col-span-5 flex flex-col items-center">
            <div className="sticky top-6 w-full max-w-[340px]">
              <div className="text-center mb-4">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-black">
                  📱 محاكي بث مباشر تفاعلي للهواتف
                </span>
              </div>
              
              {/* CSS Phone Frame */}
              <div className="relative mx-auto border-[#1a2536] bg-[#0c1421] border-[12px] rounded-[3rem] h-[640px] w-full max-w-[320px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                {/* Speaker & Sensor Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-5 w-32 bg-[#0c1421] rounded-b-2xl z-40 flex items-center justify-center gap-1.5">
                  <div className="w-10 h-1 bg-white/10 rounded-full"></div>
                  <div className="w-2 h-2 bg-camera/30 rounded-full border border-white/5"></div>
                </div>

                {/* Simulated Screen Body */}
                <div className="flex-1 bg-[#080808] flex flex-col pt-5 text-white select-none relative">
                  
                  {/* Status Bar */}
                  <div className="h-6 px-5 flex justify-between items-center text-[9px] text-gray-400 font-bold font-mono">
                    <span>09:41</span>
                    <div className="flex items-center gap-1.5">
                      <span>📶</span>
                      <span>5G</span>
                      <span>🔋 100%</span>
                    </div>
                  </div>

                  {/* Safara 90 header mockup */}
                  <div className="h-10 border-b border-white/5 px-4 flex items-center justify-between bg-[#0e1622]/60 backdrop-blur-md">
                    <span className="text-xs font-black text-primary tracking-wider">SAFARA 90</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[8px]">🔍</span>
                      <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[8px]">🔔</span>
                    </div>
                  </div>

                  {/* Simulator Screen Dynamic Blocks Area */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 pb-16">
                    {blocks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500 space-y-2">
                        <span className="text-2xl">📭</span>
                        <p className="text-[10px] font-bold">لا توجد أقسام لتصميمها بعد، استخدم لوحة التوليد السريع على اليسار لبناء صفحتك في ثوانٍ!</p>
                      </div>
                    ) : (
                      blocks.map((block, idx) => {
                        const style = block.styleConfig || {};
                        const isSelected = selectedBlockId === block.id;

                        // Calculate dynamic block wrapper styles for simulator
                        const isGradient = style.bgGradient === true;
                        const blockBg = isGradient
                          ? `linear-gradient(135deg, ${style.bgGradientStart || '#0e1622'}, ${style.bgGradientEnd || '#070b11'})`
                          : style.backgroundColor || '#0e1622';

                        const blockTextColor = style.textColor || '#cbd5e1';
                        const blockTitleColor = style.titleColor || '#ffffff';
                        const titleIcon = style.titleIcon && style.titleIcon !== 'None' ? style.titleIcon : null;
                        const subtitle = style.subtitle || null;

                        const borderStyleString = style.borderStyle && style.borderStyle !== 'none'
                          ? `solid ${style.borderWidth || '1px'} ${style.accentColor || 'rgba(255,255,255,0.08)'}`
                          : '1px solid rgba(255,255,255,0.05)';

                        const blockStyle: React.CSSProperties = {
                          background: blockBg,
                          color: blockTextColor,
                          borderRadius: style.borderRadius || '1rem',
                          border: borderStyleString,
                          boxShadow: style.shadowIntensity === 'subtle' ? '0 2px 8px rgba(0,0,0,0.4)' : style.shadowIntensity === 'medium' ? '0 4px 15px rgba(0,0,0,0.5)' : undefined,
                        };

                        return (
                          <div
                            key={block.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openQuickInspector(block);
                            }}
                            className={`relative group rounded-2xl p-3 text-right cursor-pointer transition-all duration-300 ${
                              !block.enabled ? 'opacity-40 border border-dashed border-red-500/30' : ''
                            } ${
                              isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-black scale-[1.02] shadow-2xl' : 'hover:scale-[1.01]'
                            }`}
                            style={blockStyle}
                          >
                            {/* Selected highlight badge */}
                            {isSelected && (
                              <span className="absolute -top-2 -left-2 bg-primary text-black font-extrabold text-[8px] px-2 py-0.5 rounded-full z-20 shadow-md">
                                تعديل نشط
                              </span>
                            )}

                            {/* Section Header */}
                            <div className={`mb-2.5 flex flex-col gap-0.5 ${style.titleAlign || 'text-right'}`}>
                              <div className="flex items-center gap-1 justify-end">
                                <h4 className="text-[10px] font-black tracking-tight" style={{ color: blockTitleColor }}>
                                  {block.title}
                                </h4>
                                {titleIcon && (
                                  <span className="text-xs">
                                    {titleIcon === 'Trophy' ? '🏆' : titleIcon === 'Flame' ? '🔥' : titleIcon === 'Sparkles' ? '✨' : titleIcon === 'Activity' ? '📈' : titleIcon === 'Tv' ? '📺' : titleIcon === 'TrendingUp' ? '⚡' : titleIcon === 'Newspaper' ? '📰' : ''}
                                  </span>
                                )}
                              </div>
                              {subtitle && (
                                <p className="text-[7px] text-gray-400 font-medium leading-relaxed truncate max-w-[200px]">{subtitle}</p>
                              )}
                            </div>

                            {/* RENDER MINI PLACEHOLDER CONTENT ACCORDING TO BLOCK TYPE */}
                            {renderMiniPlaceholderContent(block.type)}

                            {/* HOVER TOOLBAR ACTIONS FOR SIMULATOR */}
                            <div className="absolute inset-0 bg-black/80 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 px-2 pointer-events-none group-hover:pointer-events-auto">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBlock(block);
                                  setShowForm(true);
                                }}
                                className="p-1.5 bg-primary hover:bg-primary-hover text-black rounded-lg transition"
                                title="معدل متقدم"
                              >
                                <Edit2 size={10} />
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBlockEnabled(block);
                                }}
                                className={`p-1.5 rounded-lg transition ${block.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
                                title={block.enabled ? 'تعطيل من النشر' : 'تفعيل ونشر'}
                              >
                                {block.enabled ? <Eye size={10} /> : <EyeOff size={10} />}
                              </button>

                              <button
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveBlock(idx, 'up');
                                }}
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition disabled:opacity-20"
                              >
                                <ChevronUp size={10} />
                              </button>

                              <button
                                disabled={idx === blocks.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveBlock(idx, 'down');
                                }}
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition disabled:opacity-20"
                              >
                                <ChevronDown size={10} />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBlock(block.id, block.title);
                                }}
                                className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Smartphone home tab button placeholder */}
                  <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Inspector, Quick Spawners & Templates Gallery (7 Columns) */}
          <div className="xl:col-span-7 space-y-8">
            
            {/* INSPECTOR CARD (Shown if block selected) */}
            <AnimatePresence mode="wait">
              {selectedBlockId ? (
                (() => {
                  const currentSelected = blocks.find(b => b.id === selectedBlockId);
                  if (!currentSelected) return null;

                  return (
                    <motion.div
                      key={selectedBlockId}
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 10 }}
                      className="bg-[#0e1622] border-2 border-primary/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
                    >
                      {/* Decorative gradient corner */}
                      <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
                      
                      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                        <div className="flex items-center gap-2">
                          <Settings2 className="text-primary animate-spin-slow" size={18} />
                          <h3 className="text-sm font-black text-white">مفتش الخصائص السريع (Quick Inspector)</h3>
                        </div>
                        <button
                          onClick={() => setSelectedBlockId(null)}
                          className="text-xs text-gray-500 hover:text-white transition bg-white/5 px-2.5 py-1 rounded-lg"
                        >
                          إغلاق المفتش
                        </button>
                      </div>

                      {/* Inspector Inputs */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-gray-400 font-bold block">عنوان القسم المعروض</label>
                            <input
                              type="text"
                              value={quickTitle}
                              onChange={(e) => setQuickTitle(e.target.value)}
                              className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-gray-400 font-bold block">أيقونة القسم المعروضة</label>
                            <select
                              value={quickTitleIcon}
                              onChange={(e) => setQuickTitleIcon(e.target.value)}
                              className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                            >
                              <option value="None">بدون أيقونة (None)</option>
                              <option value="Trophy">🏆 كأس البطولة (Trophy)</option>
                              <option value="Flame">🔥 نار حماسية (Flame)</option>
                              <option value="Sparkles">✨ بريق مميز (Sparkles)</option>
                              <option value="Activity">📈 نبض النشاط (Activity)</option>
                              <option value="Tv">📺 البث المباشر (Tv)</option>
                              <option value="TrendingUp">⚡ الرائجة (Trending)</option>
                              <option value="Newspaper">📰 تغطية إخبارية (Newspaper)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-gray-400 font-bold block">العنوان الفرعي التوضيحي (Subtitle)</label>
                          <textarea
                            value={quickSubtitle}
                            onChange={(e) => setQuickSubtitle(e.target.value)}
                            rows={2}
                            placeholder="اكتب تعليقاً فرعياً يوضح أهمية هذا القسم لزوارك..."
                            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-primary focus:outline-none resize-none"
                          />
                        </div>

                        {/* Title Align Row */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-gray-400 font-bold block">محاذاة نصوص ومحتويات العنوان</label>
                          <div className="grid grid-cols-3 gap-2 bg-[#070b11] border border-white/5 rounded-xl p-1 items-center">
                            <button
                              type="button"
                              onClick={() => setQuickTitleAlign('text-right')}
                              className={`text-[10px] py-1.5 rounded-lg font-black transition ${quickTitleAlign === 'text-right' ? 'bg-primary text-black font-extrabold' : 'text-gray-400'}`}
                            >
                              الجهة اليمين (شائع)
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickTitleAlign('text-center')}
                              className={`text-[10px] py-1.5 rounded-lg font-black transition ${quickTitleAlign === 'text-center' ? 'bg-primary text-black font-extrabold' : 'text-gray-400'}`}
                            >
                              الوسط المتناظر
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickTitleAlign('text-left')}
                              className={`text-[10px] py-1.5 rounded-lg font-black transition ${quickTitleAlign === 'text-left' ? 'bg-primary text-black font-extrabold' : 'text-gray-400'}`}
                            >
                              الجهة اليسار
                            </button>
                          </div>
                        </div>

                        {/* Presets picker inside inspector */}
                        <div className="space-y-2 pt-2">
                          <label className="text-[10px] text-gray-400 font-bold block flex items-center gap-1.5">
                            <Palette size={12} className="text-amber-400" />
                            <span>تغيير المظهر والسمات البصرية بنقرة واحدة:</span>
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {THEME_PRESETS.map((p, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => applyQuickThemePreset(p)}
                                className="p-2 bg-[#070b11] border border-white/5 hover:border-primary/50 text-right rounded-xl transition flex flex-col gap-0.5 text-[9px]"
                              >
                                <span className="font-bold text-white block truncate w-full">{p.name}</span>
                                <div className="flex gap-1 mt-1">
                                  <span className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: p.backgroundColor || '#0e1622' }}></span>
                                  <span className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: p.titleColor || '#ffd700' }}></span>
                                  <span className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: p.accentColor || '#10b981' }}></span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Bottom action controls */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                          <div className="text-[10px] text-gray-400">
                            النوع الأساسي: <span className="font-bold text-primary font-mono">{getFriendlyTypeName(currentSelected.type)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {saveSuccess ? (
                              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                                <Check size={14} />
                                تم الحفظ!
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleQuickSave}
                                disabled={savingQuick}
                                className="bg-primary hover:bg-primary-hover text-black font-black text-xs px-5 py-2 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-1.5 transition active:scale-95"
                              >
                                {savingQuick ? (
                                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Save size={14} />
                                )}
                                <span>حفظ وتحديث المحاكي</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()
              ) : (
                <div className="bg-[#0e1622] border border-white/5 rounded-3xl p-6 text-center text-gray-500 text-xs">
                  💡 اضغط على أي قسم داخل شاشة محاكي الموبايل لتعديل وتغيير ألوانه وعناوينه فوراً من المفتش السريع.
                </div>
              )}
            </AnimatePresence>

            {/* QUICK ACTIONS: 1-Click Widget Spawn Board */}
            <div className="bg-[#0e1622] border border-white/5 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="text-primary animate-pulse" size={18} />
                <h2 className="text-sm font-black text-white">توليد الأقسام السريع (1-Click Widget Spawn Board)</h2>
              </div>
              <p className="text-xs text-gray-400">
                أسرع لوحة لبناء مكونات الصفحة الرئيسية بضغطة زر واحدة. انقر على أي قسم بالأسفل لتوليده مع إعداداته الرياضية المعتمدة فوراً دون الحاجة لتعبئة استمارات مكررة:
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => handleQuickSpawnBlock(BlockType.LIVE_MATCHES, 'البث المباشر للمباريات الحية')}
                  className="p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 hover:border-red-500/30 text-red-400 rounded-2xl text-xs font-black text-right transition flex flex-col justify-between h-20 active:scale-95"
                >
                  <Tv size={16} />
                  <span>بث مباشر فوري 📺</span>
                </button>

                <button
                  onClick={() => handleQuickSpawnBlock(BlockType.TODAY_MATCHES, 'جدول مباريات اليوم بالكامل')}
                  className="p-3 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 hover:border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-black text-right transition flex flex-col justify-between h-20 active:scale-95"
                >
                  <Activity size={16} />
                  <span>مباريات اليوم ⚽</span>
                </button>

                <button
                  onClick={() => handleQuickSpawnBlock(BlockType.LEAGUE_STANDINGS, 'جدول ترتيب دوري المحترفين')}
                  className="p-3 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 hover:border-amber-500/30 text-amber-400 rounded-2xl text-xs font-black text-right transition flex flex-col justify-between h-20 active:scale-95"
                >
                  <Trophy size={16} />
                  <span>ترتيب البطولة 🏆</span>
                </button>

                <button
                  onClick={() => handleQuickSpawnBlock(BlockType.LATEST_NEWS, 'تغطية إخبارية وعاجل')}
                  className="p-3 bg-sky-500/5 hover:bg-sky-500/10 border border-sky-500/15 hover:border-sky-500/30 text-sky-400 rounded-2xl text-xs font-black text-right transition flex flex-col justify-between h-20 active:scale-95"
                >
                  <Newspaper size={16} />
                  <span>أخبار حصرية 📰</span>
                </button>

                <button
                  onClick={() => handleQuickSpawnBlock(BlockType.BENTO_ACTIONS, 'قصص وصندوق وصول بينتو سريع')}
                  className="p-3 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/15 hover:border-purple-500/30 text-purple-400 rounded-2xl text-xs font-black text-right transition flex flex-col justify-between h-20 active:scale-95"
                >
                  <Sparkles size={16} />
                  <span>أزرار بينتو الذكية ✨</span>
                </button>

                <button
                  onClick={() => handleQuickSpawnBlock(BlockType.VIDEOS, 'أهداف اللقاءات وملخصات مرئية')}
                  className="p-3 bg-pink-500/5 hover:bg-pink-500/10 border border-pink-500/15 hover:border-pink-500/30 text-pink-400 rounded-2xl text-xs font-black text-right transition flex flex-col justify-between h-20 active:scale-95"
                >
                  <Video size={16} />
                  <span>ملخصات مرئية 🎥</span>
                </button>
              </div>
            </div>

            {/* EXPERIENCE TEMPLATE GALLERY MODULE */}
            <div className="bg-[#0e1622] border border-white/5 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-400" size={18} />
                <h2 className="text-sm font-black text-white">مكتبة قوالب التخطيط الكاملة (Experience Layout Presets)</h2>
              </div>
              <p className="text-xs text-gray-400">
                اختر أحد القوالب الفاخرة المعتمدة لتطبيق تجربة مستخدم فورية تتماشى مع المناسبات الكروية. سيقوم بتهيئة الهيكل بالكامل ومسح التخطيط القديم:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HOMEPAGE_TEMPLATES.map(template => (
                  <div 
                    key={template.id} 
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${selectedTemplate === template.id ? 'bg-primary/5 border-primary' : 'bg-[#070b11] border-white/5 hover:border-white/10'}`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div>
                      <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                        <Check className={`w-3.5 h-3.5 ${selectedTemplate === template.id ? 'text-primary' : 'text-gray-600'}`} />
                        {template.name}
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{template.description}</p>
                    </div>
                    
                    <button
                      disabled={applyingTemplate}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyTemplate(template.id);
                      }}
                      className={`w-full py-2 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1.5 ${selectedTemplate === template.id ? 'bg-primary text-black hover:bg-primary-hover shadow-md' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                    >
                      {applyingTemplate && selectedTemplate === template.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play size={10} />
                      )}
                      <span>تطبيق هذا القالب المتكامل</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DETAILED BLUEPRINT VIEW */}
      {viewMode === 'blueprint' && !loading && (
        <div className="space-y-6">
          {/* Instructions on Drag & Drop */}
          {blocks.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3">
              <Move size={14} className="animate-bounce shrink-0" />
              <span className="font-bold">ميزة الترتيب المباشر مفعلة:</span>
              <span>اضغط مطولاً على أي قسم واسحبه لأعلى أو لأسفل لتغيير موقع ظهوره في الصفحة الرئيسية بدقة.</span>
            </div>
          )}

          {blocks.length === 0 ? (
            <div className="text-center py-20 bg-[#0e1622]/50 border border-white/5 rounded-3xl p-8 max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <Layout size={28} />
              </div>
              <div>
                <h3 className="font-black text-white text-sm">لا توجد أقسام مضافة بعد</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  قائمة المخطط خالية من أي كتل حالياً. اختر قوالب التخطيط من المحاكي التفاعلي أو أضف مكوناً يدوياً.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {blocks.map((block, index) => {
                const isDragged = draggedIndex === index;
                const isDragOver = dragOverIndex === index;
                const rowsCount = block.rows?.length || 1;
                const widgetsCount = block.rows?.reduce((acc: number, r: any) => acc + (r.columns?.reduce((acc2: number, c: any) => acc2 + (c.widgets?.length || 0), 0) || 0), 0) || 1;

                return (
                  <div 
                    key={block.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`bg-[#0e1622] border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 cursor-grab active:cursor-grabbing ${
                      block.enabled ? 'border-white/5' : 'border-white/5 opacity-55'
                    } ${isDragged ? 'opacity-30 scale-95 border-primary' : ''} ${
                      isDragOver ? 'border-dashed border-primary bg-primary/5 py-8' : ''
                    }`}
                  >
                    {/* Order & Metadata */}
                    <div className="flex items-center gap-4">
                      <div className="text-gray-500 hover:text-white transition p-1 cursor-grab">
                        <Move size={16} />
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          disabled={index === 0}
                          onClick={() => moveBlock(index, 'up')}
                          className={`p-1 rounded bg-white/5 border border-white/10 text-gray-400 hover:text-white transition ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          <ArrowUp size={10} />
                        </button>
                        <button
                          disabled={index === blocks.length - 1}
                          onClick={() => moveBlock(index, 'down')}
                          className={`p-1 rounded bg-white/5 border border-white/10 text-gray-400 hover:text-white transition ${index === blocks.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          <ArrowDown size={10} />
                        </button>
                      </div>

                      <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-mono text-xs font-black text-gray-400 border border-white/5">
                        {index + 1}
                      </span>

                      <div>
                        <h3 className="font-black text-sm text-white flex items-center gap-2">
                          <span>{block.title}</span>
                          {!block.enabled && (
                            <span className="text-[9px] bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full font-bold border border-red-500/20">معطل</span>
                          )}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-gray-400">
                          <span className="font-bold text-primary flex items-center gap-1">
                            <Database size={11} />
                            {getFriendlyTypeName(block.type)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-purple-400">
                            <Layout size={11} />
                            المخطط: {rowsCount} صفوف ({widgetsCount} عناصر)
                          </span>
                          <span>•</span>
                          <span className="font-mono">الترتيب: {block.displayOrder}</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-white/5 pt-3 sm:pt-0 sm:border-0">
                      <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
                        <Monitor size={12} className={block.visibility?.desktop !== false ? 'text-primary' : 'text-gray-600'} />
                        <Tablet size={12} className={block.visibility?.tablet !== false ? 'text-primary' : 'text-gray-600'} />
                        <Smartphone size={12} className={block.visibility?.mobile !== false ? 'text-primary' : 'text-gray-600'} />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleBlockEnabled(block)}
                          className={`p-2 rounded-xl transition ${block.enabled ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}
                        >
                          {block.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>

                        <button 
                          onClick={() => {
                            setEditingBlock(block);
                            setShowForm(true);
                            window.scrollTo({ top: 350, behavior: 'smooth' });
                          }}
                          className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 rounded-xl transition"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button 
                          onClick={() => deleteBlock(block.id, block.title)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Loading state spinner */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-black">جاري تحميل وتزامن بنية ومخطط الصفحة الرئيسية...</p>
        </div>
      )}
    </div>
  );
};

// HELPER: Theme Presets list for quick-styling blocks
const THEME_PRESETS = [
  {
    name: 'النمط الافتراضي الكلاسيكي',
    backgroundColor: '',
    textColor: '',
    titleColor: '',
    accentColor: '',
    borderStyle: 'none',
    borderRadius: '1.5rem',
    bgGradient: false,
    bgGradientStart: '',
    bgGradientEnd: '',
    shadowIntensity: 'none'
  },
  {
    name: 'الذهبي الملكي الفاخر',
    backgroundColor: '#0a0f18',
    textColor: '#e2e8f0',
    titleColor: '#ffd700',
    accentColor: '#ffd700',
    borderStyle: 'solid',
    borderRadius: '1.5rem',
    bgGradient: true,
    bgGradientStart: '#0f182c',
    bgGradientEnd: '#060911',
    shadowIntensity: 'glow'
  },
  {
    name: 'الليل الأرجواني الحديث',
    backgroundColor: '#0c071a',
    textColor: '#f1f5f9',
    titleColor: '#c084fc',
    accentColor: '#a855f7',
    borderStyle: 'solid',
    borderRadius: '1.5rem',
    bgGradient: true,
    bgGradientStart: '#1b0e35',
    bgGradientEnd: '#07030e',
    shadowIntensity: 'glow'
  },
  {
    name: 'النجيلة الخضراء الرياضية',
    backgroundColor: '#06130d',
    textColor: '#ecfdf5',
    titleColor: '#34d399',
    accentColor: '#10b981',
    borderStyle: 'solid',
    borderRadius: '1.5rem',
    bgGradient: true,
    bgGradientStart: '#0b261a',
    bgGradientEnd: '#030a07',
    shadowIntensity: 'medium'
  },
  {
    name: 'الناري الحماسي الحار',
    backgroundColor: '#120404',
    textColor: '#fef2f2',
    titleColor: '#f87171',
    accentColor: '#ef4444',
    borderStyle: 'solid',
    borderRadius: '1.5rem',
    bgGradient: true,
    bgGradientStart: '#250808',
    bgGradientEnd: '#090202',
    shadowIntensity: 'glow'
  }
];

// HELPER: Renders custom miniature visual structures representing real-time widgets in the phone
function renderMiniPlaceholderContent(type: BlockType) {
  switch (type) {
    case BlockType.HERO:
      return (
        <div className="p-2 bg-black/40 rounded-xl space-y-1.5 text-center border border-white/5">
          <div className="flex items-center justify-between px-3">
            <span className="text-[7px] font-bold text-gray-300 flex items-center gap-0.5">⚪ ريال مدريد</span>
            <span className="text-[10px] font-black text-primary font-mono">2</span>
            <span className="text-[7px] font-black text-red-500 animate-pulse bg-red-500/10 px-1 rounded">LIVE</span>
            <span className="text-[10px] font-black text-primary font-mono">1</span>
            <span className="text-[7px] font-bold text-gray-300 flex items-center gap-0.5">برشلونة 🔵</span>
          </div>
          <div className="text-[6px] text-gray-500 font-mono">دوري أبطال أوروبا • الشوط الثاني '72</div>
        </div>
      );
    case BlockType.LIVE_MATCHES:
      return (
        <div className="space-y-1">
          <div className="p-1.5 bg-[#10b981]/5 border border-[#10b981]/15 rounded-xl flex items-center justify-between px-3">
            <span className="text-[7px] font-bold text-emerald-400">🔥 الاتحاد ٢ - ٠ الهلال</span>
            <span className="text-[6px] font-mono text-emerald-400 animate-pulse">'56</span>
          </div>
          <div className="p-1.5 bg-[#10b981]/5 border border-[#10b981]/15 rounded-xl flex items-center justify-between px-3">
            <span className="text-[7px] font-bold text-emerald-400">🔥 النصر ١ - ١ الأهلي</span>
            <span className="text-[6px] font-mono text-emerald-400 animate-pulse">'31</span>
          </div>
        </div>
      );
    case BlockType.TODAY_MATCHES:
    case BlockType.TOMORROW_MATCHES:
    case BlockType.FINISHED_MATCHES:
      return (
        <div className="space-y-1">
          <div className="p-1.5 bg-black/20 rounded-xl flex items-center justify-between px-2 text-[7px] text-gray-400 border border-white/5">
            <span>مانشستر سيتي vs أرسنال</span>
            <span className="bg-white/5 px-1 py-0.5 rounded text-[6px] font-mono">18:30</span>
          </div>
          <div className="p-1.5 bg-black/20 rounded-xl flex items-center justify-between px-2 text-[7px] text-gray-400 border border-white/5">
            <span>ليفربول vs تشيلسي</span>
            <span className="bg-white/5 px-1 py-0.5 rounded text-[6px] font-mono">21:00</span>
          </div>
        </div>
      );
    case BlockType.LATEST_NEWS:
    case BlockType.FEATURED_NEWS:
    case BlockType.TRENDING_NEWS:
    case BlockType.BREAKING_NEWS:
      return (
        <div className="flex gap-2 p-1.5 bg-black/20 rounded-xl border border-white/5 items-center">
          <div className="w-10 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[10px]">📰</div>
          <div className="flex-1 space-y-1">
            <div className="h-1.5 w-full bg-white/20 rounded"></div>
            <div className="h-1 w-2/3 bg-white/10 rounded"></div>
          </div>
        </div>
      );
    case BlockType.BENTO_ACTIONS:
      return (
        <div className="grid grid-cols-2 gap-1.5">
          <div className="p-1.5 bg-primary/10 border border-primary/20 rounded-xl text-center text-primary text-[7px] font-black">
            🔮 توقع مباراة الليلة
          </div>
          <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center text-purple-400 text-[7px] font-black">
            🏆 فانتازي صفارة 90
          </div>
        </div>
      );
    case BlockType.LEAGUE_STANDINGS:
      return (
        <div className="p-1.5 bg-black/20 rounded-xl space-y-1 border border-white/5 text-[7px] font-mono">
          <div className="flex justify-between text-gray-500 px-1 border-b border-white/5 pb-0.5">
            <span># الفريق</span>
            <span>نقاط</span>
          </div>
          <div className="flex justify-between px-1 text-gray-300">
            <span>1. الهلال 🏆</span>
            <span>68</span>
          </div>
          <div className="flex justify-between px-1 text-gray-400">
            <span>2. النصر</span>
            <span>61</span>
          </div>
        </div>
      );
    case BlockType.LEAGUES:
      return (
        <div className="flex items-center gap-2 justify-center py-1">
          <span className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[8px]" title="الدوري الإسباني">🇪🇸</span>
          <span className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[8px]" title="الدوري الإنجليزي">🇬🇧</span>
          <span className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[8px]" title="الدوري السعودي">🇸🇦</span>
          <span className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[8px]" title="أبطال أوروبا">🇪🇺</span>
        </div>
      );
    case BlockType.TOP_PLAYERS:
    case BlockType.TOP_GOALSCORERS:
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 justify-between p-1 bg-black/20 rounded-lg border border-white/5 text-[7px]">
            <span className="font-bold text-white">1. كريستيانو رونالدو</span>
            <span className="text-primary font-bold">٢٩ هدف</span>
          </div>
          <div className="flex items-center gap-1.5 justify-between p-1 bg-black/20 rounded-lg border border-white/5 text-[7px]">
            <span className="font-bold text-white">2. ألكسندر ميتروفيتش</span>
            <span className="text-primary font-bold">٢٥ هدف</span>
          </div>
        </div>
      );
    case BlockType.ADS:
      return (
        <div className="p-2 bg-amber-500/10 border border-dashed border-amber-500/30 rounded-xl text-center text-amber-400 text-[7px] font-black flex items-center justify-center gap-1 animate-pulse">
          📢 مساحة إعلانية ممولة لتغطية نفقات السيرفر
        </div>
      );
    case BlockType.VIDEOS:
      return (
        <div className="relative rounded-xl overflow-hidden bg-black/50 border border-white/5 h-16 flex items-center justify-center">
          <span className="text-xl">▶️</span>
          <div className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[6px] font-mono">03:45</div>
        </div>
      );
    case BlockType.CUSTOM_WIDGETS:
      return (
        <div className="p-1.5 bg-[#030712] border border-emerald-500/20 rounded-xl text-left font-mono text-[6px] text-emerald-400 space-y-0.5">
          <div className="text-[6px] text-gray-500 border-b border-white/5 pb-0.5 mb-1 text-right">أداة ترميز HTML مخصصة 🛠️</div>
          <div className="truncate">{"<div class='p-4 bg-primary/10'>"}</div>
          <div className="truncate">{"  <h4>مرحباً بالزوار الكرام</h4>"}</div>
          <div className="truncate">{"</div>"}</div>
        </div>
      );
    default:
      return (
        <div className="p-2 bg-black/20 rounded-xl text-center text-[8px] text-gray-500">
          كتلة معلومات مخصصة للزوار
        </div>
      );
  }
}

export default HomepageManager;
