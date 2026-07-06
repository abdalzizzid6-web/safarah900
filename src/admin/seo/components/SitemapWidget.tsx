import React from 'react';
import { SitemapsStatus } from '../types';

interface SitemapWidgetProps {
  sitemaps: Record<string, SitemapsStatus>;
}

export const SitemapWidget: React.FC<SitemapWidgetProps> = ({ sitemaps }) => {
  return (
    <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-4">
      <h4 className="text-xs font-black text-white border-b border-white/5 pb-2">
        خرائط الموقع المفحوصة (Sitemap status list)
      </h4>
      
      <div className="space-y-4">
        {Object.entries(sitemaps).map(([name, s]) => (
          <div
            key={name}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="space-y-0.5">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider font-mono">
                {name}
              </span>
              <span className="text-[10px] text-gray-500 font-mono block truncate max-w-xs md:max-w-md">
                {s.url}
              </span>
            </div>
            
            <div className="flex items-center gap-3 font-mono font-bold text-xs shrink-0">
              {s.status === 'OK' ? (
                <>
                  <span className="text-gray-400">{s.urlsCount} روابط</span>
                  <span className="text-gray-500">
                    {(s.sizeBytes ? s.sizeBytes / 1024 : 0).toFixed(1)} KB
                  </span>
                  <span className="text-emerald-400 font-black bg-emerald-500/10 px-2 py-0.5 rounded">
                    200 OK
                  </span>
                </>
              ) : s.status === 'LOADING' ? (
                <span className="text-gray-500 animate-pulse">جاري الاستعلام...</span>
              ) : (
                <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded font-black">
                  ERR ({s.error || 'Unknown Error'})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
