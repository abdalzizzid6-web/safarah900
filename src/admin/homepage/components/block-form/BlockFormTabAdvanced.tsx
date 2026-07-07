import React from 'react';
import { Terminal, Info } from 'lucide-react';
import { BlockType } from '../../../../types';
import { POPULAR_LEAGUES, CUSTOM_WIDGET_TEMPLATES } from './BlockFormConstants';

interface BlockFormTabAdvancedProps {
  type: BlockType;
  dataSource: 'firestore' | 'rss' | 'api' | 'ai' | 'manual' | 'mixed';
  setDataSource: (val: 'firestore' | 'rss' | 'api' | 'ai' | 'manual' | 'mixed') => void;
  maxItems: number;
  setMaxItems: (val: number) => void;
  showMoreButton: boolean;
  setShowMoreButton: (val: boolean) => void;
  moreButtonLabel: string;
  setMoreButtonLabel: (val: string) => void;
  moreButtonUrl: string;
  setMoreButtonUrl: (val: string) => void;
  selectedLeagueId: string;
  setSelectedLeagueId: (val: string) => void;
  customLeagueId: string;
  setCustomLeagueId: (val: string) => void;
  leagueName: string;
  setLeagueName: (val: string) => void;
  filterLeagueId: string;
  setFilterLeagueId: (val: string) => void;
  filterNewsCategory: string;
  setFilterNewsCategory: (val: string) => void;
  adSlot: string;
  setAdSlot: (val: string) => void;
  adImageUrl: string;
  setAdImageUrl: (val: string) => void;
  adLinkUrl: string;
  setAdLinkUrl: (val: string) => void;
  customHtmlCode: string;
  setCustomHtmlCode: (val: string) => void;
  handleLeagueChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const BlockFormTabAdvanced: React.FC<BlockFormTabAdvancedProps> = ({
  type,
  dataSource,
  setDataSource,
  maxItems,
  setMaxItems,
  showMoreButton,
  setShowMoreButton,
  moreButtonLabel,
  setMoreButtonLabel,
  moreButtonUrl,
  setMoreButtonUrl,
  selectedLeagueId,
  customLeagueId,
  setCustomLeagueId,
  leagueName,
  setLeagueName,
  filterLeagueId,
  setFilterLeagueId,
  filterNewsCategory,
  setFilterNewsCategory,
  adSlot,
  setAdSlot,
  adImageUrl,
  setAdImageUrl,
  adLinkUrl,
  setAdLinkUrl,
  customHtmlCode,
  setCustomHtmlCode,
  handleLeagueChange
}) => {
  return (
    <div className="space-y-6 animate-fadeIn text-right">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#070b11]/50 p-4 border border-white/5 rounded-2xl">
        {/* Data Source */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 block text-right">مصدر جلب البيانات للمكون (Data Source API)</label>
          <select 
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:border-primary focus:outline-none transition text-right"
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
          <label className="text-xs font-bold text-gray-400 block text-right">الحد الأقصى للعناصر للعرض (Max Items Limit)</label>
          <input
            type="number"
            min="1"
            max="100"
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:border-primary focus:outline-none transition text-right font-mono"
            value={maxItems}
            onChange={(e) => setMaxItems(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Show More Navigation Button Section */}
      <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowMoreButton(!showMoreButton)}
            className={`px-3 py-1 bg-white/5 border rounded-xl text-[9px] font-bold transition ${showMoreButton ? 'bg-primary/20 text-primary border-primary/30' : 'text-gray-400 border-white/5'}`}
          >
            {showMoreButton ? 'تعطيل الزر' : 'تفعيل الزر'}
          </button>
          <div className="text-right">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5 justify-end">
              <span>🔗 زر التنقل والوصول "مشاهدة المزيد" (Show More CTA Button)</span>
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5">أضف زراً أسفل القسم ينقل الزوار إلى صفحة مخصصة لرؤية كل النتائج والمقالات.</p>
          </div>
        </div>

        {showMoreButton && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slideDown">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold block">نص زر التوجيه المعروض</label>
              <input 
                type="text"
                className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none text-right" 
                placeholder="مثال: مشاهدة جدول الترتيب الكامل ↗"
                value={moreButtonLabel}
                onChange={(e) => setMoreButtonLabel(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold block">رابط التوجيه (Target Destination URL)</label>
              <input 
                type="text"
                className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none text-right" 
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
          <h4 className="text-xs font-black text-primary flex items-center gap-1.5 justify-end">
            <span>📊 تهيئة وإعدادات تصفية جدول ترتيب الدوري</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold block">اختر الدوري المعني</label>
              <select
                className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-right"
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
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs text-right font-mono"
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
                className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs text-right"
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
          <h4 className="text-xs font-black text-purple-400 flex items-center gap-1.5 justify-end">
            <span>📰 تصفية وتغذية مقالات الأخبار (News Engine Stream)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold block">تصفية حسب معرف الدوري (League ID - اختياري)</label>
              <input
                type="text"
                className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-right font-mono"
                placeholder="مثال: 39 لقصر الأخبار على الدوري الإنجليزي فقط"
                value={filterLeagueId}
                onChange={(e) => setFilterLeagueId(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold block">تصنيف ونوع الأخبار الحصرية</label>
              <select
                className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-right"
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

      {/* Ads and Sponsorship */}
      {type === BlockType.ADS && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl space-y-4">
          <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5 justify-end">
            <span>📢 إعدادات الإعلان والراعي والروابط التوجيهية</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold block">موضع وموقع الإعلان التلقائي</label>
              <select
                className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs text-right"
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
                className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs text-right font-mono"
                placeholder="https://example.com/banner.png"
                value={adImageUrl}
                onChange={(e) => setAdImageUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold block">رابط الهبوط والتوجيه عند الضغط (Landing URL)</label>
              <input
                type="url"
                className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs text-right font-mono"
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
            {/* Prefill templates */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-gray-500 font-bold">قوالب جاهزة:</span>
              {CUSTOM_WIDGET_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (window.confirm(`هل أنت متأكد من رغبتك في استبدال الكود الحالي بكود قالب "${tmpl.name}"؟`)) {
                      setCustomHtmlCode(tmpl.code);
                    }
                  }}
                  className="px-2 py-1 bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-300 rounded text-[9px] font-bold border border-white/5 transition"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
            <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5 justify-end">
              <span>رمز المكون البرمجي المخصص (HTML / Tailwind CSS Embed)</span>
              <Terminal size={14} />
            </h4>
          </div>

          <div className="space-y-1.5">
            <textarea
              className="w-full bg-[#070b11] border border-white/10 rounded-xl p-4 text-[11px] focus:border-primary focus:outline-none transition h-48 font-mono leading-relaxed text-right"
              placeholder="<!-- اكتب كود HTML مدمجاً معه كلاسات Tailwind CSS مباشرة هنا... -->"
              value={customHtmlCode}
              onChange={(e) => setCustomHtmlCode(e.target.value)}
              dir="ltr"
            />
            <div className="text-[9px] text-gray-400 flex items-start gap-1 p-1 bg-white/5 rounded-lg border border-white/5 justify-end text-right">
              <span>يمكنك إدراج أكواد الميركاتو الحية، استطلاعات الرأي الخارجية، أكواد شبكات البث ومواقع السوشيال ميديا بالكامل هنا وستظهر فوراً بمرونة مطلقة.</span>
              <Info size={11} className="text-primary shrink-0 mt-0.5" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
