import React from 'react';
import { Eye, Layout, Info } from 'lucide-react';
import { BlockType } from '../../../../types';
import { getFriendlyTypeName } from './BlockFormConstants';

interface BlockFormPreviewProps {
  bgGradient: boolean;
  bgGradientStart: string;
  bgGradientEnd: string;
  backgroundColor: string;
  textColor: string;
  titleColor: string;
  fontFamily: string;
  borderRadius: string;
  borderStyle: string;
  borderWidth: string;
  accentColor: string;
  shadowIntensity: string;
  paddingSize: string;
  titleAlign: string;
  titleIcon: string;
  titleSize: string;
  titleWeight: string;
  title: string;
  subtitle: string;
  style: string;
  type: BlockType;
  leagueName: string;
  selectedLeagueId: string;
  customLeagueId: string;
  filterNewsCategory: string;
  adImageUrl: string;
  customHtmlCode: string;
  showMoreButton: boolean;
  moreButtonUrl: string;
  moreButtonLabel: string;
}

export const BlockFormPreview: React.FC<BlockFormPreviewProps> = ({
  bgGradient,
  bgGradientStart,
  bgGradientEnd,
  backgroundColor,
  textColor,
  titleColor,
  fontFamily,
  borderRadius,
  borderStyle,
  borderWidth,
  accentColor,
  shadowIntensity,
  paddingSize,
  titleAlign,
  titleIcon,
  titleSize,
  titleWeight,
  title,
  subtitle,
  style,
  type,
  leagueName,
  selectedLeagueId,
  customLeagueId,
  filterNewsCategory,
  adImageUrl,
  customHtmlCode,
  showMoreButton,
  moreButtonUrl,
  moreButtonLabel
}) => {
  return (
    <div className="xl:col-span-4 space-y-6 text-right" dir="rtl">
      <div className="bg-[#0e1622] border border-white/10 rounded-[2.5rem] p-5 sticky top-6 shadow-2xl space-y-5">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-[9px] text-gray-500 font-bold font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">Live View</span>
          <h3 className="text-xs font-black text-white flex items-center gap-1.5 justify-end">
            <span>المعاينة الحية الفورية للتصميم</span>
            <Eye size={14} className="text-primary animate-pulse" />
          </h3>
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
            <div className="flex justify-between items-center flex-row w-full gap-2">
              <div className="flex items-center gap-1.5 justify-end">
                {titleIcon !== 'None' && <span className="text-xs">{titleIcon === 'Trophy' ? '🏆' : titleIcon === 'Flame' ? '🔥' : titleIcon === 'Sparkles' ? '✨' : titleIcon === 'Activity' ? '📈' : titleIcon === 'Tv' ? '📺' : titleIcon === 'TrendingUp' ? '⚡' : titleIcon === 'Newspaper' ? '📰' : ''}</span>}
                <h4 
                  className={`${titleSize} ${titleWeight}`}
                  style={{ color: titleColor || '#ffffff' }}
                >
                  {title || 'عنوان القسم الافتراضي'}
                </h4>
              </div>
              <span className="text-[8px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">
                {style.toUpperCase()}
              </span>
            </div>
            {subtitle && (
              <p className="text-[9px] text-gray-400 font-medium leading-normal mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* Mock content rendering depending on chosen widget type */}
          <div className="py-2.5 text-[11px] leading-relaxed space-y-2 text-right">
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
                  <span className="text-emerald-400 font-bold animate-pulse">دقيقة '74</span>
                  <span className="text-white font-bold">ريال مدريد (٢ - ١) ميلان</span>
                </div>
                <div className="bg-[#070b11] border border-white/5 p-2.5 rounded-xl flex justify-between items-center text-[10px]">
                  <span className="text-amber-400 font-bold">دقيقة '12</span>
                  <span className="text-white font-bold">الأهلي المصري (٠ - ٠) الهلال</span>
                </div>
              </div>
            )}

            {type === BlockType.LEAGUE_STANDINGS && (
              <div className="space-y-1 text-right">
                <div className="text-[10px] font-black text-white bg-white/5 p-1 px-2 rounded mb-1 text-right">
                  🏆 {leagueName || 'جدول ترتيب الدوري الإنجليزي'} (ID: {selectedLeagueId === 'custom' ? customLeagueId : selectedLeagueId})
                </div>
                <div className="grid grid-cols-6 gap-1 text-[9px] font-semibold text-gray-400 border-b border-white/5 pb-1 px-1">
                  <span>نقاط</span>
                  <span>فرق</span>
                  <span>لعب</span>
                  <span className="col-span-3 text-right">الفريق</span>
                </div>
                <div className="grid grid-cols-6 gap-1 text-[9px] text-white px-1">
                  <span className="font-bold">64</span>
                  <span>+32</span>
                  <span>24</span>
                  <span className="col-span-3 font-bold text-amber-400 text-right">1. ريال مدريد</span>
                </div>
                <div className="grid grid-cols-6 gap-1 text-[9px] text-white px-1">
                  <span className="font-bold">51</span>
                  <span>+15</span>
                  <span>24</span>
                  <span className="col-span-3 font-bold text-right">2. جيرونا</span>
                </div>
              </div>
            )}

            {(type === BlockType.LATEST_NEWS || type === BlockType.FEATURED_NEWS || type === BlockType.TRENDING_NEWS || type === BlockType.BREAKING_NEWS) && (
              <div className="space-y-2">
                <div className="flex gap-2.5 items-start justify-end">
                  <div className="space-y-1 text-right">
                    <h5 className="text-[10px] font-bold text-white leading-normal line-clamp-1">خبر عاجل ومفاجئ في كواليس الميركاتو الرياضي</h5>
                    <span className="text-[8px] text-gray-500 font-bold">منذ ٤٥ دقيقة • {filterNewsCategory || 'الأخبار العامة'}</span>
                  </div>
                  <div className="w-12 h-10 bg-white/10 rounded-lg shrink-0 object-cover overflow-hidden" />
                </div>
                <div className="flex gap-2.5 items-start justify-end">
                  <div className="space-y-1 text-right">
                    <h5 className="text-[10px] font-bold text-white leading-normal line-clamp-1">تفاصيل ومواعيد انطلاق مباريات كأس العالم المترقبة</h5>
                    <span className="text-[8px] text-gray-500 font-bold">منذ ساعتين • أخبار هامة</span>
                  </div>
                  <div className="w-12 h-10 bg-white/10 rounded-lg shrink-0 object-cover overflow-hidden" />
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
                <div className="text-[9px] font-mono text-gray-500 border border-white/5 bg-black/40 rounded-lg p-2 max-h-24 overflow-hidden text-left" dir="ltr">
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
        <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-1.5 text-[10px] text-gray-400 leading-relaxed font-semibold text-right">
          <span className="font-black text-white flex items-center gap-1.5 justify-end">
            <span>تعليمات مصمم التخطيط:</span>
            <Info size={12} className="text-primary shrink-0" />
          </span>
          <ul className="list-disc pr-4 space-y-1 text-[9px] text-right">
            <li>يمكنك تغيير الألوان لرسم هويات متناسقة لبطولات مختلفة (مثل الذهب لدوري الأبطال والأزرق للدوري المحلي).</li>
            <li>إذا أردت دمج ألوان الموقع الافتراضية، اترك الخلفية والنص فارغين بدون اختيار.</li>
            <li>الحواف والحدود والتوجهات المخصصة يتم ترحيلها ومعالجتها لتجعل من تصميم موقعك متفرداً بنسبة ١٠٠٪.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
