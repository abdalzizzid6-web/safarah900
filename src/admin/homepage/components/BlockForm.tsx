import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { BlockType } from '../../../types';
import { clearHomepageCache } from '../../../hooks/useHomepageLayout';
import { Save, Settings, Layers, Palette, Clock, Code } from 'lucide-react';

// Subcomponents imports
import { POPULAR_LEAGUES, COLOR_PRESETS } from './block-form/BlockFormConstants';
import { BlockFormTabContent } from './block-form/BlockFormTabContent';
import { BlockFormTabDesign } from './block-form/BlockFormTabDesign';
import { BlockFormTabLogic } from './block-form/BlockFormTabLogic';
import { BlockFormTabAdvanced } from './block-form/BlockFormTabAdvanced';
import { BlockFormPreview } from './block-form/BlockFormPreview';

interface BlockFormProps {
  blockToEdit?: any | null;
  onSave: () => void;
  onCancel: () => void;
}

export const BlockForm: React.FC<BlockFormProps> = ({ blockToEdit, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'logic' | 'advanced'>('content');

  // Content state variables
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [type, setType] = useState<BlockType>(BlockType.HERO);
  const [enabled, setEnabled] = useState(true);
  const [visibleDesktop, setVisibleDesktop] = useState(true);
  const [visibleTablet, setVisibleTablet] = useState(true);
  const [visibleMobile, setVisibleMobile] = useState(true);
  const [columns, setColumns] = useState<number>(1);
  const [style, setStyle] = useState<'card' | 'carousel' | 'slider' | 'bento' | 'magazine'>('card');
  const [allowGuests, setAllowGuests] = useState(true);
  const [allowMembers, setAllowMembers] = useState(true);

  // Advanced & Custom widgets state variables
  const [selectedLeagueId, setSelectedLeagueId] = useState('39');
  const [customLeagueId, setCustomLeagueId] = useState('');
  const [leagueName, setLeagueName] = useState('الدوري الإنجليزي الممتاز');
  const [maxItems, setMaxItems] = useState<number>(10);
  const [filterLeagueId, setFilterLeagueId] = useState<string>('');
  const [filterNewsCategory, setFilterNewsCategory] = useState<string>('');
  const [customHtmlCode, setCustomHtmlCode] = useState<string>('');
  const [adSlot, setAdSlot] = useState<string>('Home_Middle');
  const [adImageUrl, setAdImageUrl] = useState<string>('');
  const [adLinkUrl, setAdLinkUrl] = useState<string>('');
  const [showMoreButton, setShowMoreButton] = useState(false);
  const [moreButtonLabel, setMoreButtonLabel] = useState('مشاهدة المزيد ↗');
  const [moreButtonUrl, setMoreButtonUrl] = useState('');
  const [dataSource, setDataSource] = useState<'firestore' | 'rss' | 'api' | 'ai' | 'manual' | 'mixed'>('api');

  // Styling & Customization state variables
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
  const [subtitle, setSubtitle] = useState('');
  const [titleSize, setTitleSize] = useState('text-sm');
  const [titleWeight, setTitleWeight] = useState('font-black');
  const [titleAlign, setTitleAlign] = useState('text-right');
  const [titleIcon, setTitleIcon] = useState('None');
  const [skeletonType, setSkeletonType] = useState('pulsing');
  const [bgGradient, setBgGradient] = useState(false);
  const [bgGradientStart, setBgGradientStart] = useState('#0e1622');
  const [bgGradientEnd, setBgGradientEnd] = useState('#070b11');

  // Logic & Scheduling state variables
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [expireTime, setExpireTime] = useState('');
  const [hasConditionalRule, setHasConditionalRule] = useState(false);
  const [conditionType, setConditionType] = useState<'live_matches_count' | 'always'>('live_matches_count');
  const [conditionOperator, setConditionOperator] = useState<'gt' | 'eq' | 'lt'>('gt');
  const [conditionValue, setConditionValue] = useState<number>(0);
  const [fallbackWidgetType, setFallbackWidgetType] = useState<string>('');

  // Animations
  const [animationType, setAnimationType] = useState<'fade' | 'slide' | 'slide_right' | 'zoom' | 'spring' | 'none'>('fade');
  const [animationDuration, setAnimationDuration] = useState<number>(0.4);
  const [animationDelay, setAnimationDelay] = useState<number>(0);

  useEffect(() => {
    if (blockToEdit) {
      setTitle(blockToEdit.title || '');
      setTitleEn(blockToEdit.titleEn || '');
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
      setTitleEn('');
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
      titleEn,
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
      titleEn,
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 text-gray-100" dir="rtl">
      {/* Editor Main Controls (8 Columns) */}
      <form onSubmit={saveBlock} className="xl:col-span-8 bg-[#0e1622] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5 text-right">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition text-xs font-bold order-2 sm:order-1"
          >
            إلغاء التعديل
          </button>
          <div className="order-1 sm:order-2">
            <h2 className="text-lg font-black text-white flex items-center gap-2 justify-end">
              <span>{blockToEdit ? 'محرر ومصمم المكونات الذكي V2' : 'توليد وتخطيط مكون جديد بالكامل'}</span>
              <Settings className="text-primary animate-spin-slow" size={22} />
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">تحكم مطلق بجميع خصائص المكون وقواعد بياناته وتصميمه ومسار حركته الفورية.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#070b11] rounded-2xl border border-white/5 justify-end">
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'advanced' ? 'bg-primary text-black shadow-md font-extrabold' : 'text-gray-400 hover:text-white'}`}
          >
            <Code size={14} />
            <span>٤. بيانات وكود مخصص</span>
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
            onClick={() => setActiveTab('design')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'design' ? 'bg-primary text-black shadow-md font-extrabold' : 'text-gray-400 hover:text-white'}`}
          >
            <Palette size={14} />
            <span>٢. الهوية والسمات والألوان</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'content' ? 'bg-primary text-black shadow-md font-extrabold' : 'text-gray-400 hover:text-white'}`}
          >
            <Layers size={14} />
            <span>١. بنية المكون الأساسي</span>
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'content' && (
          <BlockFormTabContent
            title={title}
            setTitle={setTitle}
            titleEn={titleEn}
            setTitleEn={setTitleEn}
            type={type}
            setType={setType}
            subtitle={subtitle}
            setSubtitle={setSubtitle}
            titleIcon={titleIcon}
            setTitleIcon={setTitleIcon}
            titleAlign={titleAlign}
            setTitleAlign={setTitleAlign}
            columns={columns}
            setColumns={setColumns}
            style={style}
            setStyle={setStyle}
            allowGuests={allowGuests}
            setAllowGuests={setAllowGuests}
            allowMembers={allowMembers}
            setAllowMembers={setAllowMembers}
            visibleDesktop={visibleDesktop}
            setVisibleDesktop={setVisibleDesktop}
            visibleTablet={visibleTablet}
            setVisibleTablet={setVisibleTablet}
            visibleMobile={visibleMobile}
            setVisibleMobile={setVisibleMobile}
            enabled={enabled}
            setEnabled={setEnabled}
          />
        )}

        {activeTab === 'design' && (
          <BlockFormTabDesign
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
            textColor={textColor}
            setTextColor={setTextColor}
            titleColor={titleColor}
            setTitleColor={setTitleColor}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            borderRadius={borderRadius}
            setBorderRadius={setBorderRadius}
            paddingSize={paddingSize}
            setPaddingSize={setPaddingSize}
            borderStyle={borderStyle}
            setBorderStyle={setBorderStyle}
            borderWidth={borderWidth}
            setBorderWidth={setBorderWidth}
            shadowIntensity={shadowIntensity}
            setShadowIntensity={setShadowIntensity}
            hoverEffect={hoverEffect}
            setHoverEffect={setHoverEffect}
            titleSize={titleSize}
            setTitleSize={setTitleSize}
            titleWeight={titleWeight}
            setTitleWeight={setTitleWeight}
            skeletonType={skeletonType}
            setSkeletonType={setSkeletonType}
            bgGradient={bgGradient}
            setBgGradient={setBgGradient}
            bgGradientStart={bgGradientStart}
            setBgGradientStart={setBgGradientStart}
            bgGradientEnd={bgGradientEnd}
            setBgGradientEnd={setBgGradientEnd}
            applyColorPreset={applyColorPreset}
          />
        )}

        {activeTab === 'logic' && (
          <BlockFormTabLogic
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            publishTime={publishTime}
            setPublishTime={setPublishTime}
            expireTime={expireTime}
            setExpireTime={setExpireTime}
            hasConditionalRule={hasConditionalRule}
            setHasConditionalRule={setHasConditionalRule}
            conditionType={conditionType}
            setConditionType={setConditionType}
            conditionOperator={conditionOperator}
            setConditionOperator={setConditionOperator}
            conditionValue={conditionValue}
            setConditionValue={setConditionValue}
            fallbackWidgetType={fallbackWidgetType}
            setFallbackWidgetType={setFallbackWidgetType}
            animationType={animationType}
            setAnimationType={setAnimationType}
            animationDuration={animationDuration}
            setAnimationDuration={setAnimationDuration}
            animationDelay={animationDelay}
            setAnimationDelay={setAnimationDelay}
          />
        )}

        {activeTab === 'advanced' && (
          <BlockFormTabAdvanced
            type={type}
            dataSource={dataSource}
            setDataSource={setDataSource}
            maxItems={maxItems}
            setMaxItems={setMaxItems}
            showMoreButton={showMoreButton}
            setShowMoreButton={setShowMoreButton}
            moreButtonLabel={moreButtonLabel}
            setMoreButtonLabel={setMoreButtonLabel}
            moreButtonUrl={moreButtonUrl}
            setMoreButtonUrl={setMoreButtonUrl}
            selectedLeagueId={selectedLeagueId}
            setSelectedLeagueId={setSelectedLeagueId}
            customLeagueId={customLeagueId}
            setCustomLeagueId={setCustomLeagueId}
            leagueName={leagueName}
            setLeagueName={setLeagueName}
            filterLeagueId={filterLeagueId}
            setFilterLeagueId={setFilterLeagueId}
            filterNewsCategory={filterNewsCategory}
            setFilterNewsCategory={setFilterNewsCategory}
            adSlot={adSlot}
            setAdSlot={setAdSlot}
            adImageUrl={adImageUrl}
            setAdImageUrl={setAdImageUrl}
            adLinkUrl={adLinkUrl}
            setAdLinkUrl={setAdLinkUrl}
            customHtmlCode={customHtmlCode}
            setCustomHtmlCode={setCustomHtmlCode}
            handleLeagueChange={handleLeagueChange}
          />
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
      <BlockFormPreview
        bgGradient={bgGradient}
        bgGradientStart={bgGradientStart}
        bgGradientEnd={bgGradientEnd}
        backgroundColor={backgroundColor}
        textColor={textColor}
        titleColor={titleColor}
        fontFamily={fontFamily}
        borderRadius={borderRadius}
        borderStyle={borderStyle}
        borderWidth={borderWidth}
        accentColor={accentColor}
        shadowIntensity={shadowIntensity}
        paddingSize={paddingSize}
        titleAlign={titleAlign}
        titleIcon={titleIcon}
        titleSize={titleSize}
        titleWeight={titleWeight}
        title={title}
        subtitle={subtitle}
        style={style}
        type={type}
        leagueName={leagueName}
        selectedLeagueId={selectedLeagueId}
        customLeagueId={customLeagueId}
        filterNewsCategory={filterNewsCategory}
        adImageUrl={adImageUrl}
        customHtmlCode={customHtmlCode}
        showMoreButton={showMoreButton}
        moreButtonUrl={moreButtonUrl}
        moreButtonLabel={moreButtonLabel}
      />
    </div>
  );
};
