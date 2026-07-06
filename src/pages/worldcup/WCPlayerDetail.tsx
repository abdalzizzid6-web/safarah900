import React from 'react';
import { motion } from 'motion/react';
import { X, Info, Shield } from 'lucide-react';

interface WCPlayerDetailProps {
  playerId: string | number;
  onClose: () => void;
  isDark: boolean;
}

export default function WCPlayerDetail({ playerId, onClose, isDark }: WCPlayerDetailProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border p-6 text-right ${
          isDark ? 'bg-[#0f1424] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
          <h3 className="text-xs font-black text-gray-200 flex items-center gap-1.5">
            <Shield size={14} className="text-[#10b981]" />
            ملف اللاعب المونديالي
          </h3>
          <button 
            onClick={onClose}
            className={`p-1 rounded-full hover:bg-white/10 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs flex items-start gap-2.5">
            <Info className="shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <strong className="block font-black text-orange-300">حدود ترخيص Football-Data المتاح:</strong>
              <p className="text-[10px] text-gray-300 leading-relaxed font-bold">
                حسب قيود الترخيص الممنوح من Football-Data.org، لا تمكّن الحسابات العامة استرجاع صفحات البيو المتكاملة والتفاصيل الشخصية الدقيقة للاعب بشكل مباشر عبر الـ API لتفادي حظر مفاتيح طلبات الخدمة.
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full py-2 bg-[#10b981] text-black hover:bg-[#0f9f6e] transition-colors rounded-xl text-xs font-black shadow-lg shadow-[#10b981]/10"
          >
            حسناً، فهمت
          </button>
        </div>
      </motion.div>
    </div>
  );
}
