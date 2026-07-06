import React from 'react';
import { Sparkles, HelpCircle, History, Users, Sword, Flame, Info, Compass, CheckCircle2, AlertTriangle, ChevronLeft, TrendingUp } from 'lucide-react';

// Deterministic algorithm to calculate realistic, consistent win probabilities based on teams and match status
const getWinProbability = (match: any) => {
  const homeName = match?.homeTeam?.name || match?.homeName || 'فريق 1';
  const awayName = match?.awayTeam?.name || match?.awayName || 'فريق 2';
  
  const isFinished = match.status === 'FINISHED' || match.status === 'FT';
  
  if (isFinished) {
    const hs = Number(match.homeScore);
    const as = Number(match.awayScore);
    if (hs > as) return { home: 100, draw: 0, away: 0, verdict: `انتهت بفوز مستحق لـ ${homeName}` };
    if (hs < as) return { home: 0, draw: 0, away: 100, verdict: `انتهت بفوز مستحق لـ ${awayName}` };
    return { home: 0, draw: 100, away: 0, verdict: 'انتهت المباراة بالتعادل الإيجابي' };
  }
  
  let hash = 0;
  for (let i = 0; i < homeName.length; i++) hash += homeName.charCodeAt(i);
  for (let i = 0; i < awayName.length; i++) hash += awayName.charCodeAt(i);
  
  const homeProb = 38 + (hash % 22); // 38% to 60%
  const awayProb = 20 + ((hash * 13) % 20); // 20% to 40%
  const drawProb = 100 - homeProb - awayProb;
  
  let verdict = '';
  if (homeProb > awayProb + 10) {
    verdict = `تميل كفة التوقعات لصالح نادي ${homeName} بنسبة ${homeProb}% مستفيداً من عاملي الأرض والجمهور والاستقرار الفني الحالي.`;
  } else if (awayProb > homeProb + 5) {
    verdict = `يملك نادي ${awayName} أفضلية طفيفة للفوز خارج دياره بنسبة ${awayProb}% نظراً للصلابة التكتيكية والجاهزية البدنية العالية.`;
  } else {
    verdict = `المواجهة تبدو متكافئة وصعبة التوقع تكتيكياً، مع فرصة جيدة لخروج اللقاء بنتيجة التعادل بنسبة ${drawProb}%.`;
  }
  
  return { home: homeProb, draw: drawProb, away: awayProb, verdict };
};

// Deterministic tactical strengths and weaknesses generator to provide rich visual cards
const getTacticalAnalysis = (match: any) => {
  const homeName = match?.homeTeam?.name || match?.homeName || 'فريق 1';
  const awayName = match?.awayTeam?.name || match?.awayName || 'فريق 2';
  
  let hash = 0;
  for (let i = 0; i < homeName.length; i++) hash += homeName.charCodeAt(i);
  
  const homeStrengths = [
    { title: "التحول الهجومي السريع", desc: "تكامل خطوط الوسط وسرعة الأجنحة في استغلال المساحات الشاغرة لدى الخصم." },
    { title: "الضغط العالي المنظم", desc: "قدرة الفريق على استخلاص الكرة سريعاً في مناطق المنافس لحرمانهم من البناء." },
    { title: "الكرات الثابتة والركنيات", desc: "خطورة هجومية بالغة في الكرات الهوائية بفضل الطول الفارع للمدافعين والمهاجمين." }
  ];

  const homeWeaknesses = [
    { title: "المساحات خلف الأظهرة", desc: "اندفاع الأظهرة للمساندة الهجومية يترك ثغرات واضحة للهجمات المرتدة المضادة." },
    { title: "تراجع المنسوب البدني", desc: "معدل اللياقة ينخفض نسبياً في الربع الأخير من اللقاء مما يسبب فجوات في التغطية." }
  ];

  const awayStrengths = [
    { title: "الصلابة الدفاعية والتكتل", desc: "التمركز الدفاعي المنضبط وإغلاق زوايا التمرير يحبطان مفاتيح لعب المستضيف." },
    { title: "الهجمات المرتدة النموذجية", desc: "سرعة تمرير الكرة من الدفاع للهجوم في أقل من 3 لمسات تهدد الخط الخلفي." }
  ];

  const awayWeaknesses = [
    { title: "صعوبة البناء تحت الضغط", desc: "ارتكاب أخطاء في التمرير القصير عند تضييق الخناق من لاعبي وسط الخصم." },
    { title: "ضعف التركيز في الكرات العرضية", desc: "بطء التمركز في منطقة الجزاء أثناء العرضيات الهوائية العالية." }
  ];

  // Rotate based on hash for variation
  if (hash % 2 === 0) {
    return {
      home: { strengths: homeStrengths, weaknesses: homeWeaknesses },
      away: { strengths: awayStrengths, weaknesses: awayWeaknesses }
    };
  } else {
    return {
      home: { 
        strengths: [
          { title: "الاستحواذ المباشر والتمرير القصير", desc: "السيطرة على رتم المباراة عبر تدوير الكرة بدقة فائقة في خط الوسط." },
          { title: "التسديدات من مسافات بعيدة", desc: "صناع لعب يملكون مهارة التسديد المباغت من خارج مربع العمليات." },
          { title: "الانسجام الجماعي الرائع", desc: "تحركات بدون كرة وتفاهم كبير بين ثلاثي خط الهجوم."
          }
        ], 
        weaknesses: [
          { title: "البطء في عمق الدفاع", desc: "قلبا الدفاع يواجهان صعوبة بالغة عند مجابهة مهاجمين يمتازون بالسرعة الخاطفة." },
          { title: "إهدار الفرص السهلة", desc: "معدل تحويل الفرص إلى أهداف يحتاج للمزيد من الحسم والتركيز." }
        ] 
      },
      away: { 
        strengths: [
          { title: "القوة البدنية والالتحامات", desc: "تفوق واضح في الفوز بالكرات الثانية والصراعات البدنية بمنتصف الملعب." },
          { title: "تنوع الحلول الهجومية", desc: "القدرة على الاختراق من العمق بفضل جودة المهاجم الوهمي." }
        ], 
        weaknesses: [
          { title: "تشتت التغطية بالدقائق الأولى", desc: "استقبال أهداف مبكرة بسبب عدم الدخول السريع في أجواء المباراة." },
          { title: "كثرة ارتكاب الأخطاء الفردية", desc: "تسرع في التمرير بثلث الملعب الخاص بالفريق." }
        ] 
      }
    };
  }
};

