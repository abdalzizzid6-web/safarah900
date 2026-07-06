import React from 'react';
import { motion } from 'motion/react';
import { Terminal, Play } from 'lucide-react';

export default function ApiSecurityWidget({ handleSimulateSSRF, simulatingType }: any) {
  return (
    <div className="bg-[#111113] hover:bg-[#151518] border border-purple-500/10 hover:border-purple-500/30 p-4 rounded-2xl transition-all duration-300">
      <div className="flex items-center gap-2.5 mb-4">
        <Terminal size={18} className="text-purple-400" />
        <h3 className="text-sm font-bold text-white">حماية الواجهات (API Security)</h3>
      </div>
      <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
        يختبر هذا المُحاكي منع هجمات SSRF عبر محاولة الوصول لروابط داخلية على خوادم AWS الإقليمية.
      </p>
      <button
        onClick={handleSimulateSSRF}
        disabled={!!simulatingType}
        className="w-full flex items-center justify-between bg-[#151518] hover:bg-purple-500/10 border border-white/5 p-3 rounded-xl transition-all duration-300 group disabled:opacity-50 disabled:pointer-events-none"
      >
        <span className="text-purple-400 font-bold text-xs">إطلاق هجوم SSRF</span>
        <div className="bg-purple-500/10 text-purple-400 p-2 rounded-lg group-hover:scale-105 transition-transform">
          <Play size={12} fill="currentColor" />
        </div>
      </button>
    </div>
  );
}
