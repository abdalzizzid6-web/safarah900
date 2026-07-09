import React, { useState, useEffect } from 'react';
import { repositories } from '../../../core/repository';
import { BlockType } from '../../../types';
import { Layout, RefreshCw, Plus, Smartphone, Grid } from 'lucide-react';
import { BlockForm } from '../components/BlockForm';
import { HOMEPAGE_TEMPLATES } from '../../../premium/data/HomepageTemplates';
import { clearHomepageCache } from '../../../hooks/useHomepageLayout';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../../firebase';
import { writeBatch, doc } from 'firebase/firestore';

// Import sub-components
import { THEME_PRESETS } from '../components/homepage-manager/HomepageManagerConstants';
import { HomepageManagerStats } from '../components/homepage-manager/HomepageManagerStats';
import { HomepageSimulator } from '../components/homepage-manager/HomepageSimulator';
import { HomepageQuickInspector } from '../components/homepage-manager/HomepageQuickInspector';
import { HomepageQuickActions } from '../components/homepage-manager/HomepageQuickActions';
import { HomepageTemplateGallery } from '../components/homepage-manager/HomepageTemplateGallery';
import { HomepageBlueprintView } from '../components/homepage-manager/HomepageBlueprintView';

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
  const [quickTitleEn, setQuickTitleEn] = useState('');
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
      const items = await repositories.homepage.getAll(200);
      const sorted = items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setBlocks(sorted);
      try {
        localStorage.setItem('admin_homepage_blocks_fallback', JSON.stringify(sorted));
      } catch (e) {}
    } catch (err) {
      console.error("[HomepageManager] Error loading layouts: ", err);
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
      // Need to delete all existing blocks. Use batch for efficiency.
      const currentBlocks = await repositories.homepage.getAll();
      const batch = writeBatch(db);
      currentBlocks.forEach(d => {
        batch.delete(doc(db, 'homepage_blocks', d.id));
      });
      await batch.commit();

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

        await repositories.homepage.create(payload);
      }

      clearHomepageCache();
      await fetchBlocks();
      triggerAlert('success', `تم تطبيق قالب البناء المباشر "${template.name}" بنجاح!`);
    } catch (err) {
      console.error("[HomepageManager] Failed to apply template:", err);
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
      await repositories.homepage.update(block.id, { enabled: updatedValue });
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
        await repositories.homepage.delete(id);
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
        repositories.homepage.update(currentBlock.id, { displayOrder: targetOrder }),
        repositories.homepage.update(targetBlock.id, { displayOrder: currentOrder })
      ]);
      clearHomepageCache();
    } catch (err) {
      console.error("[HomepageManager] Error updating order: ", err);
      fetchBlocks();
    }
  };

  // Drag & Drop Handlers
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
        repositories.homepage.update(b.id, { displayOrder: b.displayOrder })
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
      await repositories.homepage.create(payload);
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
    setQuickTitleEn(block.titleEn || '');
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
        titleEn: quickTitleEn,
        styleConfig
      };

      await repositories.homepage.update(selectedBlockId, payload);
      setBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, title: quickTitle, titleEn: quickTitleEn, styleConfig } : b));
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

      await repositories.homepage.update(selectedBlockId, { styleConfig });
      setBlocks(prev => prev.map(b => b.id === selectedBlockId ? { ...b, styleConfig } : b));
      clearHomepageCache();
      triggerAlert('success', `تم تطبيق المظهر الرياضي "${preset.name}" على القسم.`);
    } catch (err) {
      console.error("[HomepageManager] Quick preset failed: ", err);
      triggerAlert('error', 'فشل تطبيق المظهر السريع.');
    }
  };

  // Metrics
  const totalActive = blocks.filter(b => b.enabled).length;
  const mobileVisible = blocks.filter(b => b.visibility?.mobile !== false).length;
  const customScriptsCount = blocks.filter(b => b.type === BlockType.CUSTOM_WIDGETS).length;

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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 border-b border-white/5 pb-6 text-right">
        <div>
          <div className="flex items-center gap-3 justify-end">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 justify-end">
                <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full font-mono font-black">PRO BUILDER v2.5</span>
                <span>منشئ ومخطط الصفحة الرئيسية الاحترافي</span>
              </h1>
              <p className="text-xs text-gray-400 mt-1 font-bold">
                لوحة تحكم إدارية متكاملة لترتيب، هيكلة، وتصميم الصفحة الرئيسية للموقع بشكل مباشر وقابل للتخصيص الكامل.
              </p>
            </div>
            <span className="bg-primary/10 text-primary p-2.5 rounded-2xl border border-primary/20">
              <Layout className="animate-spin-slow" size={24} />
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-end w-full xl:w-auto">
          {/* View Toggles */}
          <div className="bg-[#0e1622] border border-white/10 rounded-2xl p-1.5 flex items-center gap-1">
            <button
              onClick={() => setViewMode('blueprint')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${viewMode === 'blueprint' ? 'bg-primary text-black font-extrabold shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid size={14} />
              <span>المخطط الهيكلي المفصل</span>
            </button>
            <button
              onClick={() => setViewMode('simulator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${viewMode === 'simulator' ? 'bg-primary text-black font-extrabold shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <Smartphone size={14} />
              <span>المحاكي التفاعلي المباشر</span>
            </button>
          </div>

          <button
            onClick={fetchBlocks}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-300 border border-white/5 transition flex items-center justify-center cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw size={16} />
          </button>

          <button 
            className="bg-primary hover:bg-primary-hover text-black font-black text-xs px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/25 transition active:scale-95 cursor-pointer"
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
      <HomepageManagerStats 
        totalActive={totalActive}
        blocksLength={blocks.length}
        mobileVisible={mobileVisible}
        customScriptsCount={customScriptsCount}
        cachedDurationAvg={blocks.length > 0 ? 5 : 0}
      />

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
          {/* COLUMN 1: Visual Mobile Phone Simulator */}
          <HomepageSimulator 
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            openQuickInspector={openQuickInspector}
            setEditingBlock={setEditingBlock}
            setShowForm={setShowForm}
            toggleBlockEnabled={toggleBlockEnabled}
            moveBlock={moveBlock}
            deleteBlock={deleteBlock}
          />

          {/* COLUMN 2: Inspector, Quick Spawners & Templates Gallery */}
          <div className="xl:col-span-7 space-y-8">
            <HomepageQuickInspector 
              selectedBlockId={selectedBlockId}
              blocks={blocks}
              quickTitle={quickTitle}
              setQuickTitle={setQuickTitle}
              quickTitleEn={quickTitleEn}
              setQuickTitleEn={setQuickTitleEn}
              quickSubtitle={quickSubtitle}
              setQuickSubtitle={setQuickSubtitle}
              quickTitleIcon={quickTitleIcon}
              setQuickTitleIcon={setQuickTitleIcon}
              quickTitleAlign={quickTitleAlign}
              setQuickTitleAlign={setQuickTitleAlign}
              savingQuick={savingQuick}
              saveSuccess={saveSuccess}
              handleQuickSave={handleQuickSave}
              applyQuickThemePreset={applyQuickThemePreset}
              setSelectedBlockId={setSelectedBlockId}
            />

            <HomepageQuickActions 
              handleQuickSpawnBlock={handleQuickSpawnBlock}
            />

            <HomepageTemplateGallery 
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              applyingTemplate={applyingTemplate}
              handleApplyTemplate={handleApplyTemplate}
            />
          </div>
        </div>
      )}

      {/* DETAILED BLUEPRINT VIEW */}
      {viewMode === 'blueprint' && !loading && (
        <HomepageBlueprintView 
          blocks={blocks}
          draggedIndex={draggedIndex}
          dragOverIndex={dragOverIndex}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          handleDragEnd={handleDragEnd}
          moveBlock={moveBlock}
          toggleBlockEnabled={toggleBlockEnabled}
          setEditingBlock={setEditingBlock}
          setShowForm={setShowForm}
          deleteBlock={deleteBlock}
        />
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

export default HomepageManager;
