import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { BlockType } from '../../../types';
import { clearHomepageCache } from '../../../hooks/useHomepageLayout';
import { 
  Save, X, Settings, Layout, Eye, Monitor, Tablet, Smartphone,
  Shield, Calendar, Sparkles, Clock, AlertCircle, RefreshCw,
  Layers, Palette, Code, Check, EyeOff, Info, ArrowUpRight,
  HelpCircle, Palette as PaletteIcon, Terminal, SmartphoneIcon
} from 'lucide-react';

interface BlockFormProps {
  blockToEdit?: any | null;
  onSave: () => void;
  onCancel: () => void;
}

const POPULAR_LEAGUES = [
  { id: '39', name: 'الدوري الإنجليزي الممتاز' },
  { id: '140', name: 'الدوري الإسباني' },
  { id: '135', name: 'الدوري الإيطالي' },
  { id: '78', name: 'الدوري الألماني' },
  { id: '61', name: 'الدوري الفرنسي' },
  { id: '307', name: 'الدوري السعودي للمحترفين' },
  { id: '2', name: 'دوري أبطال أوروبا' }
];

// Custom theme color presets
const COLOR_PRESETS = [
  {
    name: 'النمط المظلم الكلاسيكي (Default)',
    backgroundColor: '',
    textColor: '',
    titleColor: '',
    accentColor: '',
    borderStyle: 'none'
  },
  {
    name: 'الذهبي الرياضي الفاخر (Gold)',
    backgroundColor: '#0a0f18',
    textColor: '#e2e8f0',
    titleColor: '#ffd700',
    accentColor: '#ffd700',
    borderStyle: 'solid'
  },
  {
    name: 'النمط الحديث الملكي (Purple)',
    backgroundColor: '#0c071a',
    textColor: '#f1f5f9',
    titleColor: '#c084fc',
    accentColor: '#a855f7',
    borderStyle: 'solid'
  },
  {
    name: 'النمط العشبي الكلاسيكي (Green)',
    backgroundColor: '#06130d',
    textColor: '#ecfdf5',
    titleColor: '#34d399',
    accentColor: '#10b981',
    borderStyle: 'solid'
  },
  {
    name: 'النمط الناري الحماسي (Crimson)',
    backgroundColor: '#120404',
    textColor: '#fef2f2',
    titleColor: '#f87171',
    accentColor: '#ef4444',
    borderStyle: 'solid'
  }
];

// Pre-defined code templates for Custom Widgets
const CUSTOM_WIDGET_TEMPLATES = [
  {
    name: 'بطاقة ترحيب عاجلة مع أيقونة',
    code: `<div class="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
  <div class="p-3 bg-amber-500/20 text-amber-400 rounded-xl font-bold text-lg">⚠️</div>
  <div class="space-y-1">
    <h4 class="text-sm font-black text-white">تنويه هام للزوار الكرام</h4>
    <p class="text-[11px] text-gray-400 leading-relaxed font-semibold">بسبب الضغط الكبير على السيرفرات أثناء بث مباريات كأس العالم، قد تواجه بعض القنوات تأخيراً بسيطاً. ننصح باستخدام المشغل الاحتياطي المستقر في حال حدوث تقطيع.</p>
  </div>
</div>`
  },
  {
    name: 'شريط قنوات التواصل الاجتماعي',
    code: `<div class="bg-[#0c1421] border border-white/5 p-5 rounded-3xl space-y-3 text-center">
  <h4 class="text-xs font-black text-white">انضم إلى مجتمعاتنا الرياضية الفورية</h4>
  <p class="text-[10px] text-gray-400">تابعنا للحصول على تنبيهات الأهداف ومواعيد البث المباشر أولاً بأول</p>
  <div class="flex justify-center gap-3 pt-2">
    <a href="https://t.me/" target="_blank" class="px-4 py-2 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/20 text-[#0088cc] rounded-xl text-[10px] font-bold transition">قناة التليجرام</a>
    <a href="https://twitter.com/" target="_blank" class="px-4 py-2 bg-[#1da1f2]/10 hover:bg-[#1da1f2]/20 border border-[#1da1f2]/20 text-[#1da1f2] rounded-xl text-[10px] font-bold transition">حساب تويتر</a>
    <a href="https://whatsapp.com/" target="_blank" class="px-4 py-2 bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/20 text-[#25d366] rounded-xl text-[10px] font-bold transition">قناة الواتساب</a>
  </div>
</div>`
  },
  {
    name: 'مؤقت تنازلي لكلاسيكو الأرض',
    code: `<div class="p-6 bg-gradient-to-r from-red-950/40 to-blue-950/40 border border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
  <div class="space-y-1 text-center md:text-right">
    <h3 class="text-sm font-black text-white">كلاسيكو الأرض المرتقب</h3>
    <p class="text-[10px] text-gray-400">ريال مدريد ضد برشلونة • الجولة القادمة</p>
  </div>
  <div class="flex items-center gap-2 font-mono text-center">
    <div class="bg-black/40 border border-white/5 p-2 rounded-xl min-w-12">
      <div class="text-sm font-black text-primary">02</div>
      <div class="text-[8px] text-gray-500">أيام</div>
    </div>
    <span class="text-gray-600">:</span>
    <div class="bg-black/40 border border-white/5 p-2 rounded-xl min-w-12">
      <div class="text-sm font-black text-white">14</div>
      <div class="text-[8px] text-gray-500">ساعة</div>
    </div>
    <span class="text-gray-600">:</span>
    <div class="bg-black/40 border border-white/5 p-2 rounded-xl min-w-12">
      <div class="text-sm font-black text-white">35</div>
      <div class="text-[8px] text-gray-500">دقيقة</div>
    </div>
  </div>
</div>`
  }
];

