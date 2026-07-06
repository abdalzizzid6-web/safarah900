import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle } from 'lucide-react';

export default function AlertsWidget({ simResult }: { simResult: { success: boolean; message: string } | null }) {
  if (!simResult) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`mt-6 p-4 rounded-2xl border flex items-start gap-3 ${
          simResult.success 
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' 
            : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
        }`}
      >
        <div className="mt-0.5">
          <CheckCircle size={16} className={simResult.success ? 'text-emerald-400' : 'text-rose-400'} />
        </div>
        <div className="flex-1 text-xs">
          <span className="font-extrabold block mb-1">تنبيهات فاحص المحاكاة الأمني:</span>
          <span className="font-mono leading-relaxed">{simResult.message}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
