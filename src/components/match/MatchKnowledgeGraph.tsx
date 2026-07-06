import React, { useState, useEffect } from 'react';
import { Sparkles, Newspaper, Video, ListCollapse, Award, TrendingUp, Info, Loader2 } from 'lucide-react';
import ImageResolver from '../ui/ImageResolver';

interface MatchKG {
  id: string;
  relatedNews: any[];
  predictions: {
    homeWinProb: number;
    awayWinProb: number;
    drawProb: number;
    scorePrediction: string;
    commentary: string;
  };
  analysis: string;
  videos: { title: string; url: string; thumbnail: string }[];
  highlights: { title: string; videoUrl: string }[];
  statistics: any;
  timeline: { minute: number; type: string; description: string }[];
}

export default function MatchKnowledgeGraph({ matchId }: { matchId: string }) {
  const [data, setData] = useState<MatchKG | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/knowledge/match/${encodeURIComponent(matchId)}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load match knowledge graph:", err);
        setLoading(false);
      });
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-pulse text-center" style={{ direction: 'rtl' }}>
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-gray-400 font-extrabold text-xs">جاري جلب وتحليل المعطيات الفنية للمواجهة...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8" style={{ direction: 'rtl' }}>
      {/* 1. Tactical Predictions & Probabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Win Probabilities card */}
        <div className="md:col-span-2 bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-5">
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <TrendingUp className="text-amber-500 animate-pulse" size={16} />
            <span>مقياس احتمالات الحسم الرياضي</span>
          </h4>
          
          <div className="space-y-4">
            {/* Home Probability */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-300">
                <span>احتمال فوز صاحب الأرض</span>
                <span className="text-amber-500">{data.predictions.homeWinProb}%</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                  style={{ width: `${data.predictions.homeWinProb}%` }}
                />
              </div>
            </div>

            {/* Draw Probability */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-300">
                <span>احتمال التعادل</span>
                <span className="text-gray-400">{data.predictions.drawProb}%</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-600 rounded-full"
                  style={{ width: `${data.predictions.drawProb}%` }}
                />
              </div>
            </div>

            {/* Away Probability */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-gray-300">
                <span>احتمال فوز الضيف</span>
                <span className="text-emerald-500">{data.predictions.awayWinProb}%</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  style={{ width: `${data.predictions.awayWinProb}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Big Score Prediction card */}
        <div className="bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border border-amber-500/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">النتيجة المتوقعة</span>
          <div className="text-4xl sm:text-5xl font-black text-white tracking-widest font-mono">
            {data.predictions.scorePrediction}
          </div>
          <p className="text-[10px] text-gray-400 font-bold max-w-[180px] leading-relaxed">
            توقع فني مبني على معطيات هجومية ودفاعية مسبقة.
          </p>
        </div>
      </div>

      {/* 2. Tactical Commentary & Expert Analysis */}
      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-3">
        <h4 className="text-xs font-black text-amber-500 flex items-center gap-2">
          <Sparkles size={14} />
          <span>المساعد والتحليل التكتيكي المتقدم</span>
        </h4>
        <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-medium">
          {data.analysis}
        </p>
        <p className="text-xs text-gray-400 border-t border-white/5 pt-3 leading-relaxed">
          💡 <span className="font-bold">رؤية المحللين:</span> {data.predictions.commentary}
        </p>
      </div>

      {/* 3. Related News & Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* News Column */}
        <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl space-y-4">
          <h4 className="text-xs font-black text-emerald-400 flex items-center gap-2">
            <Newspaper size={14} />
            <span>الأخبار والتغطيات المرتبطة بالمواجهة</span>
          </h4>
          <div className="space-y-3">
            {data.relatedNews && data.relatedNews.length > 0 ? (
              data.relatedNews.map((news, idx) => (
                <div key={idx} className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.01]">
                  <h5 className="text-xs font-black text-white line-clamp-1">{news.title}</h5>
                  <p className="text-[10px] text-gray-400 line-clamp-2 mt-1 leading-normal font-medium">{news.excerpt || news.summary}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-8">لا تتوفر مقالات أو أخبار مرتبطة بالمباراة حالياً.</p>
            )}
          </div>
        </div>

        {/* Video Highlights & Media */}
        <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl space-y-4">
          <h4 className="text-xs font-black text-emerald-400 flex items-center gap-2">
            <Video size={14} />
            <span>فيديوهات وملخصات حية</span>
          </h4>
          <div className="space-y-3">
            {data.videos && data.videos.length > 0 ? (
              data.videos.map((vid, idx) => (
                <a
                  key={idx}
                  href={vid.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-white/[0.02] hover:bg-white/5 rounded-xl border border-white/[0.01] transition-all group"
                >
                  <div className="w-16 h-11 bg-slate-900 rounded-lg overflow-hidden shrink-0 relative">
                    <ImageResolver src={vid.thumbnail} alt="" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                        <span className="text-[10px]">▶</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-white line-clamp-1 group-hover:text-amber-400 transition-colors">{vid.title}</span>
                </a>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-8">لا تتوفر وسائط ومقاطع فيديو حالياً.</p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Events Timeline Track */}
      {data.timeline && data.timeline.length > 0 && (
        <div className="bg-slate-950/20 border border-white/5 p-6 rounded-2xl space-y-4">
          <h4 className="text-xs font-black text-amber-500 flex items-center gap-2">
            <ListCollapse size={14} />
            <span>الخط الزمني الفني واللقطات التكتيكية للمباراة</span>
          </h4>
          <div className="relative border-r border-white/10 pr-5 space-y-5 mr-1 pt-1">
            {data.timeline.map((item, index) => (
              <div key={index} className="relative group text-xs text-right">
                <div className="absolute -right-[27px] top-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-slate-950" />
                <div className="flex gap-2 items-center">
                  <span className="font-mono font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    دقيقة {item.minute}'
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded">
                    {item.type}
                  </span>
                </div>
                <p className="text-gray-300 font-medium mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
