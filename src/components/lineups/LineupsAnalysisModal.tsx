import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, TrendingUp, Shield, Zap, Info, RefreshCw, Users, Flame } from 'lucide-react';
import { Player, TeamRoster } from './LineupTypes';

interface LineupsAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeName: string;
  awayName: string;
  isAnalyzing: boolean;
  analysisError: string | null;
  analysisResult: any;
  analysisProgressStep: number;
  onRetry: () => void;
}

export function LineupsAnalysisModal({
  isOpen,
  onClose,
  homeName,
  awayName,
  isAnalyzing,
  analysisError,
  analysisResult,
  analysisProgressStep,
  onRetry
}: LineupsAnalysisModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-text" style={{ direction: 'rtl' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3 }}
        className="bg-[#0c0e12] border border-white/10 rounded-[28px] w-full max-w-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col max-h-[85vh] relative text-right"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">التحليل التكتيكي للتشكيلة وتوقعات الأداء</h3>
              <p className="text-[10px] text-gray-500 font-bold">بواسطة مخرجات الذكاء الاصطناعي من Gemini AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer outline-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-400 animate-spin" />
                <Sparkles size={24} className="text-emerald-400 animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-black text-gray-200">
                  {analysisProgressStep === 0 && "جاري قراءة ودراسة التشكيل والتكتيك المعتمد..."}
                  {analysisProgressStep === 1 && "جاري استنتاج وتحليل نقاط القوة والضعف بالذكاء الاصطناعي..."}
                  {analysisProgressStep === 2 && "جاري توليد توقعات الأداء والسيناريوهات المحتملة..."}
                  {analysisProgressStep >= 3 && "جاري حساب نسب الفوز ونهاية التحليل..."}
                </p>
                <p className="text-xs text-gray-500 font-bold">يستغرق هذا الإجراء بضع ثوانٍ للحصول على أدق البيانات الفنية</p>
              </div>
            </div>
          ) : analysisError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                <Info size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-red-400">فشل التحليل للفريقين</p>
                <p className="text-xs text-gray-500 max-w-md font-bold leading-relaxed">{analysisError}</p>
              </div>
              <button
                onClick={onRetry}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-black font-black text-xs hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10 flex items-center gap-1.5 cursor-pointer outline-none"
              >
                <RefreshCw size={12} className="animate-spin-slow" />
                <span>إعادة المحاولة الفورية</span>
              </button>
            </div>
          ) : analysisResult ? (
            <div className="space-y-6">
              {/* Highlight Dashboard Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Result Probabilities Card */}
                <div className="col-span-1 md:col-span-2 bg-[#12151b] border border-white/5 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-300">نسب احتمالات النتيجة الفنية</span>
                    <TrendingUp size={14} className="text-emerald-400" />
                  </div>
                  
                  {/* Progress Bar Display */}
                  <div className="space-y-2 text-[11px] font-bold">
                    <div className="h-2.5 rounded-full overflow-hidden flex bg-white/5">
                      <div 
                        style={{ width: `${analysisResult.probabilities?.homeWin || 33}%` }} 
                        className="bg-emerald-500 h-full transition-all duration-1000"
                        title={`فوز ${homeName}`}
                      />
                      <div 
                        style={{ width: `${analysisResult.probabilities?.draw || 33}%` }} 
                        className="bg-gray-500 h-full transition-all duration-1000"
                        title="تعادل"
                      />
                      <div 
                        style={{ width: `${analysisResult.probabilities?.awayWin || 34}%` }} 
                        className="bg-indigo-500 h-full transition-all duration-1000"
                        title={`فوز ${awayName}`}
                      />
                    </div>
                    {/* Labels row */}
                    <div className="flex justify-between items-center text-gray-400 mt-1 flex-wrap gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        فوز {homeName}: <span className="text-emerald-400 font-extrabold">{analysisResult.probabilities?.homeWin}%</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-500" />
                        تعادل: <span className="text-gray-300 font-extrabold">{analysisResult.probabilities?.draw}%</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        فوز {awayName}: <span className="text-indigo-400 font-extrabold">{analysisResult.probabilities?.awayWin}%</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Prediction Badge Card */}
                <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-4 flex flex-col justify-center items-center text-center space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">التوقع الرقمي المقترح</span>
                  <div className="text-3xl font-black text-emerald-300 tracking-wider my-1">
                    {analysisResult.predictedScore || "? - ?"}
                  </div>
                  <span className="text-[9px] text-gray-500 font-semibold">توقع النتيجة النهائية</span>
                </div>
              </div>

              {/* Tactical Overview Description */}
              <div className="bg-[#12151b] border border-white/5 rounded-2xl p-5 space-y-2.5">
                <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <Shield size={13} />
                  التحليل التكتيكي وبناء الخطط
                </h4>
                <p className="text-xs text-gray-300 font-medium leading-relaxed">
                  {analysisResult.tacticalOverview}
                </p>
              </div>

              {/* Strengths & Weaknesses comparison grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths Card */}
                <div className="bg-[#12151b] border border-white/5 rounded-2xl p-5 space-y-3.5">
                  <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Zap size={13} className="animate-pulse" />
                    مكامن القوة للخطتين
                  </h4>
                  <div className="space-y-3">
                    {/* Home Strengths */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10 w-fit block">{homeName}</span>
                      <ul className="space-y-1 text-xs text-gray-400 font-semibold">
                        {(analysisResult.strengths?.home || []).map((s: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-0.5">✓</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Away Strengths */}
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.03]">
                      <span className="text-[10px] font-black text-secondary px-1.5 py-0.5 rounded bg-secondary/10 w-fit block">{awayName}</span>
                      <ul className="space-y-1 text-xs text-gray-400 font-semibold">
                        {(analysisResult.strengths?.away || []).map((s: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-0.5">✓</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Weaknesses Card */}
                <div className="bg-[#12151b] border border-white/5 rounded-2xl p-5 space-y-3.5">
                  <h4 className="text-xs font-black text-red-400 flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Info size={13} />
                    نقاط الضعف والثغرات المحتملة
                  </h4>
                  <div className="space-y-3">
                    {/* Home Weaknesses */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10 w-fit block">{homeName}</span>
                      <ul className="space-y-1 text-xs text-gray-400 font-semibold">
                        {(analysisResult.weaknesses?.home || []).map((w: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-red-500 mt-0.5">⚡</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Away Weaknesses */}
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.03]">
                      <span className="text-[10px] font-black text-secondary px-1.5 py-0.5 rounded bg-secondary/10 w-fit block">{awayName}</span>
                      <ul className="space-y-1 text-xs text-gray-400 font-semibold">
                        {(analysisResult.weaknesses?.away || []).map((w: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-red-500 mt-0.5">⚡</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Head-To-Head Matchups */}
              <div className="bg-[#12151b] border border-white/5 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <Users size={13} />
                  المواجهات الثنائية الحاسمة
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
                  {(analysisResult.keyMatchups || []).map((item: any, idx: number) => (
                    <div key={idx} className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-2">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        {item.players}
                      </span>
                      <p className="text-[11px] text-gray-400 font-bold leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Scenario and Narrative Predictions */}
              <div className="bg-[#12151b] border border-white/5 rounded-2xl p-5 space-y-2.5">
                <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <Flame size={13} />
                  سيناريو اللقاء المتوقع
                </h4>
                <p className="text-xs text-gray-300 font-medium leading-relaxed">
                  {analysisResult.predictions}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/5 px-6 py-4 bg-white/[0.01] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-black text-xs transition-all cursor-pointer outline-none"
          >
            إغلاق النافذة
          </button>
        </div>
      </motion.div>
    </div>
  );
}