export const BlockForm: React.FC<BlockFormProps> = ({ blockToEdit, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'logic' | 'advanced'>('content');

  const [title, setTitle] = useState('');
  const [type, setType] = useState<BlockType>(BlockType.HERO);
  const [enabled, setEnabled] = useState(true);
  
  // Visibility & Devices
  const [visibleDesktop, setVisibleDesktop] = useState(true);
  const [visibleTablet, setVisibleTablet] = useState(true);
  const [visibleMobile, setVisibleMobile] = useState(true);

  // League standing configurations
  const [selectedLeagueId, setSelectedLeagueId] = useState('39');
  const [customLeagueId, setCustomLeagueId] = useState('');
  const [leagueName, setLeagueName] = useState('الدوري الإنجليزي الممتاز');

  // Max Items & Filters
  const [maxItems, setMaxItems] = useState<number>(10);
  const [filterLeagueId, setFilterLeagueId] = useState<string>('');
  const [filterNewsCategory, setFilterNewsCategory] = useState<string>('');
  const [customHtmlCode, setCustomHtmlCode] = useState<string>('');
  
  // Ad and banner slots
  const [adSlot, setAdSlot] = useState<string>('Home_Middle');
  const [adImageUrl, setAdImageUrl] = useState<string>('');
  const [adLinkUrl, setAdLinkUrl] = useState<string>('');

  // Style configurations
  const [backgroundColor, setBackgroundColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [titleColor, setTitleColor] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [borderRadius, setBorderRadius] = useState('');
  const [borderStyle, setBorderStyle] = useState<string>('none');
  const [borderWidth, setBorderWidth] = useState<string>('1px');
  const [shadowIntensity, setShadowIntensity] = useState<string>('none');
  const [hoverEffect, setHoverEffect] = useState<string>('none');
  const [paddingSize, setPaddingSize] = useState<string>('standard');

  // Professional customization extensions
  const [subtitle, setSubtitle] = useState('');
  const [titleSize, setTitleSize] = useState('text-sm');
  const [titleWeight, setTitleWeight] = useState('font-black');
  const [titleAlign, setTitleAlign] = useState('text-right');
  const [titleIcon, setTitleIcon] = useState('None');
  const [showMoreButton, setShowMoreButton] = useState(false);
  const [moreButtonLabel, setMoreButtonLabel] = useState('مشاهدة المزيد ↗');
  const [moreButtonUrl, setMoreButtonUrl] = useState('');
  const [skeletonType, setSkeletonType] = useState('pulsing');
  const [bgGradient, setBgGradient] = useState(false);
  const [bgGradientStart, setBgGradientStart] = useState('#0e1622');
  const [bgGradientEnd, setBgGradientEnd] = useState('#070b11');

  // Layout configurations
  const [columns, setColumns] = useState<number>(1);
  const [style, setStyle] = useState<'card' | 'carousel' | 'slider' | 'bento' | 'magazine'>('card');

  // New Widget Fields
  const [dataSource, setDataSource] = useState<'firestore' | 'rss' | 'api' | 'ai' | 'manual' | 'mixed'>('api');
  
  // Permissions
  const [allowGuests, setAllowGuests] = useState(true);
  const [allowMembers, setAllowMembers] = useState(true);

  // Animations
  const [animationType, setAnimationType] = useState<'fade' | 'slide' | 'slide_right' | 'zoom' | 'spring' | 'none'>('fade');
  const [animationDuration, setAnimationDuration] = useState<number>(0.4);
  const [animationDelay, setAnimationDelay] = useState<number>(0);

  // Scheduling
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [expireTime, setExpireTime] = useState('');

  // Conditional Rendering
  const [hasConditionalRule, setHasConditionalRule] = useState(false);
  const [conditionType, setConditionType] = useState<'live_matches_count' | 'always'>('live_matches_count');
  const [conditionOperator, setConditionOperator] = useState<'gt' | 'eq' | 'lt'>('gt');
  const [conditionValue, setConditionValue] = useState<number>(0);
  const [fallbackWidgetType, setFallbackWidgetType] = useState<string>('');

  useEffect(() => {
    if (blockToEdit) {
      setTitle(blockToEdit.title || '');
      setType(blockToEdit.type || BlockType.HERO);
      setEnabled(blockToEdit.enabled !== false);
      setDataSource(blockToEdit.dataSource || 'api');

      // Load custom filtering & limit parameters
      const dConfig = blockToEdit.dataConfig || {};
      setMaxItems(dConfig.maxItems || 10);
      setFilterLeagueId(dConfig.filterLeagueId || '');
      setFilterNewsCategory(dConfig.filterNewsCategory || '');
      setCustomHtmlCode(dConfig.customHtmlCode || '');
      setAdSlot(dConfig.adSlot || 'Home_Middle');
      setAdImageUrl(dConfig.imageUrl || '');
      setAdLinkUrl(dConfig.linkUrl || '');
      setShowMoreButton(dConfig.showMoreButton === true);
      setMoreButtonLabel(dConfig.moreButtonLabel || 'مشاهدة المزيد ↗');
      setMoreButtonUrl(dConfig.moreButtonUrl || '');

      // Style configurations
      const sConfig = blockToEdit.styleConfig || {};
      setBackgroundColor(sConfig.backgroundColor || '');
      setTextColor(sConfig.textColor || '');
      setTitleColor(sConfig.titleColor || '');
      setAccentColor(sConfig.accentColor || '');
      setFontFamily(sConfig.fontFamily || '');
      setBorderRadius(sConfig.borderRadius || '');
      setBorderStyle(sConfig.borderStyle || 'none');
      setBorderWidth(sConfig.borderWidth || '1px');
      setShadowIntensity(sConfig.shadowIntensity || 'none');
      setHoverEffect(sConfig.hoverEffect || 'none');
      setPaddingSize(sConfig.paddingSize || 'standard');
      setSubtitle(sConfig.subtitle || '');
      setTitleSize(sConfig.titleSize || 'text-sm');
      setTitleWeight(sConfig.titleWeight || 'font-black');
      setTitleAlign(sConfig.titleAlign || 'text-right');
      setTitleIcon(sConfig.titleIcon || 'None');
      setSkeletonType(sConfig.skeletonType || 'pulsing');
      setBgGradient(sConfig.bgGradient === true);
      setBgGradientStart(sConfig.bgGradientStart || '#0e1622');
      setBgGradientEnd(sConfig.bgGradientEnd || '#070b11');

      if (blockToEdit.visibility) {
        setVisibleDesktop(blockToEdit.visibility.desktop !== false);
        setVisibleTablet(blockToEdit.visibility.tablet !== false);
        setVisibleMobile(blockToEdit.visibility.mobile !== false);
      }

      if (blockToEdit.layoutConfig) {
        setColumns(blockToEdit.layoutConfig.columns || 1);
        setStyle(blockToEdit.layoutConfig.style || 'card');
      }

      if (blockToEdit.permissions) {
        setAllowGuests(blockToEdit.permissions.guests !== false);
        setAllowMembers(blockToEdit.permissions.members !== false);
      } else {
        setAllowGuests(true);
        setAllowMembers(true);
      }

      if (blockToEdit.animation) {
        setAnimationType(blockToEdit.animation.type || 'fade');
        setAnimationDuration(blockToEdit.animation.duration || 0.4);
        setAnimationDelay(blockToEdit.animation.delay || 0);
      } else {
        setAnimationType('fade');
        setAnimationDuration(0.4);
        setAnimationDelay(0);
      }

      if (blockToEdit.scheduling) {
        setStartDate(blockToEdit.scheduling.startDate || '');
        setEndDate(blockToEdit.scheduling.endDate || '');
        setPublishTime(blockToEdit.scheduling.publishTime || '');
        setExpireTime(blockToEdit.scheduling.expireTime || '');
      } else {
        setStartDate('');
        setEndDate('');
        setPublishTime('');
        setExpireTime('');
      }

      if (blockToEdit.conditionalRendering) {
        setHasConditionalRule(true);
        setConditionType(blockToEdit.conditionalRendering.conditionType || 'live_matches_count');
        setConditionOperator(blockToEdit.conditionalRendering.operator || 'gt');
        setConditionValue(blockToEdit.conditionalRendering.value ?? 0);
        setFallbackWidgetType(blockToEdit.conditionalRendering.fallbackWidgetType || '');
      } else {
        setHasConditionalRule(false);
        setConditionType('live_matches_count');
        setConditionOperator('gt');
        setConditionValue(0);
        setFallbackWidgetType('');
      }

      if (blockToEdit.type === BlockType.LEAGUE_STANDINGS && blockToEdit.dataConfig) {
        const lId = String(blockToEdit.dataConfig.leagueId || '39');
        const isPopular = POPULAR_LEAGUES.some(l => l.id === lId);
        if (isPopular) {
          setSelectedLeagueId(lId);
        } else {
          setSelectedLeagueId('custom');
          setCustomLeagueId(lId);
        }
        setLeagueName((blockToEdit.dataConfig.leagueName as string) || 'الدوري الإنجليزي الممتاز');
      }
    } else {
      // Defaults for creation
      setTitle('');
      setType(BlockType.HERO);
      setEnabled(true);
      setVisibleDesktop(true);
      setVisibleTablet(true);
      setVisibleMobile(true);
      setSelectedLeagueId('39');
      setCustomLeagueId('');
      setLeagueName('الدوري الإنجليزي الممتاز');
      setColumns(1);
      setStyle('card');
      setDataSource('api');
      setAllowGuests(true);
      setAllowMembers(true);
      setAnimationType('fade');
      setAnimationDuration(0.4);
      setAnimationDelay(0);
      setStartDate('');
      setEndDate('');
      setPublishTime('');
      setExpireTime('');
      setHasConditionalRule(false);
      setConditionType('live_matches_count');
      setConditionOperator('gt');
      setConditionValue(0);
      setFallbackWidgetType('');

      // Advanced properties defaults
      setMaxItems(10);
      setFilterLeagueId('');
      setFilterNewsCategory('');
      setCustomHtmlCode('');
      setAdSlot('Home_Middle');
      setAdImageUrl('');
      setAdLinkUrl('');
      setShowMoreButton(false);
      setMoreButtonLabel('مشاهدة المزيد ↗');
      setMoreButtonUrl('');

      // Styles defaults
      setBackgroundColor('');
      setTextColor('');
      setTitleColor('');
      setAccentColor('');
      setFontFamily('');
      setBorderRadius('');
      setBorderStyle('none');
      setBorderWidth('1px');
      setShadowIntensity('none');
      setHoverEffect('none');
      setPaddingSize('standard');
      setSubtitle('');
      setTitleSize('text-sm');
      setTitleWeight('font-black');
      setTitleAlign('text-right');
      setTitleIcon('None');
      setSkeletonType('pulsing');
      setBgGradient(false);
      setBgGradientStart('#0e1622');
      setBgGradientEnd('#070b11');
    }
  }, [blockToEdit]);

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setBackgroundColor(preset.backgroundColor);
    setTextColor(preset.textColor);
    setTitleColor(preset.titleColor);
    setAccentColor(preset.accentColor);
    setBorderStyle(preset.borderStyle);
  };

  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedLeagueId(val);
    if (val !== 'custom') {
      const found = POPULAR_LEAGUES.find(l => l.id === val);
      if (found) {
        setLeagueName(found.name);
      }
    }
  };

  const saveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('الرجاء إدخال عنوان القسم');
      return;
    }

    const dataConfig: Record<string, any> = {
      maxItems: Number(maxItems),
      filterLeagueId,
      filterNewsCategory,
      customHtmlCode,
      adSlot,
      imageUrl: adImageUrl,
      linkUrl: adLinkUrl,
      showMoreButton,
      moreButtonLabel,
      moreButtonUrl
    };
    if (type === BlockType.LEAGUE_STANDINGS) {
      dataConfig.leagueId = selectedLeagueId === 'custom' ? customLeagueId : selectedLeagueId;
      dataConfig.leagueName = leagueName;
    }

    const widgetDef = {
      id: blockToEdit ? `widget-${blockToEdit.id}` : `widget-new-${Date.now()}`,
      type,
      title,
      status: enabled ? 'active' as const : 'inactive' as const,
      order: 10,
      dataSource,
      layout: {
        width: columns === 2 ? 'half' : columns === 3 ? 'third' : 'full',
        spacing: 'gap-4',
        alignment: 'center' as const
      },
      visibility: {
        desktop: visibleDesktop,
        tablet: visibleTablet,
        mobile: visibleMobile
      },
      permissions: {
        guests: allowGuests,
        members: allowMembers
      },
      responsiveSettings: {
        mobileColumns: 1,
        tabletColumns: columns,
        desktopColumns: columns
      },
      cacheSettings: {
        durationMinutes: 5
      },
      animation: {
        type: animationType,
        duration: animationDuration,
        delay: animationDelay
      },
      scheduling: {
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(publishTime && { publishTime }),
        ...(expireTime && { expireTime })
      },
      dataConfig,
      ...(hasConditionalRule && {
        conditionalRendering: {
          conditionType,
          operator: conditionOperator,
          value: Number(conditionValue),
          fallbackWidgetType
        }
      })
    };

    const rowPayload = {
      id: blockToEdit ? `row-${blockToEdit.id}` : `row-${Date.now()}`,
      spacing: 'gap-6',
      alignment: 'items-start',
      columns: [
        {
          id: blockToEdit ? `col-${blockToEdit.id}` : `col-${Date.now()}`,
          width: columns === 2 ? 'w-full md:w-1/2' : columns === 3 ? 'w-full md:w-1/3' : 'w-full',
          widgets: [widgetDef]
        }
      ]
    };

    const payload: any = {
      title,
      type,
      internalName: title.toLowerCase().replace(/\s/g, '_'),
      displayOrder: blockToEdit ? blockToEdit.displayOrder : Date.now(),
      enabled,
      dataSource,
      visibility: {
        desktop: visibleDesktop,
        tablet: visibleTablet,
        mobile: visibleMobile
      },
      permissions: {
        guests: allowGuests,
        members: allowMembers
      },
      dataConfig,
      styleConfig: {
        backgroundColor,
        textColor,
        titleColor,
        accentColor,
        fontFamily,
        borderRadius,
        borderStyle,
        borderWidth,
        shadowIntensity,
        hoverEffect,
        paddingSize,
        subtitle,
        titleSize,
        titleWeight,
        titleAlign,
        titleIcon,
        skeletonType,
        bgGradient,
        bgGradientStart,
        bgGradientEnd
      },
      layoutConfig: {
        columns,
        style
      },
      cacheConfig: {
        durationMinutes: 5
      },
      animation: {
        type: animationType,
        duration: animationDuration,
        delay: animationDelay
      },
      scheduling: {
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(publishTime && { publishTime }),
        ...(expireTime && { expireTime })
      },
      ...(hasConditionalRule && {
        conditionalRendering: {
          conditionType,
          operator: conditionOperator,
          value: Number(conditionValue),
          fallbackWidgetType
        }
      }),
      seo: {
        index: true
      },
      analytics: blockToEdit?.analytics || { views: 0, clicks: 0 },
      rows: [rowPayload]
    };

    try {
      if (blockToEdit) {
        await updateDoc(doc(db, 'homepage_blocks', blockToEdit.id), payload);
      } else {
        await addDoc(collection(db, 'homepage_blocks'), payload);
      }
      clearHomepageCache();
      onSave();
    } catch (err) {
      console.error("Error saving block: ", err);
      alert('حدث خطأ أثناء حفظ القسم بقاعدة البيانات.');
    }
  };

  const getFriendlyTypeName = (t: BlockType) => {
    switch (t) {
      case BlockType.HERO: return 'المباراة المميزة (Hero)';
      case BlockType.BENTO_ACTIONS: return 'صندوق الوصول السريع (Bento)';
      case BlockType.LIVE_MATCHES: return 'المباريات الحية والجارية الآن (Live)';
      case BlockType.BREAKING_NEWS: return 'كأس العالم ٢٠٢٦ (World Cup Banner)';
      case BlockType.LEAGUE_STANDINGS: return 'جدول ترتيب الدوري (Standings)';
      case BlockType.LATEST_NEWS: return 'آخر الأخبار الرياضية (Latest)';
      case BlockType.TODAY_MATCHES: return 'جدول مباريات اليوم بالكامل (Today)';
      case BlockType.TOMORROW_MATCHES: return 'جدول مباريات الغد (Tomorrow)';
      case BlockType.FINISHED_MATCHES: return 'مباريات منتهية مسبقاً (Finished)';
      case BlockType.FEATURED_NEWS: return 'الأخبار المميزة (Featured News)';
      case BlockType.TRENDING_NEWS: return 'الأخبار الرائجة (Trending)';
      case BlockType.LEAGUES: return 'قائمة الدوريات الرئيسية (Leagues)';
      case BlockType.TOP_PLAYERS: return 'إحصائيات وأفضل اللاعبين (Top Players)';
      case BlockType.ADS: return 'مساحة إعلانية مخصصة (Ads Banner)';
      case BlockType.VIDEOS: return 'مقاطع الفيديو والأهداف (Videos)';
      case BlockType.CUSTOM_WIDGETS: return 'أداة مخصصة (Custom HTML Embed)';
      default: return String(t);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 text-gray-100" dir="rtl">
      {/* Editor Main Controls (8 Columns) */}
      <form onSubmit={saveBlock} className="xl:col-span-8 bg-[#0e1622] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Settings className="text-primary animate-spin-slow" size={22} />
              <span>{blockToEdit ? 'محرر ومصمم المكونات الذكي V2' : 'توليد وتخطيط مكون جديد بالكامل'}</span>
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">تحكم مطلق بجميع خصائص المكون وقواعد بياناته وتصميمه ومسار حركته الفورية.</p>
          </div>
          <button 
            type="button" 
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition text-xs font-bold"
          >
            إلغاء التعديل
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#070b11] rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'content' ? 'bg-primary text-black shadow-md font-extrabold' : 'text-gray-400 hover:text-white'}`}
          >
            <Layers size={14} />
            <span>١. بنية المكون الأساسي</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('design')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'design' ? 'bg-primary text-black shadow-md font-extrabold' : 'text-gray-400 hover:text-white'}`}
          >
            <PaletteIcon size={14} />
            <span>٢. الهوية والسمات والألوان</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logic')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'logic' ? 'bg-primary text-black shadow-md font-extrabold' : 'text-gray-400 hover:text-white'}`}
          >
            <Clock size={14} />
            <span>٣. جدولة وعرض شرطي</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'advanced' ? 'bg-primary text-black shadow-md font-extrabold' : 'text-gray-400 hover:text-white'}`}
          >
            <Code size={14} />
            <span>٤. بيانات وكود مخصص</span>
          </button>
        </div>

        {/* TAB 1: Content Structure */}
        {activeTab === 'content' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Section Title */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block">العنوان المعروض (Section Title)</label>
                <input 
                  type="text"
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition" 
                  placeholder="مثال: مباريات اليوم المباشرة" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Widget Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block">نوع محتوى الكتلة (Widget Type)</label>
                <select 
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition" 
                  value={type} 
                  onChange={(e) => setType(e.target.value as BlockType)}
                >
                  <option value={BlockType.HERO}>المباراة المميزة (Hero Match)</option>
                  <option value={BlockType.LIVE_MATCHES}>المباريات الجارية حالياً بث مباشر (Live Now)</option>
                  <option value={BlockType.TODAY_MATCHES}>مباريات اليوم بالكامل (Today Fixtures)</option>
                  <option value={BlockType.TOMORROW_MATCHES}>مباريات الغد (Tomorrow Fixtures)</option>
                  <option value={BlockType.FINISHED_MATCHES}>مباريات الأمس والمنتهية (Finished Matches)</option>
                  <option value={BlockType.LATEST_NEWS}>آخر الأخبار الرياضية (Latest News)</option>
                  <option value={BlockType.FEATURED_NEWS}>الأخبار والتقارير المميزة (Featured News)</option>
                  <option value={BlockType.TRENDING_NEWS}>الأخبار الأكثر قراءة (Trending News)</option>
                  <option value={BlockType.BREAKING_NEWS}>لوحة كأس العالم ٢٠٢٦ (World Cup Section)</option>
                  <option value={BlockType.LEAGUE_STANDINGS}>جدول ترتيب الدوري (League Standings)</option>
                  <option value={BlockType.LEAGUES}>قائمة الدوريات والبطولات (Leagues Fast Access)</option>
                  <option value={BlockType.TOP_PLAYERS}>هدافي الدوري وصناع اللعب (Top Players)</option>
                  <option value={BlockType.BENTO_ACTIONS}>قصص وصندوق وصول بينتو سريع (Bento Widget)</option>
                  <option value={BlockType.ADS}>مساحة إعلانية / راعي ممول (Ads Banner)</option>
                  <option value={BlockType.VIDEOS}>أهداف اللقاءات ومقاطع فيديو (Videos highlights)</option>
                  <option value={BlockType.CUSTOM_WIDGETS}>كود برمجى ذكى مخصص (HTML/JS Code Embed)</option>
                </select>
              </div>
            </div>

            {/* Extended Title Properties */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#070b11]/30 p-4 border border-white/5 rounded-2xl">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] text-gray-400 font-bold block">العنوان الفرعي التوضيحي (Section Subtitle)</label>
                <input 
                  type="text"
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition" 
                  placeholder="مثال: أهم مواجهات الكلاسيكو اليوم بتغطية حصرية مباشرة" 
                  value={subtitle} 
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">أيقونة القسم (Section Icon)</label>
                <select
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  value={titleIcon}
                  onChange={(e) => setTitleIcon(e.target.value)}
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

              <div className="space-y-1.5 md:col-span-3">
                <label className="text-[10px] text-gray-400 font-bold block">محاذاة العنوان والرمز الفرعي (Title Alignment)</label>
                <div className="grid grid-cols-3 gap-2 bg-[#070b11] border border-white/10 rounded-xl p-1.5 h-10 items-center">
                  <button
                    type="button"
                    onClick={() => setTitleAlign('text-right')}
                    className={`text-[10px] py-1 rounded-lg transition-all ${titleAlign === 'text-right' ? 'bg-primary text-black font-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    يمين (أيمن)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTitleAlign('text-center')}
                    className={`text-[10px] py-1 rounded-lg transition-all ${titleAlign === 'text-center' ? 'bg-primary text-black font-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    وسط (متوسط)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTitleAlign('text-left')}
                    className={`text-[10px] py-1 rounded-lg transition-all ${titleAlign === 'text-left' ? 'bg-primary text-black font-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    يسار (أيسر)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Columns config */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block">تقسيم العرض للأعمدة (Responsive Columns Grid)</label>
                <select 
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition"
                  value={columns}
                  onChange={(e) => setColumns(Number(e.target.value))}
                >
                  <option value={1}>عرض كامل للصفحة (Full Width Block)</option>
                  <option value={2}>عمودين جانبيين متساويين (2 Columns Side-by-Side)</option>
                  <option value={3}>ثلاثة أعمدة متجاورة بالتساوي (3 Columns Grid)</option>
                </select>
              </div>

              {/* Layout Style */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block">النمط البصري للهيكل (Container Layout Style)</label>
                <select 
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition"
                  value={style}
                  onChange={(e: any) => setStyle(e.target.value)}
                >
                  <option value="card">تغذية بطاقات متتالية (Cards Feed)</option>
                  <option value="carousel">شريط تفاعلي متحرك أوتوماتيكياً (Carousel Carousel)</option>
                  <option value="slider">عرض منزلق بنمط سحاب (Slider Swiper)</option>
                  <option value="bento">بينتو شبكي متداخل ذكي (Bento Grid Layout)</option>
                  <option value="magazine">نمط المجلات العريضة والتحليلات (Magazine Layout)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Permissions */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block">رؤية المكون حسب رتبة العضوية</label>
                <div className="grid grid-cols-2 gap-4 bg-[#070b11] border border-white/10 rounded-xl p-3 h-12 items-center">
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={allowGuests} 
                      onChange={(e) => setAllowGuests(e.target.checked)}
                      className="rounded border-white/10 bg-[#070b11] text-primary focus:ring-primary h-4 w-4" 
                    />
                    <span>الزوار والضيوف (Guests)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={allowMembers} 
                      onChange={(e) => setAllowMembers(e.target.checked)}
                      className="rounded border-white/10 bg-[#070b11] text-primary focus:ring-primary h-4 w-4" 
                    />
                    <span>الأعضاء المسجلين (Members)</span>
                  </label>
                </div>
              </div>

              {/* Status toggles */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block">الأجهزة المسموح عرض المكون بها</label>
                <div className="flex items-center gap-5 bg-[#070b11] border border-white/10 rounded-xl p-3 h-12 justify-center">
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={visibleDesktop} 
                      onChange={(e) => setVisibleDesktop(e.target.checked)}
                      className="rounded border-white/10 bg-[#070b11] text-primary focus:ring-primary h-3.5 w-3.5" 
                    />
                    <Monitor size={12} className="text-gray-400" />
                    <span>كمبيوتر</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={visibleTablet} 
                      onChange={(e) => setVisibleTablet(e.target.checked)}
                      className="rounded border-white/10 bg-[#070b11] text-primary focus:ring-primary h-3.5 w-3.5" 
                    />
                    <Tablet size={12} className="text-gray-400" />
                    <span>تابلت</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={visibleMobile} 
                      onChange={(e) => setVisibleMobile(e.target.checked)}
                      className="rounded border-white/10 bg-[#070b11] text-primary focus:ring-primary h-3.5 w-3.5" 
                    />
                    <Smartphone size={12} className="text-gray-400" />
                    <span>جوال</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-white">تفعيل البث المباشر الفوري لقسم الصفحة الرئيسية</h4>
                <p className="text-[10px] text-gray-400 leading-normal">في حال التعطيل؛ سيختفي هذا المكون نهائياً لجميع الزوار فوراً.</p>
              </div>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`w-14 h-7 rounded-full transition-colors relative flex items-center p-1 ${enabled ? 'bg-primary' : 'bg-gray-700'}`}
              >
                <div className={`w-5 h-5 bg-[#0e1622] rounded-full shadow-md transform transition-transform duration-200 ${enabled ? '-translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Advanced Design & Themes */}
        {activeTab === 'design' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Presets Gallery */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 block">مكتبة قوالب الألوان والتصميم الجاهزة</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                {COLOR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyColorPreset(preset)}
                    className="p-2.5 bg-[#070b11] border border-white/5 hover:border-primary/50 text-right rounded-xl transition flex flex-col gap-1 text-[10px]"
                  >
                    <span className="font-bold text-white leading-normal">{preset.name}</span>
                    <div className="flex gap-1.5 mt-1">
                      <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: preset.backgroundColor || '#080808' }}></span>
                      <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: preset.titleColor || '#ffd700' }}></span>
                      <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: preset.accentColor || '#10b981' }}></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#070b11]/50 p-4 border border-white/5 rounded-2xl">
              {/* Bg Color */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">لون الخلفية المخصص</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-7 h-7 bg-transparent rounded cursor-pointer shrink-0" />
                  <input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono" placeholder="#000000" />
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">لون النصوص التفصيلية</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-7 h-7 bg-transparent rounded cursor-pointer shrink-0" />
                  <input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono" placeholder="#ffffff" />
                </div>
              </div>

              {/* Title Color */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">لون العناوين الرئيسية</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="w-7 h-7 bg-transparent rounded cursor-pointer shrink-0" />
                  <input type="text" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono" placeholder="#ffd700" />
                </div>
              </div>

              {/* Accent/Border Glow Color */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">لون التوهج والحدود</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-7 h-7 bg-transparent rounded cursor-pointer shrink-0" />
                  <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono" placeholder="#a855f7" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Font Family */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block">نوع الخط التعبيري (Typography Font)</label>
                <select 
                  value={fontFamily} 
                  onChange={(e) => setFontFamily(e.target.value)} 
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition"
                >
                  <option value="">خط النظام الافتراضي (Inter Arabic)</option>
                  <option value="'Cairo', sans-serif">خط القاهرة الفاخر (Cairo Bold)</option>
                  <option value="'Tajawal', sans-serif">خط تجول الحديث المبسط (Tajawal)</option>
                  <option value="sans-serif">Sans-Serif الرياضي الحديث</option>
                  <option value="monospace">Monospace التقني للاحصائيات</option>
                </select>
              </div>

              {/* Border Radius */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block">حواف واستدارة الزوايا (Border Radius)</label>
                <input 
                  type="text" 
                  value={borderRadius} 
                  onChange={(e) => setBorderRadius(e.target.value)} 
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition" 
                  placeholder="مثال: 1.5rem أو 24px" 
                />
              </div>

              {/* Container Padding */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block">هوامش الحشو الداخلي للكتلة (Internal Padding)</label>
                <select 
                  value={paddingSize} 
                  onChange={(e) => setPaddingSize(e.target.value)} 
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition"
                >
                  <option value="standard">هامش قياسي متناسق (Balanced - 1.5rem)</option>
                  <option value="compact">هامش مدمج وذكي (Compact - 0.75rem)</option>
                  <option value="spacious">هامش واسع عريض (Spacious - 2rem)</option>
                  <option value="none">بدون أي حواف أو هوامش داخلية (None - 0)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#070b11]/50 p-4 border border-white/5 rounded-2xl">
              {/* Border Style */}
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-[10px] text-gray-400 font-bold block">هيكل ونمط الحدود (Border Outline Style)</label>
                <select 
                  value={borderStyle} 
                  onChange={(e) => setBorderStyle(e.target.value)} 
                  className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <option value="none">بدون حدود خارجية (None)</option>
                  <option value="solid">خط حاد متصل (Solid Outline)</option>
                  <option value="dashed">خط منقط / متقطع (Dashed Outline)</option>
                  <option value="double">خط ممتد مزدوج فاخر (Double Outline)</option>
                </select>
              </div>

              {/* Border Width */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">سمك حدود الإطار</label>
                <select 
                  value={borderWidth} 
                  onChange={(e) => setBorderWidth(e.target.value)} 
                  className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <option value="1px">رفيع (1px)</option>
                  <option value="2px">متوسط (2px)</option>
                  <option value="3px">عريض (3px)</option>
                  <option value="4px">سميك عريض جداً (4px)</option>
                </select>
              </div>

              {/* Shadow Intensity */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">مستوى ونمط الظل والتوهج</label>
                <select 
                  value={shadowIntensity} 
                  onChange={(e) => setShadowIntensity(e.target.value)} 
                  className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <option value="none">بدون أي ظلال (Flat)</option>
                  <option value="subtle">ظل ناعم خفيف (Subtle Shadow)</option>
                  <option value="medium">ظل غامق عميق (Medium Shadow)</option>
                  <option value="glow">توهج خلفي خفيف (Soft Highlight Glow)</option>
                  <option value="glow_intense">توهج حاد ثلاثي الأبعاد (Super Intense Glow)</option>
                </select>
              </div>
            </div>

            {/* Hover Effects & Microinteractions */}
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-primary flex items-center gap-1.5">
                <Sparkles size={14} className="animate-bounce" />
                <span>التفاعلات وحركات تمرير الماوس التلقائية (Interactive Hover Effects)</span>
              </h4>
              <p className="text-[10px] text-gray-400">حدد الإجراء البصري الفوري عند قيام المستخدم بتمرير الماوس فوق هذا القسم لزيادة تفاعل المستخدم.</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                <label className="p-3 bg-[#070b11] border border-white/5 hover:border-primary/20 rounded-xl cursor-pointer flex items-center gap-2.5">
                  <input type="radio" name="hoverEffect" checked={hoverEffect === 'none'} onChange={() => setHoverEffect('none')} className="text-primary focus:ring-0" />
                  <span className="text-[11px] font-bold">تأثير ثابت (None)</span>
                </label>
                <label className="p-3 bg-[#070b11] border border-white/5 hover:border-primary/20 rounded-xl cursor-pointer flex items-center gap-2.5">
                  <input type="radio" name="hoverEffect" checked={hoverEffect === 'scale'} onChange={() => setHoverEffect('scale')} className="text-primary focus:ring-0" />
                  <span className="text-[11px] font-bold">تكبير وارتفاع طفيف (Scale)</span>
                </label>
                <label className="p-3 bg-[#070b11] border border-white/5 hover:border-primary/20 rounded-xl cursor-pointer flex items-center gap-2.5">
                  <input type="radio" name="hoverEffect" checked={hoverEffect === 'glow'} onChange={() => setHoverEffect('glow')} className="text-primary focus:ring-0" />
                  <span className="text-[11px] font-bold">توهج هالة الإطار (Glow)</span>
                </label>
                <label className="p-3 bg-[#070b11] border border-white/5 hover:border-primary/20 rounded-xl cursor-pointer flex items-center gap-2.5">
                  <input type="radio" name="hoverEffect" checked={hoverEffect === 'lift'} onChange={() => setHoverEffect('lift')} className="text-primary focus:ring-0" />
                  <span className="text-[11px] font-bold">إزاحة طيران للأعلى (Lift Up)</span>
                </label>
              </div>
            </div>

            {/* Title Size and Weight and Skeleton Loader */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#070b11]/30 p-4 border border-white/5 rounded-2xl">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">حجم خط العنوان (Title Font Size)</label>
                <select
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  value={titleSize}
                  onChange={(e) => setTitleSize(e.target.value)}
                >
                  <option value="text-xs">صغير جداً (Extra Small)</option>
                  <option value="text-sm">صغير (Small - Default)</option>
                  <option value="text-base">متوسط (Base)</option>
                  <option value="text-lg">متوسط كبير (Large)</option>
                  <option value="text-xl">كبير (Extra Large)</option>
                  <option value="text-2xl">كبير جداً (Double XL)</option>
                  <option value="text-3xl">ضخم (Triple XL)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">سمك خط العنوان (Title Font Weight)</label>
                <select
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  value={titleWeight}
                  onChange={(e) => setTitleWeight(e.target.value)}
                >
                  <option value="font-light">نحيف (Light)</option>
                  <option value="font-normal">عادي (Normal)</option>
                  <option value="font-medium">متوسط (Medium)</option>
                  <option value="font-semibold">شبه عريض (Semibold)</option>
                  <option value="font-bold">عريض (Bold)</option>
                  <option value="font-extrabold">عريض جداً (Extrabold)</option>
                  <option value="font-black">أسود داكن (Black - Default)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">مظهر حالة التحميل (Skeleton Loader Style)</label>
                <select
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  value={skeletonType}
                  onChange={(e) => setSkeletonType(e.target.value)}
                >
                  <option value="pulsing">ومضات نابضة ناعمة (Pulsing Card)</option>
                  <option value="shimmer">تموج ضوئي لامع (Shimmer Effect)</option>
                  <option value="none">بدون حالة تحميل (Instant/Static)</option>
                </select>
              </div>
            </div>

            {/* Background Gradient controls */}
            <div className="p-4 bg-[#070b11]/50 border border-white/5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    🎨 خلفية متدرجة انسيابية (Gradient Background Overlay)
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">استخدم خلفية متدرجة رائعة بدلاً من الألوان الثابتة السادة لجعل الصفحة حيوية.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBgGradient(!bgGradient)}
                  className={`px-3 py-1 bg-white/5 border rounded-xl text-[9px] font-bold transition ${bgGradient ? 'bg-primary/20 text-primary border-primary/30' : 'text-gray-400 border-white/5'}`}
                >
                  {bgGradient ? 'تعطيل التدرج' : 'تفعيل التدرج'}
                </button>
              </div>

              {bgGradient && (
                <div className="grid grid-cols-2 gap-4 animate-slideDown">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">لون بدء التدرج (Start Color)</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={bgGradientStart} onChange={(e) => setBgGradientStart(e.target.value)} className="w-7 h-7 bg-transparent rounded cursor-pointer shrink-0" />
                      <input type="text" value={bgGradientStart} onChange={(e) => setBgGradientStart(e.target.value)} className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">لون انتهاء التدرج (End Color)</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={bgGradientEnd} onChange={(e) => setBgGradientEnd(e.target.value)} className="w-7 h-7 bg-transparent rounded cursor-pointer shrink-0" />
                      <input type="text" value={bgGradientEnd} onChange={(e) => setBgGradientEnd(e.target.value)} className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Scheduling & Conditional Rendering */}
        {activeTab === 'logic' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Temporal Scheduling */}
            <div className="bg-[#070b11]/50 p-4 border border-white/5 rounded-2xl space-y-4">
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-2">
                  <Calendar size={14} className="text-primary" />
                  <span>الجدولة الزمنية التلقائية للبث والظهور (Temporal Scheduling Window)</span>
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  يمكنك تحديد تاريخ بدء وانتهاء محددين لظهور القسم، أو نافذة زمنية يومية تتكرر تلقائياً. مفيد للغاية لعرض أقسام المباريات المباشرة بشكل مبرمج أثناء أوقات الاستوديو التحليلي والبث المباشر فقط.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold block">تاريخ بدء النشر والظهور</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold block">تاريخ انتهاء النشر والإخفاء</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold block">بدء البث اليومي (توقيت)</label>
                  <input
                    type="time"
                    className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right"
                    value={publishTime}
                    onChange={(e) => setPublishTime(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold block">انتهاء البث اليومي (توقيت)</label>
                  <input
                    type="time"
                    className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right"
                    value={expireTime}
                    onChange={(e) => setExpireTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Conditional Logic Engine */}
            <div className="bg-[#070b11]/50 p-4 border border-white/5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-black text-white flex items-center gap-2">
                    <Clock size={14} className="text-primary animate-pulse" />
                    <span>محرك وقواعد العرض الشرطي (Conditional Layout Engine)</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                    توليد شروط تراجع ذكية لإظهار أو إخفاء القسم تلقائياً بناءً على معطيات الخادم الحية.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHasConditionalRule(!hasConditionalRule)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition border ${hasConditionalRule ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-gray-400 border-white/5'}`}
                >
                  {hasConditionalRule ? 'تعطيل محرك الشروط' : 'تفعيل شرط العرض الذكي'}
                </button>
              </div>

              {hasConditionalRule && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#070b11] rounded-xl border border-white/5 animate-slideUp">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block">الشرط يعتمد على</label>
                    <select
                      className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary"
                      value={conditionType}
                      onChange={(e: any) => setConditionType(e.target.value)}
                    >
                      <option value="live_matches_count">عدد المباريات الحية والنشطة حالياً</option>
                      <option value="always">عرض دائم دون شروط</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block">المقارنة الرياضية</label>
                    <select
                      className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary"
                      value={conditionOperator}
                      onChange={(e: any) => setConditionOperator(e.target.value)}
                    >
                      <option value="gt">أكبر من (&gt;)</option>
                      <option value="eq">يساوي بدقة (==)</option>
                      <option value="lt">أصغر من (&lt;)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block">القيمة للمقارنة</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary"
                      value={conditionValue}
                      onChange={(e) => setConditionValue(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block">مكون التراجع البديل في حال فشل الشرط</label>
                    <select
                      className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary"
                      value={fallbackWidgetType}
                      onChange={(e) => setFallbackWidgetType(e.target.value)}
                    >
                      <option value="">لا يوجد مكون بديل (إخفاء الكتلة بالكامل)</option>
                      <option value={BlockType.HERO}>المباراة المميزة (Hero Match)</option>
                      <option value={BlockType.BENTO_ACTIONS}>صندوق الوصول السريع (Bento)</option>
                      <option value={BlockType.LIVE_MATCHES}>المباريات الجارية حالياً بث مباشر</option>
                      <option value={BlockType.TODAY_MATCHES}>مباريات اليوم بالكامل</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Animations Module */}
            <div className="bg-[#070b11]/50 p-4 border border-white/5 rounded-2xl space-y-4">
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-2">
                  <Sparkles size={14} className="text-primary" />
                  <span>تأثيرات الحركة ومحرك التلاشي والدخول (Transition Animations)</span>
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  الحركات الرائعة تزيد من جاذبية التطبيق واحترافيته. يمكنك برمجة نوع الحركة الفورية عند تحميل زائر الموقع للصفحة الرئيسية.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold block">نوع وتأثير الحركة</label>
                  <select
                    className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition"
                    value={animationType}
                    onChange={(e: any) => setAnimationType(e.target.value)}
                  >
                    <option value="fade">تلاشي ودخول متقاطع (Fade In)</option>
                    <option value="slide">انزلاق مرن للأعلى (Slide Up)</option>
                    <option value="slide_right">انزلاق وتدفق من اليمين لليسار (Slide Right)</option>
                    <option value="zoom">تكبير ناعم وتمدد (Zoom In)</option>
                    <option value="spring">حركة مطاطية تفاعلية (Elastic Spring)</option>
                    <option value="none">بدون أي حركات (Static Instant)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold block">مدة الحركة الإجمالية (بالثواني)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="3"
                    className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right"
                    value={animationDuration}
                    onChange={(e) => setAnimationDuration(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold block">مهلة التأخير الزمني (بالثواني)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="2"
                    className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right"
                    value={animationDelay}
                    onChange={(e) => setAnimationDelay(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Advanced Properties & Custom Codes */}
        {activeTab === 'advanced' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#070b11]/50 p-4 border border-white/5 rounded-2xl">
              {/* Data Source */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 block">مصدر جلب البيانات للمكون (Data Source API)</label>
                <select 
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:border-primary focus:outline-none transition"
                  value={dataSource}
                  onChange={(e: any) => setDataSource(e.target.value)}
                >
                  <option value="api">قاعدة كاش الخلفية المباشرة للمباريات (Sport API Cache)</option>
                  <option value="firestore">قاعدة البيانات المحلية الفورية (GCP Firestore)</option>
                  <option value="rss">الربط التلقائي بأخبار روابط RSS Feed</option>
                  <option value="ai">محرك تنبؤات الذكاء الاصطناعي (Gemini Forecasts)</option>
                  <option value="manual">إدخال وبيانات يدوية مخصصة (Manual Data Input)</option>
                  <option value="mixed">قنوات متداخلة ومختلطة (Hybrid Stream)</option>
                </select>
              </div>

              {/* Max Items */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 block">الحد الأقصى للعناصر للعرض (Max Items Limit)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:border-primary focus:outline-none transition text-right"
                  value={maxItems}
                  onChange={(e) => setMaxItems(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Show More Navigation Button Section */}
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    🔗 زر التنقل والوصول "مشاهدة المزيد" (Show More CTA Button)
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">أضف زراً أسفل القسم ينقل الزوار إلى صفحة مخصصة لرؤية كل النتائج والمقالات.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMoreButton(!showMoreButton)}
                  className={`px-3 py-1 bg-white/5 border rounded-xl text-[9px] font-bold transition ${showMoreButton ? 'bg-primary/20 text-primary border-primary/30' : 'text-gray-400 border-white/5'}`}
                >
                  {showMoreButton ? 'تعطيل الزر' : 'تفعيل الزر'}
                </button>
              </div>

              {showMoreButton && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slideDown">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">نص زر التوجيه المعروض</label>
                    <input 
                      type="text"
                      className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none" 
                      placeholder="مثال: مشاهدة جدول الترتيب الكامل ↗"
                      value={moreButtonLabel}
                      onChange={(e) => setMoreButtonLabel(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">رابط التوجيه (Target Destination URL)</label>
                    <input 
                      type="text"
                      className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none" 
                      placeholder="مثال: /standings/premier-league أو /news"
                      value={moreButtonUrl}
                      onChange={(e) => setMoreButtonUrl(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic fields based on Type chosen */}
            {type === BlockType.LEAGUE_STANDINGS && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-primary flex items-center gap-1.5">
                  📊 تهيئة وإعدادات تصفية جدول ترتيب الدوري
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block">اختر الدوري المعني</label>
                    <select
                      className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                      value={selectedLeagueId}
                      onChange={handleLeagueChange}
                    >
                      {POPULAR_LEAGUES.map(league => (
                        <option key={league.id} value={league.id}>{league.name}</option>
                      ))}
                      <option value="custom">دوري آخر مخصص برقم ID محدد</option>
                    </select>
                  </div>

                  {selectedLeagueId === 'custom' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-bold block">معرف الدوري (API League ID)</label>
                      <input
                        type="text"
                        className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs"
                        placeholder="مثال: 39"
                        value={customLeagueId}
                        onChange={(e) => setCustomLeagueId(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block">اسم الدوري للزوار</label>
                    <input
                      type="text"
                      className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs"
                      placeholder="مثال: ترتيب الدوري الإنجليزي الممتاز"
                      value={leagueName}
                      onChange={(e) => setLeagueName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* News and Articles types */}
            {(type === BlockType.LATEST_NEWS || type === BlockType.FEATURED_NEWS || type === BlockType.TRENDING_NEWS || type === BlockType.BREAKING_NEWS) && (
              <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                  📰 تصفية وتغذية مقالات الأخبار (News Engine Stream)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block">تصفية حسب معرف الدوري (League ID - اختياري)</label>
                    <input
                      type="text"
                      className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                      placeholder="مثال: 39 لقصر الأخبار على الدوري الإنجليزي فقط"
                      value={filterLeagueId}
                      onChange={(e) => setFilterLeagueId(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block">تصنيف ونوع الأخبار الحصرية</label>
                    <select
                      className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                      value={filterNewsCategory}
                      onChange={(e) => setFilterNewsCategory(e.target.value)}
                    >
                      <option value="">جميع التصنيفات والمقالات بلا تصفية (All Category)</option>
                      <option value="breaking">أخبار عاجلة عاجلة (Breaking News)</option>
                      <option value="featured">أخبار وتغطية مميزة (Featured News)</option>
                      <option value="trending">أخبار رائجة وتفاعل (Trending)</option>
                      <option value="transfers">سوق الانتقالات والميركاتو (Transfers)</option>
                      <option value="analyses">التحليلات والمقالات الفنية (Analyses)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Ads and Spnsorship */}
            {type === BlockType.ADS && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  📢 إعدادات الإعلان والراعي والروابط التوجيهية
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block">موضع وموقع الإعلان التلقائي</label>
                    <select
                      className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs"
                      value={adSlot}
                      onChange={(e) => setAdSlot(e.target.value)}
                    >
                      <option value="Home_Top">أعلى الصفحة الرئيسية (Home_Top)</option>
                      <option value="Home_Middle">منتصف الصفحة الرئيسية (Home_Middle)</option>
                      <option value="Home_Bottom">أسفل الصفحة الرئيسية (Home_Bottom)</option>
                      <option value="Sidebar_Top">أعلى شريط الجانب (Sidebar_Top)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block">رابط صورة البانر الإعلاني (Image URL)</label>
                    <input
                      type="url"
                      className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs"
                      placeholder="https://example.com/banner.png"
                      value={adImageUrl}
                      onChange={(e) => setAdImageUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold block">رابط الهبوط والتوجيه عند الضغط (Landing URL)</label>
                    <input
                      type="url"
                      className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs"
                      placeholder="https://example.com/landing-page"
                      value={adLinkUrl}
                      onChange={(e) => setAdLinkUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Custom Widgets Code */}
            {type === BlockType.CUSTOM_WIDGETS && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                    <Terminal size={14} />
                    <span>رمز المكون البرمجي المخصص (HTML / Tailwind CSS Embed)</span>
                  </h4>
                  {/* Prefill templates */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-gray-500 font-bold">قوالب جاهزة:</span>
                    {CUSTOM_WIDGET_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if(confirm(`هل أنت متأكد من رغبتك في استبدال الكود الحالي بكود قالب "${tmpl.name}"؟`)) {
                            setCustomHtmlCode(tmpl.code);
                          }
                        }}
                        className="px-2 py-1 bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-300 rounded text-[9px] font-bold border border-white/5 transition"
                      >
                        {tmpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <textarea
                    className="w-full bg-[#070b11] border border-white/10 rounded-xl p-4 text-[11px] focus:border-primary focus:outline-none transition h-48 font-mono leading-relaxed"
                    placeholder="<!-- اكتب كود HTML مدمجاً معه كلاسات Tailwind CSS مباشرة هنا... -->"
                    value={customHtmlCode}
                    onChange={(e) => setCustomHtmlCode(e.target.value)}
                  />
                  <div className="text-[9px] text-gray-400 flex items-start gap-1 p-1 bg-white/5 rounded-lg border border-white/5">
                    <Info size={11} className="text-primary shrink-0 mt-0.5" />
                    <span>يمكنك إدراج أكواد الميركاتو الحية، استطلاعات الرأي الخارجية، أكواد شبكات البث ومواقع السوشيال ميديا بالكامل هنا وستظهر فوراً بمرونة مطلقة.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Footer Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-300 transition"
          >
            إلغاء التراجع
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-black rounded-xl text-xs font-black transition shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Save size={15} />
            <span>{blockToEdit ? 'تعديل وحفظ التغييرات الآن' : 'بناء ونشر الكتلة فورياً'}</span>
          </button>
        </div>
      </form>

      {/* Real-time Dynamic visual preview panel (4 Columns) */}
      <div className="xl:col-span-4 space-y-6">
        <div className="bg-[#0e1622] border border-white/10 rounded-[2.5rem] p-5 sticky top-6 shadow-2xl space-y-5">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="text-xs font-black text-white flex items-center gap-1.5">
              <Eye size={14} className="text-primary animate-pulse" />
              <span>المعاينة الحية الفورية للتصميم</span>
            </h3>
            <span className="text-[9px] text-gray-500 font-bold font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">Live View</span>
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
            تعكس هذه الشاشات الصغيرة محاكاة حية لطريقة ظهور القسم المصمم على موقع الويب المباشر للمشجعين لتجنب عيوب وتناقضات الألوان.
          </p>

          {/* Render Mock Preview Component */}
          <div 
            className="w-full border overflow-hidden transition-all duration-300 text-right space-y-3 p-4"
            style={{
              background: bgGradient ? `linear-gradient(135deg, ${bgGradientStart}, ${bgGradientEnd})` : (backgroundColor || '#0e1622'),
              color: textColor || '#94a3b8',
              fontFamily: fontFamily || 'Inter',
              borderRadius: borderRadius || '1.5rem',
              border: borderStyle !== 'none' ? `${borderWidth} ${borderStyle} ${accentColor || 'rgba(255,255,255,0.1)'}` : '1px solid rgba(255,255,255,0.05)',
              boxShadow: shadowIntensity === 'subtle' ? '0 4px 12px rgba(0,0,0,0.3)' : shadowIntensity === 'medium' ? '0 8px 24px rgba(0,0,0,0.4)' : shadowIntensity === 'glow' ? `0 0 15px ${accentColor || '#ffd700'}22` : shadowIntensity === 'glow_intense' ? `0 0 25px ${accentColor || '#ffd700'}44` : 'none',
              padding: paddingSize === 'compact' ? '0.75rem' : paddingSize === 'spacious' ? '2rem' : paddingSize === 'none' ? '0' : '1.25rem'
            }}
          >
            {/* Header Area */}
            <div className={`flex flex-col gap-1 border-b border-white/5 pb-2 ${titleAlign}`}>
              <div className="flex justify-between items-center flex-row-reverse w-full gap-2">
                <span className="text-[8px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">
                  {style.toUpperCase()}
                </span>
                <div className="flex items-center gap-1.5">
                  {titleIcon !== 'None' && <span className="text-xs">{titleIcon === 'Trophy' ? '🏆' : titleIcon === 'Flame' ? '🔥' : titleIcon === 'Sparkles' ? '✨' : titleIcon === 'Activity' ? '📈' : titleIcon === 'Tv' ? '📺' : titleIcon === 'TrendingUp' ? '⚡' : titleIcon === 'Newspaper' ? '📰' : ''}</span>}
                  <h4 
                    className={`${titleSize} ${titleWeight}`}
                    style={{ color: titleColor || '#ffffff' }}
                  >
                    {title || 'عنوان القسم الافتراضي'}
                  </h4>
                </div>
              </div>
              {subtitle && (
                <p className="text-[9px] text-gray-400 font-medium leading-normal mt-0.5">{subtitle}</p>
              )}
            </div>

            {/* Mock content rendering depending on chosen widget type */}
            <div className="py-2.5 text-[11px] leading-relaxed space-y-2">
              {type === BlockType.HERO && (
                <div className="bg-black/30 border border-white/5 p-3 rounded-xl space-y-1 text-center">
                  <div className="text-[9px] font-black text-amber-400">🔥 مباراة اليوم الكبرى المباشرة</div>
                  <div className="flex justify-center items-center gap-3 font-bold text-[10px] text-white py-1">
                    <span>الهلال السعودي</span>
                    <span className="px-2 py-0.5 bg-red-500 text-white rounded text-[8px] animate-pulse">LIVE</span>
                    <span>النصر السعودي</span>
                  </div>
                  <div className="text-[9px] text-gray-400">استوديو تحليلي متميز وبث فائق الجودة</div>
                </div>
              )}

              {type === BlockType.LIVE_MATCHES && (
                <div className="space-y-1.5">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl flex justify-between items-center text-[10px]">
                    <span className="text-white font-bold">ريال مدريد (٢ - ١) ميلان</span>
                    <span className="text-emerald-400 font-bold animate-pulse">دقيقة '74</span>
                  </div>
                  <div className="bg-[#070b11] border border-white/5 p-2.5 rounded-xl flex justify-between items-center text-[10px]">
                    <span className="text-white font-bold">الأهلي المصري (٠ - ٠) الهلال</span>
                    <span className="text-amber-400 font-bold">دقيقة '12</span>
                  </div>
                </div>
              )}

              {type === BlockType.LEAGUE_STANDINGS && (
                <div className="space-y-1 text-right">
                  <div className="text-[10px] font-black text-white bg-white/5 p-1 px-2 rounded mb-1">
                    🏆 {leagueName || 'جدول ترتيب الدوري الإنجليزي'} (ID: {selectedLeagueId === 'custom' ? customLeagueId : selectedLeagueId})
                  </div>
                  <div className="grid grid-cols-6 gap-1 text-[9px] font-semibold text-gray-400 border-b border-white/5 pb-1 px-1">
                    <span className="col-span-3 text-right">الفريق</span>
                    <span>لعب</span>
                    <span>فرق</span>
                    <span>نقاط</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1 text-[9px] text-white px-1">
                    <span className="col-span-3 font-bold text-amber-400 text-right">1. ريال مدريد</span>
                    <span>24</span>
                    <span>+32</span>
                    <span className="font-bold">64</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1 text-[9px] text-white px-1">
                    <span className="col-span-3 font-bold text-right">2. جيرونا</span>
                    <span>24</span>
                    <span>+15</span>
                    <span className="font-bold">51</span>
                  </div>
                </div>
              )}

              {(type === BlockType.LATEST_NEWS || type === BlockType.FEATURED_NEWS || type === BlockType.TRENDING_NEWS || type === BlockType.BREAKING_NEWS) && (
                <div className="space-y-2">
                  <div className="flex gap-2.5 items-start">
                    <div className="w-12 h-10 bg-white/10 rounded-lg shrink-0 object-cover overflow-hidden" />
                    <div className="space-y-1">
                      <h5 className="text-[10px] font-bold text-white leading-normal line-clamp-1">خبر عاجل ومفاجئ في كواليس الميركاتو الرياضي</h5>
                      <span className="text-[8px] text-gray-500 font-bold">منذ ٤٥ دقيقة • {filterNewsCategory || 'الأخبار العامة'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <div className="w-12 h-10 bg-white/10 rounded-lg shrink-0 object-cover overflow-hidden" />
                    <div className="space-y-1">
                      <h5 className="text-[10px] font-bold text-white leading-normal line-clamp-1">تفاصيل ومواعيد انطلاق مباريات كأس العالم المترقبة</h5>
                      <span className="text-[8px] text-gray-500 font-bold">منذ ساعتين • أخبار هامة</span>
                    </div>
                  </div>
                </div>
              )}

              {type === BlockType.ADS && (
                <div className="space-y-1 text-center">
                  <div className="w-full h-16 bg-white/5 border border-dashed border-white/10 rounded-xl flex items-center justify-center flex-col p-1">
                    <span className="text-[9px] text-gray-400 font-bold">مساحة إعلانية نشطة للممول والراعي</span>
                    <span className="text-[8px] text-amber-400 font-semibold truncate max-w-xs">{adImageUrl || 'لم يتم إدخال رابط صورة إعلانية مخصصة بعد'}</span>
                  </div>
                </div>
              )}

              {type === BlockType.CUSTOM_WIDGETS && (
                <div className="space-y-1.5">
                  <div className="text-[9px] font-mono text-gray-500 border border-white/5 bg-black/40 rounded-lg p-2 max-h-24 overflow-hidden">
                    {customHtmlCode ? '<!-- Custom HTML Rendering -->\n' + customHtmlCode : '<!-- لا يوجد كود HTML حالياً. حدد قالباً أو اكتب كودا مخصصاً -->'}
                  </div>
                </div>
              )}

              {/* Default Mock message */}
              {type !== BlockType.HERO && type !== BlockType.LIVE_MATCHES && type !== BlockType.LEAGUE_STANDINGS && type !== BlockType.LATEST_NEWS && type !== BlockType.FEATURED_NEWS && type !== BlockType.TRENDING_NEWS && type !== BlockType.BREAKING_NEWS && type !== BlockType.ADS && type !== BlockType.CUSTOM_WIDGETS && (
                <div className="text-center py-4 text-gray-400">
                  <Layout size={18} className="mx-auto mb-1 text-gray-600" />
                  <span>محاكاة تخطيط: {getFriendlyTypeName(type)}</span>
                </div>
              )}
            </div>

            {showMoreButton && (
              <div className="pt-2 flex justify-center">
                <a 
                  href={moreButtonUrl || '#'} 
                  onClick={(e) => e.preventDefault()}
                  className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-[10px] font-black transition-all"
                >
                  {moreButtonLabel}
                </a>
              </div>
            )}
          </div>

          {/* Quick instructions on live modifications */}
          <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-1.5 text-[10px] text-gray-400 leading-relaxed font-semibold">
            <span className="font-black text-white flex items-center gap-1.5">
              <Info size={12} className="text-primary shrink-0" />
              <span>تعليمات مصمم التخطيط:</span>
            </span>
            <ul className="list-disc pr-4 space-y-1 text-[9px]">
              <li>يمكنك تغيير الألوان لرسم هويات متناسقة لبطولات مختلفة (مثل الذهب لدوري الأبطال والأزرق للدوري المحلي).</li>
              <li>إذا أردت دمج ألوان الموقع الافتراضية، اترك الخلفية والنص فارغين بدون اختيار.</li>
              <li>الحواف والحدود والتوجهات المخصصة يتم ترحيلها ومعالجتها لتجعل من تصميم موقعك متفرداً بنسبة ١٠٠٪.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
