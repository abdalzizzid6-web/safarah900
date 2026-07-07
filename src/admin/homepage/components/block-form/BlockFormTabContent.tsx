import React from 'react';
import { BlockType } from '../../../../types';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

interface BlockFormTabContentProps {
  title: string;
  setTitle: (val: string) => void;
  type: BlockType;
  setType: (val: BlockType) => void;
  subtitle: string;
  setSubtitle: (val: string) => void;
  titleIcon: string;
  setTitleIcon: (val: string) => void;
  titleAlign: string;
  setTitleAlign: (val: string) => void;
  columns: number;
  setColumns: (val: number) => void;
  style: 'card' | 'carousel' | 'slider' | 'bento' | 'magazine';
  setStyle: (val: 'card' | 'carousel' | 'slider' | 'bento' | 'magazine') => void;
  allowGuests: boolean;
  setAllowGuests: (val: boolean) => void;
  allowMembers: boolean;
  setAllowMembers: (val: boolean) => void;
  visibleDesktop: boolean;
  setVisibleDesktop: (val: boolean) => void;
  visibleTablet: boolean;
  setVisibleTablet: (val: boolean) => void;
  visibleMobile: boolean;
  setVisibleMobile: (val: boolean) => void;
  enabled: boolean;
  setEnabled: (val: boolean) => void;
}

export const BlockFormTabContent: React.FC<BlockFormTabContentProps> = ({
  title,
  setTitle,
  type,
  setType,
  subtitle,
  setSubtitle,
  titleIcon,
  setTitleIcon,
  titleAlign,
  setTitleAlign,
  columns,
  setColumns,
  style,
  setStyle,
  allowGuests,
  setAllowGuests,
  allowMembers,
  setAllowMembers,
  visibleDesktop,
  setVisibleDesktop,
  visibleTablet,
  setVisibleTablet,
  visibleMobile,
  setVisibleMobile,
  enabled,
  setEnabled
}) => {
  return (
    <div className="space-y-6 animate-fadeIn text-right">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Section Title */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 block">العنوان المعروض (Section Title)</label>
          <input 
            type="text"
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition text-right" 
            placeholder="مثال: مباريات اليوم المباشرة" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Widget Type */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 block">نوع محتوى الظهر للكتلة (Widget Type)</label>
          <select 
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition text-right" 
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
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right" 
            placeholder="مثال: أهم مواجهات الكلاسيكو اليوم بتغطية حصرية مباشرة" 
            value={subtitle} 
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-bold block">أيقونة القسم (Section Icon)</label>
          <select
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-right"
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
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition text-right"
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
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition text-right"
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
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer justify-end">
              <span>الزوار والضيوف (Guests)</span>
              <input 
                type="checkbox" 
                checked={allowGuests} 
                onChange={(e) => setAllowGuests(e.target.checked)}
                className="rounded border-white/10 bg-[#070b11] text-primary focus:ring-primary h-4 w-4" 
              />
            </label>

            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer justify-end">
              <span>الأعضاء المسجلين (Members)</span>
              <input 
                type="checkbox" 
                checked={allowMembers} 
                onChange={(e) => setAllowMembers(e.target.checked)}
                className="rounded border-white/10 bg-[#070b11] text-primary focus:ring-primary h-4 w-4" 
              />
            </label>
          </div>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 block">الأجهزة المسموح عرض المكون بها</label>
          <div className="flex items-center gap-5 bg-[#070b11] border border-white/10 rounded-xl p-3 h-12 justify-center">
            <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer">
              <span>كمبيوتر</span>
              <input 
                type="checkbox" 
                checked={visibleDesktop} 
                onChange={(e) => setVisibleDesktop(e.target.checked)}
                className="rounded border-white/10 bg-[#070b11] text-primary focus:ring-primary h-3.5 w-3.5" 
              />
              <Monitor size={12} className="text-gray-400" />
            </label>

            <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer">
              <span>تابلت</span>
              <input 
                type="checkbox" 
                checked={visibleTablet} 
                onChange={(e) => setVisibleTablet(e.target.checked)}
                className="rounded border-white/10 bg-[#070b11] text-primary focus:ring-primary h-3.5 w-3.5" 
              />
              <Tablet size={12} className="text-gray-400" />
            </label>

            <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer">
              <span>جوال</span>
              <input 
                type="checkbox" 
                checked={visibleMobile} 
                onChange={(e) => setVisibleMobile(e.target.checked)}
                className="rounded border-white/10 bg-[#070b11] text-primary focus:ring-primary h-3.5 w-3.5" 
              />
              <Smartphone size={12} className="text-gray-400" />
            </label>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
        <div className="space-y-1 text-right">
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
  );
};
