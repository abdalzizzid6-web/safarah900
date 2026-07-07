import React from 'react';
import { BlockType } from '../../../../types';

// THEME_PRESETS list for quick-styling blocks
export const THEME_PRESETS = [
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

export const getFriendlyTypeName = (type: any): string => {
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

// Renders custom miniature visual structures representing real-time widgets in the phone
export function renderMiniPlaceholderContent(type: BlockType): React.ReactElement {
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
        <div className="space-y-1 text-right">
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
        <div className="space-y-1 text-right">
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
        <div className="flex gap-2 p-1.5 bg-black/20 rounded-xl border border-white/5 items-center justify-end">
          <div className="flex-1 space-y-1">
            <div className="h-1.5 w-full bg-white/20 rounded"></div>
            <div className="h-1 w-2/3 bg-white/10 rounded"></div>
          </div>
          <div className="w-10 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[10px]">📰</div>
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
        <div className="p-1.5 bg-black/20 rounded-xl space-y-1 border border-white/5 text-[7px] font-mono text-right">
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
      return (
        <div className="space-y-1 text-right">
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
