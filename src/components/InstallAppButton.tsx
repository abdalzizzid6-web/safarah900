import React from 'react';
import { Download, Sparkles } from 'lucide-react';
import { usePWAInstall } from './InstallHandler';

interface InstallAppButtonProps {
  variant?: 'navbar' | 'sidebar' | 'dashboard' | 'simple';
  className?: string;
}

export default function InstallAppButton({ variant = 'navbar', className = '' }: InstallAppButtonProps) {
  const { isInstalled, isInstallable, isInIframe, triggerInstall } = usePWAInstall();

  const handleButtonClick = (e: React.MouseEvent) => {
    triggerInstall(e);
  };

  // Render designs based on visual context variant
  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleButtonClick}
        className={`w-full flex items-center justify-between bg-gradient-to-r from-primary/15 to-yellow-500/10 hover:from-primary/25 hover:to-yellow-500/20 border border-primary/30 hover:border-primary/50 text-primary p-3.5 rounded-2xl text-[11px] font-black transition-all cursor-pointer group active:scale-98 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Download size={14} className="group-hover:translate-y-0.5 transition-transform text-primary" />
          <span>{isInstalled ? 'صافرة 90 نشط 👑' : 'تثبيت صافرة 90'}</span>
        </div>
        <span className="text-[9px] bg-primary/20 px-1.5 py-0.5 rounded font-bold text-yellow-500">
          {isInstalled ? 'مفعل' : 'تثبيت'}
        </span>
      </button>
    );
  }

  if (variant === 'dashboard') {
    return (
      <button
        onClick={handleButtonClick}
        className={`w-full bg-gradient-to-r from-primary via-yellow-550 to-primary text-black font-black text-xs py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer ${className}`}
      >
        <Sparkles size={16} className="animate-pulse" />
        <span>{isInstalled ? 'تطبيق صافرة 90 الحقيقي مثبت ومفعل بنجاح 👑' : 'تثبيت تطبيق صافرة 90 على شاشتك فوراً'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleButtonClick}
      className={`flex items-center gap-2 bg-gradient-to-r from-primary/20 to-yellow-500/15 hover:from-primary/30 hover:to-yellow-500/25 border border-primary/40 text-primary hover:text-white font-black px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.15)] active:scale-95 ${className}`}
      title="تثبيت تطبيق صافرة 90 الذكي"
    >
      <Download size={14} className="animate-bounce" />
      <span>{isInstalled ? 'تطبيق صافرة 90 👑' : 'تحميل التطبيق'}</span>
    </button>
  );
}