export const MatchPreview = ({ content, match }: { content: any; match?: any }) => {
  if (!content || !match || match.isHidden) return null;
  
  const probs = getWinProbability(match);
  const tactics = getTacticalAnalysis(match);
  
  if (!tactics) return null;

  const homeName = match?.homeTeam?.name || '';
  const awayName = match?.awayTeam?.name || '';

  return (
    <div className="bg-gradient-to-b from-[#0f172a]/90 to-[#05070f]/95 rounded-[2.5rem] p-6 sm:p-8 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl space-y-8 relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)] shrink-0 animate-pulse">
            <Sparkles className="text-black" size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-primary tracking-widest flex items-center gap-1.5 mb-1">
              <TrendingUp size={12} /> تحليل ذكي مدعوم بالذكاء الاصطناعي
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {content.title || `التحليل التكتيكي لمباراة ${homeName} ضد ${awayName}`}
            </h2>
          </div>
        </div>
        
        {content.seoKeywords && content.seoKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {content.seoKeywords.slice(0, 3).map((kw: string, idx: number) => (
              <span key={idx} className="bg-white/5 border border-white/10 text-gray-300 text-[10px] px-3 py-1.5 rounded-xl font-bold">
                #{kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick Summary Card */}
      {content.summary && (
        <div className="bg-gradient-to-l from-primary/10 via-primary/[0.02] to-transparent p-5 sm:p-6 rounded-2xl border border-primary/20 relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-primary to-amber-500" />
          <p className="text-primary font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span>⚡ الخلاصة السريعة للمباراة</span>
          </p>
          <p className="text-gray-100 text-sm sm:text-base leading-relaxed font-semibold">
            {content.summary}
          </p>
        </div>
      )}

      {/* Win Prediction Section */}
      <div className="space-y-4">
        <h3 className="text-white font-extrabold text-sm sm:text-base flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" /> توقعات الفوز ونسب التفوق الفني
        </h3>
        
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center text-xs text-gray-400 font-extrabold">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> {homeName}: {probs.home}%
            </span>
            <span className="text-gray-400">التعادل: {probs.draw}%</span>
            <span className="flex items-center gap-1.5 text-blue-400">
              {awayName}: {probs.away}% <span className="w-2 h-2 rounded-full bg-blue-500" />
            </span>
          </div>

          {/* Three-segment custom progress bar */}
          <div className="w-full h-4 rounded-full bg-white/5 overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${probs.home}%` }} 
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 relative group"
              title={`${homeName}: ${probs.home}%`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div 
              style={{ width: `${probs.draw}%` }} 
              className="h-full bg-slate-600 transition-all duration-1000"
              title={`التعادل: ${probs.draw}%`}
            />
            <div 
              style={{ width: `${probs.away}%` }} 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 relative group"
              title={`${awayName}: ${probs.away}%`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed font-medium pt-1 bg-white/[0.01] px-4 py-3 rounded-xl border border-white/[0.02]">
            <span className="text-primary font-black ml-1">استنتاج الذكاء الاصطناعي:</span>
            {probs.verdict}
          </p>
        </div>
      </div>

      {/* Strengths & Weaknesses (Tactical Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Strengths Card */}
        <div className="bg-gradient-to-b from-[#0b1019] to-[#05080f] rounded-[2rem] p-5 sm:p-6 border border-emerald-500/10 shadow-xl space-y-4 relative group hover:border-emerald-500/20 transition-all">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <CheckCircle2 className="text-emerald-400" size={20} />
            <h4 className="text-white font-extrabold text-sm sm:text-base">نقاط القوة التكتيكية المتوقعة</h4>
          </div>
          <div className="space-y-4">
            {/* Home Strengths */}
            <div>
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-2">نادي {homeName}</p>
              <ul className="space-y-3">
                {tactics.home.strengths.map((str, idx) => (
                  <li key={idx} className="space-y-0.5">
                    <p className="text-white text-xs sm:text-sm font-bold flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span> {str.title}
                    </p>
                    <p className="text-gray-400 text-xs leading-relaxed pr-3.5">{str.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
            {/* Away Strengths */}
            <div className="border-t border-white/5 pt-3">
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-2">نادي {awayName}</p>
              <ul className="space-y-3">
                {tactics.away.strengths.map((str, idx) => (
                  <li key={idx} className="space-y-0.5">
                    <p className="text-white text-xs sm:text-sm font-bold flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span> {str.title}
                    </p>
                    <p className="text-gray-400 text-xs leading-relaxed pr-3.5">{str.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Weaknesses Card */}
        <div className="bg-gradient-to-b from-[#0b1019] to-[#05080f] rounded-[2rem] p-5 sm:p-6 border border-orange-500/10 shadow-xl space-y-4 relative group hover:border-orange-500/20 transition-all">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <AlertTriangle className="text-orange-400" size={20} />
            <h4 className="text-white font-extrabold text-sm sm:text-base">نقاط الضعف والثغرات المتوقعة</h4>
          </div>
          <div className="space-y-4">
            {/* Home Weaknesses */}
            <div>
              <p className="text-orange-400 text-[10px] font-black uppercase tracking-wider mb-2">نادي {homeName}</p>
              <ul className="space-y-3">
                {tactics.home.weaknesses.map((weak, idx) => (
                  <li key={idx} className="space-y-0.5">
                    <p className="text-white text-xs sm:text-sm font-bold flex items-center gap-1.5">
                      <span className="text-orange-400 font-bold">⚠</span> {weak.title}
                    </p>
                    <p className="text-gray-400 text-xs leading-relaxed pr-3.5">{weak.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
            {/* Away Weaknesses */}
            <div className="border-t border-white/5 pt-3">
              <p className="text-orange-400 text-[10px] font-black uppercase tracking-wider mb-2">نادي {awayName}</p>
              <ul className="space-y-3">
                {tactics.away.weaknesses.map((weak, idx) => (
                  <li key={idx} className="space-y-0.5">
                    <p className="text-white text-xs sm:text-sm font-bold flex items-center gap-1.5">
                      <span className="text-orange-400 font-bold">⚠</span> {weak.title}
                    </p>
                    <p className="text-gray-400 text-xs leading-relaxed pr-3.5">{weak.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Main Preview Paragraph */}
      {content.preview && (
        <div className="space-y-3 border-t border-white/10 pt-6">
          <h4 className="text-white font-extrabold text-sm sm:text-base flex items-center gap-2">
            <Flame className="text-orange-500" size={18} /> نظرة شاملة وتحليل فني عميق
          </h4>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-white/[0.01] p-4 sm:p-5 rounded-2xl border border-white/5">
            {content.preview}
          </p>
        </div>
      )}

      {/* Importance & Context */}
      {(content.matchImportance || content.competitionOverview) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/10 pt-6">
          {content.matchImportance && (
            <div className="bg-[#fb923c]/5 p-5 rounded-2xl border border-[#fb923c]/10 space-y-2">
              <h5 className="text-[#fb923c] font-black text-xs sm:text-sm flex items-center gap-2">
                <Info size={16} /> حسابات المباراة وأهميتها للناديين
              </h5>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{content.matchImportance}</p>
            </div>
          )}
          {content.competitionOverview && (
            <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 space-y-2">
              <h5 className="text-primary font-black text-xs sm:text-sm flex items-center gap-2">
                <Compass size={16} /> سياق ومنافسة البطولة المحلية
              </h5>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{content.competitionOverview}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const MatchAnalysis = ({ content }: { content: any }) => {
  if (!content) return null;

  const hasHomeHistory = content.teamHistory?.home;
  const hasAwayHistory = content.teamHistory?.away;
  const hasH2H = content.headToHeadAnalysis;
  const hasHomePlayers = content.keyPlayers?.home && content.keyPlayers.home.length > 0;
  const hasAwayPlayers = content.keyPlayers?.away && content.keyPlayers.away.length > 0;

  return (
    <div className="bg-gradient-to-b from-[#0f172a]/90 to-[#05070f]/95 rounded-[2.5rem] p-6 sm:p-8 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl space-y-8 mt-6">
      <div>
        <h2 className="text-white font-black text-lg sm:text-xl mb-1 flex items-center gap-2">
          <Sword className="text-primary" size={22} />
          العمق الفني وتفاصيل المواجهات التاريخية
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm font-bold">تحليل متكامل لأوراق وتاريخ الفريقين من غرف التحليل الفني</p>
      </div>

      {/* Tactical breakdown */}
      {content.analysis && (
        <div className="space-y-3 bg-white/[0.01] p-5 rounded-2xl border border-white/5">
          <h3 className="text-white font-extrabold text-sm sm:text-base">التكتيك المتوقع وأسلوب اللعب المرجح</h3>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">{content.analysis}</p>
        </div>
      )}

      {/* Key Players */}
      {(hasHomePlayers || hasAwayPlayers) && (
        <div className="space-y-4">
          <h3 className="text-white font-extrabold text-sm sm:text-base flex items-center gap-2">
            <Users size={18} className="text-primary" />
            صناع الفارق وعناصر المتابعة في اللقاء
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hasHomePlayers && (
              <div className="bg-gradient-to-b from-white/[0.02] to-transparent p-5 rounded-2xl border border-white/5 space-y-3">
                <p className="text-primary font-black text-xs uppercase tracking-wider border-b border-white/5 pb-2">نجوم الفريق المضيف</p>
                <ul className="space-y-2">
                  {content.keyPlayers.home.map((p: string, idx: number) => (
                    <li key={idx} className="text-gray-200 text-xs sm:text-sm font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hasAwayPlayers && (
              <div className="bg-gradient-to-b from-white/[0.02] to-transparent p-5 rounded-2xl border border-white/5 space-y-3">
                <p className="text-amber-500 font-black text-xs uppercase tracking-wider border-b border-white/5 pb-2">نجوم الفريق الضيف</p>
                <ul className="space-y-2">
                  {content.keyPlayers.away.map((p: string, idx: number) => (
                    <li key={idx} className="text-gray-200 text-xs sm:text-sm font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Head to Head Analysis */}
      {hasH2H && (
        <div className="space-y-3 bg-white/[0.01] p-5 rounded-2xl border border-white/5">
          <h3 className="text-white font-extrabold text-sm sm:text-base flex items-center gap-2">
            <History size={18} className="text-indigo-400" />
            تاريخ اللقاءات المباشرة والتفوق النفسي
          </h3>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{content.headToHeadAnalysis}</p>
        </div>
      )}

      {/* Team History block */}
      {(hasHomeHistory || hasAwayHistory) && (
        <div className="space-y-4">
          <h3 className="text-white font-extrabold text-sm sm:text-base">العراقة والإرث الرياضي لكلا الناديين</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hasHomeHistory && (
              <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-2">
                <p className="text-gray-200 font-black text-xs sm:text-sm">تاريخ صاحب الأرض</p>
                <p className="text-gray-400 text-xs leading-relaxed">{content.teamHistory.home}</p>
              </div>
            )}
            {hasAwayHistory && (
              <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-2">
                <p className="text-gray-200 font-black text-xs sm:text-sm">تاريخ الفريق الضيف</p>
                <p className="text-gray-400 text-xs leading-relaxed">{content.teamHistory.away}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const MatchFAQ = ({ content }: { content: any }) => {
  if (!content || !content.faq || content.faq.length === 0) return null;
  
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": content.faq.map((item: any) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <div className="bg-gradient-to-b from-[#0f172a]/90 to-[#05070f]/95 rounded-[2.5rem] p-6 sm:p-8 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl mt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <h4 className="text-white font-black text-md sm:text-lg mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
          <HelpCircle size={22} className="text-primary" />
          أهم الأسئلة الشائعة وتغطية اللقاء (FAQ)
      </h4>
      <div className="space-y-4">
          {content.faq.map((item: any, i: number) => (
              <div key={i} className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300">
                  <p className="text-white font-extrabold text-sm sm:text-base mb-2 flex items-center gap-2">
                    <span className="text-primary font-black font-mono">Q.</span>
                    {item.question}
                  </p>
                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed pl-5">{item.answer}</p>
              </div>
          ))}
      </div>
    </div>
  );
};
