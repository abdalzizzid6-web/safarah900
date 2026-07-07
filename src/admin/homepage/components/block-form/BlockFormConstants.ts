import { BlockType } from '../../../../types';

export const POPULAR_LEAGUES = [
  { id: '39', name: 'الدوري الإنجليزي الممتاز' },
  { id: '140', name: 'الدوري الإسباني' },
  { id: '135', name: 'الدوري الإيطالي' },
  { id: '78', name: 'الدوري الألماني' },
  { id: '61', name: 'الدوري الفرنسي' },
  { id: '307', name: 'الدوري السعودي للمحترفين' },
  { id: '2', name: 'دوري أبطال أوروبا' }
];

export const COLOR_PRESETS = [
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

export const CUSTOM_WIDGET_TEMPLATES = [
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

export const getFriendlyTypeName = (t: BlockType) => {
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
    case BlockType.TRENDING_NEWS: return 'الأخبار الرائجة والأكثر قراءة (Trending)';
    case BlockType.LEAGUES: return 'قائمة الدوريات الرئيسية (Leagues)';
    case BlockType.TOP_PLAYERS: return 'إحصائيات وأفضل اللاعبين (Top Players)';
    case BlockType.ADS: return 'إعلان مخصص (Advertisements)';
    case BlockType.VIDEOS: return 'مقاطع الفيديو والأهداف (Videos)';
    case BlockType.CUSTOM_WIDGETS: return 'أداة مخصصة (Custom Widgets HTML/Code)';
    default: return String(t);
  }
};
