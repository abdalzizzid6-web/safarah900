import React from 'react';
import { Loader2, AlertCircle, SearchX, WifiOff } from 'lucide-react';

export const PremiumLoading = ({ message = 'جاري التحميل...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] text-text-secondary w-full">
    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
    <p className="font-medium text-sm animate-pulse">{message}</p>
  </div>
);

export const PremiumEmptyState = ({ title = 'لا توجد بيانات', message = 'لم يتم العثور على أي نتائج مطابقة.' }: { title?: string, message?: string }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-surface/50 border border-border rounded-2xl w-full">
    <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary mb-4 shadow-inner">
      <SearchX size={28} className="opacity-50" />
    </div>
    <h3 className="text-lg font-black text-text mb-2 tracking-tight">{title}</h3>
    <p className="text-sm text-text-secondary max-w-sm">{message}</p>
  </div>
);

export const PremiumErrorState = ({ error = 'حدث خطأ غير متوقع', onRetry }: { error?: string, onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-error/5 border border-error/20 rounded-2xl w-full">
    <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-4 shadow-[0_0_15px_rgba(255,45,85,0.2)]">
      <AlertCircle size={28} />
    </div>
    <h3 className="text-lg font-black text-error mb-2 tracking-tight">عذراً، حدث خطأ</h3>
    <p className="text-sm text-text-secondary max-w-sm mb-6">{error}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-6 py-2.5 bg-surface border border-border rounded-xl text-text hover:bg-surface-hover hover:border-white/20 transition-all active:scale-95 shadow-sm font-bold text-sm"
      >
        حاول مرة أخرى
      </button>
    )}
  </div>
);

export const PremiumOfflineState = ({ onRetry }: { onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-surface/50 border border-border rounded-2xl w-full">
    <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary mb-4 shadow-inner">
      <WifiOff size={28} className="opacity-50" />
    </div>
    <h3 className="text-lg font-black text-text mb-2 tracking-tight">لا يوجد اتصال بالإنترنت</h3>
    <p className="text-sm text-text-secondary max-w-sm mb-6">يرجى التحقق من اتصالك بالشبكة والمحاولة مرة أخرى.</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-6 py-2.5 bg-primary text-black rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-glow font-bold text-sm"
      >
        إعادة المحاولة
      </button>
    )}
  </div>
);

export const PremiumSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-surface-hover rounded-xl ${className}`} />
);

export const PremiumCardSkeleton = () => (
  <div className="bg-surface rounded-2xl p-4 border border-border w-full space-y-4 shadow-sm">
    <div className="flex justify-between items-center">
      <PremiumSkeleton className="h-4 w-24" />
      <PremiumSkeleton className="h-4 w-12" />
    </div>
    <div className="flex items-center gap-4">
      <PremiumSkeleton className="w-12 h-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <PremiumSkeleton className="h-4 w-3/4" />
        <PremiumSkeleton className="h-3 w-1/2" />
      </div>
    </div>
  </div>
);
