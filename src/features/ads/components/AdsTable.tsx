import React from 'react';
import { Ad, AdType } from '../types/ad.types';
import { Trash2, Edit2, Zap, Copy, Code, Smartphone, Image as ImageIcon, Clock, XCircle, AlertCircle, Eye, ExternalLink } from 'lucide-react';
import { useAdActions } from '../hooks/useAdActions';

export const AdsTable = ({ ads }: { ads: Ad[] }) => {
  const { toggleAdStatus } = useAdActions();

  return (
    <div className="bg-slate-950/45 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest select-none">
                <th className="px-5 py-5 text-right w-[240px]">البانر</th>
                <th className="px-5 py-5 text-center">النوع</th>
                <th className="px-5 py-5 text-center">مشاهدات</th>
                <th className="px-5 py-5 text-center">نقرات</th>
                <th className="px-5 py-5 text-left w-[200px]">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-5">{ad.title}</td>
                    <td className="px-5 py-5">{ad.type}</td>
                    <td className="px-5 py-5">{ad.views}</td>
                    <td className="px-5 py-5">{ad.clicks}</td>
                    <td className="px-5 py-5">
                       <button onClick={() => toggleAdStatus({id: ad.id, active: !ad.active})}>تبديل</button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
};
