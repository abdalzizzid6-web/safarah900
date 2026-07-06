import React, { useState, useEffect } from 'react';
import { Play, Video, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import ImageResolver from './ui/ImageResolver';

interface Highlight {
  title: string;
  videoUrl: string;
  thumbnail?: string;
}

interface MatchKG {
  videos: { title: string; url: string; thumbnail: string }[];
  highlights: { title: string; videoUrl: string }[];
}

export default function MatchHighlights({ matchId }: { matchId: string }) {
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
        console.error("Failed to load match highlights:", err);
        setLoading(false);
      });
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4" style={{ direction: 'rtl' }}>
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-gray-400 font-black text-sm">جاري جلب أهداف وملخصات المباراة...</p>
      </div>
    );
  }

  const allHighlights: Highlight[] = [
    ...(data?.videos || []).map(v => ({ title: v.title, videoUrl: v.url, thumbnail: v.thumbnail })),
    ...(data?.highlights || []).map(h => ({ title: h.title, videoUrl: h.videoUrl }))
  ];

  if (allHighlights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4" style={{ direction: 'rtl' }}>
        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-4xl grayscale opacity-50">
          🎬
        </div>
        <div>
          <h3 className="text-white font-black text-lg mb-1">لا توجد ملخصات فيديو حالياً</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
            يتم توفير الأهداف والملخصات المرئية عادةً بعد وقت قصير من حدوثها أو نهاية اللقاء.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Video className="text-emerald-500" size={20} />
          <span>أهداف ولقطات المباراة</span>
        </h3>
        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
          LIVE Highlights
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allHighlights.map((highlight, idx) => (
          <a
            key={idx}
            href={highlight.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300"
          >
            {/* Thumbnail Area */}
            <div className="aspect-video relative overflow-hidden bg-slate-950">
              {highlight.thumbnail ? (
                <ImageResolver 
                  src={highlight.thumbnail} 
                  alt={highlight.title} 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-500/5">
                  <Play className="text-emerald-500/20" size={40} />
                </div>
              )}
              
              {/* Play Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                <div className="w-12 h-12 bg-emerald-500 text-black rounded-full flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                  <Play size={20} fill="black" className="translate-x-0.5" />
                </div>
              </div>

              {/* Tag */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                 <Sparkles size={10} className="text-amber-500" />
                 <span className="text-[9px] font-black text-white">لقطة مميزة</span>
              </div>
            </div>

            {/* Title Area */}
            <div className="p-4 flex items-center justify-between gap-3">
              <h4 className="text-xs font-black text-gray-200 line-clamp-2 leading-relaxed group-hover:text-emerald-400 transition-colors">
                {highlight.title}
              </h4>
              <div className="shrink-0 p-2 rounded-lg bg-white/5 text-gray-500 group-hover:text-white transition-colors">
                <ExternalLink size={14} />
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
        <p className="text-[10px] text-emerald-500/70 font-bold leading-relaxed text-center">
          ملاحظة: يتم جلب روابط الفيديو من منصات التواصل الاجتماعي الرسمية ومصادر البث المفتوحة. قد تختلف الجودة بناءً على المصدر.
        </p>
      </div>
    </div>
  );
}
