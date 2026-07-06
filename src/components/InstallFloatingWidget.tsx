import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from './InstallHandler';
import { useSettings } from '../context/SettingsContext';
import * as cmsRepository from '../features/cms/repositories/cmsRepository';

export default function InstallFloatingWidget() {
  const { isInstalled, isInstallable, isInIframe, triggerInstall } = usePWAInstall();
  const { settings } = useSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if widget is enabled and conditions met
    if (
      !isInstalled &&                // Already installed?
      isInstallable &&               // Can be installed?
      !isInIframe &&                 // Is in iframe? (we shouldn't show it in iframe)
      settings?.installWidgetEnabled !== false && // Admin setting
      !dismissed
    ) {
      // Check last dismissal
      const lastDismiss = localStorage.getItem('Safara 90_install_widget_dismissed');
      if (lastDismiss) {
        const diff = Date.now() - parseInt(lastDismiss);
        const delayHours = settings?.installWidgetDismissDelayHours ?? 1;
        if (diff < 1000 * 60 * 60 * delayHours) {
          return;
        }
      }
      setIsVisible(true);
      // Track impression
      cmsRepository.trackInstallWidgetStat('impression');
    } else {
      setIsVisible(false);
    }
  }, [isInstalled, isInstallable, isInIframe, settings?.installWidgetEnabled, settings?.installWidgetDismissDelayHours, dismissed]);

  const handleDismiss = () => {
    localStorage.setItem('Safara 90_install_widget_dismissed', Date.now().toString());
    setIsVisible(false);
    setDismissed(true);
    // Track dismissal in stats
    cmsRepository.trackInstallWidgetStat('dismiss');
  };

  const handleInstall = (e: React.MouseEvent) => {
    triggerInstall(e);
    // Track installation in stats
    cmsRepository.trackInstallWidgetStat('install');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto md:w-[400px] z-[9999] bg-slate-900/90 border border-primary/30 p-4 rounded-3xl shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-4"
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
             <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <div className="text-right">
            <h4 className="text-xs font-black text-white leading-tight">
               {settings?.installWidgetText || "قم بتثبيت تطبيق صافرة 90"}
            </h4>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">احصل على تجربة أسرع وإشعارات فورية</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <button
                onClick={handleDismiss}
                className="p-2 text-gray-500 hover:text-white rounded-full transition-all"
            >
                <X size={16} />
            </button>
            <button
                onClick={handleInstall}
                className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] py-2 px-4 rounded-full transition-all active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.3)]"
            >
              تثبيت
            </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
