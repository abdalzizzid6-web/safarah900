import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Star, EyeOff, Archive, Trash2 } from 'lucide-react';

interface MatchBulkActionsProps {
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  handleBulkApprove: () => void;
  handleBulkFeature: () => void;
  handleBulkHide: () => void;
  handleBulkArchive: () => void;
  handleBulkDelete: () => void;
  handleBulkRestore?: () => void;
  isRecycleBin?: boolean;
}

export function MatchBulkActions({
  selectedIds,
  setSelectedIds,
  handleBulkApprove,
  handleBulkFeature,
  handleBulkHide,
  handleBulkArchive,
  handleBulkDelete,
  handleBulkRestore,
  isRecycleBin = false
}: MatchBulkActionsProps) {
  return (
    <>
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 left-6 right-6 md:left-1/2 md:right-auto md:-translate-x-1/2 bg-zinc-950 border border-white/10 shadow-2xl p-4 rounded-3xl z-50 flex flex-col md:flex-row items-center gap-4 justify-between min-w-[320px] md:min-w-[700px] max-w-full"
            style={{ backdropFilter: 'blur(16px)' }}
          >
            {/* Quick counters */}
            <div className="flex items-center gap-3">
              <div className="bg-primary text-black font-black w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono">
                {selectedIds.length}
              </div>
              <div className="text-right">
                <span className="block text-xs font-black text-white">إجراءات مجمعة جماعية (Bulk Actions)</span>
                <span className="text-[10px] text-gray-400 font-medium">اختر الإجراء المراد تطبيقه على العناصر المحددة</span>
              </div>
            </div>

            {/* Quick Actions buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              
              {/* Reset selected */}
              <button 
                onClick={() => setSelectedIds([])}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                إلغاء التحديد
              </button>

              {isRecycleBin ? (
                <>
                  {/* Bulk Restore */}
                  <button 
                    onClick={handleBulkRestore}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckSquare size={13} />
                    استعادة المحددة
                  </button>
                </>
              ) : (
                <>
                  {/* Bulk Approve */}
                  <button 
                    onClick={handleBulkApprove}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckSquare size={13} />
                    اعتماد ونشر
                  </button>

                  {/* Bulk Feature */}
                  <button 
                    onClick={handleBulkFeature}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Star size={13} className="fill-black" />
                    تمييز كرئيسية
                  </button>

                  {/* Bulk Hide */}
                  <button 
                    onClick={handleBulkHide}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <EyeOff size={13} />
                    حجب وإخفاء
                  </button>

                  {/* Bulk Archive */}
                  <button 
                    onClick={handleBulkArchive}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Archive size={13} />
                    أرشفة جماعية
                  </button>
                </>
              )}

              {/* Bulk Delete */}
              <button 
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                {isRecycleBin ? 'حذف نهائي' : 'نقل للسلة'}
              </button>

            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
