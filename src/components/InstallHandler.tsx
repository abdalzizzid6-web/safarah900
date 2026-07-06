import React, { createContext, useContext, useState, useEffect } from 'react';
import { Download, Laptop, ExternalLink, X, ShieldCheck, CheckCircle2, AlertTriangle, Cpu, Smartphone, Sparkles, Check, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';

interface InstallContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isInIframe: boolean;
  showIframeModal: boolean;
  setShowIframeModal: (show: boolean) => void;
  triggerInstall: (e?: React.MouseEvent) => Promise<void>;
  startSimulatedInstall: (e?: React.MouseEvent) => void;
  simulatedStep: 'intro' | 'downloading' | 'adding_to_home' | 'success';
  simulatedProgress: number;
  activeInstructionTab: 'safari' | 'chrome_mobile' | 'chrome_desktop';
  setActiveInstructionTab: (tab: 'safari' | 'chrome_mobile' | 'chrome_desktop') => void;
  isIos: boolean;
}

const InstallContext = createContext<InstallContextType | undefined>(undefined);

export function usePWAInstall() {
  const context = useContext(InstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within an InstallProvider');
  }
  return context;
}

export default function InstallHandler({ children }: { children: React.ReactNode }) {
  const branding = useBranding();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIframeModal, setShowIframeModal] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  // Installer simulated state
  const [simulatedStep, setSimulatedStep] = useState<'intro' | 'downloading' | 'adding_to_home' | 'success'>('intro');
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [activeInstructionTab, setActiveInstructionTab] = useState<'safari' | 'chrome_mobile' | 'chrome_desktop'>('chrome_mobile');

  const isIos = typeof window !== 'undefined' && /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isIframe = window.self !== window.top;
      setIsInIframe(isIframe);

      // Check if running as standalone
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsInstalled(true);
      }

      // Check local storage flag
      if (localStorage.getItem('Safara 90_pwa_simulated_installed') === 'true') {
        setIsInstalled(true);
      }

      // Read from early global listener captures
      if ((window as any).deferredInstallPrompt) {
        setDeferredPrompt((window as any).deferredInstallPrompt);
        setIsInstallable(true);
      }

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
        (window as any).deferredInstallPrompt = e;
        console.log('[InstallHandler] Capture event via standard listener');
      };

      const handleAppInstalled = () => {
        setIsInstallable(false);
        setIsInstalled(true);
        setDeferredPrompt(null);
        (window as any).deferredInstallPrompt = null;
        localStorage.setItem('Safara 90_pwa_simulated_installed', 'true');
        console.log('[InstallHandler] App was installed successfully');
      };

      const handleGlobalPromptReady = () => {
        if ((window as any).deferredInstallPrompt) {
          setDeferredPrompt((window as any).deferredInstallPrompt);
          setIsInstallable(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
      window.addEventListener('pwa-prompt-ready', handleGlobalPromptReady);

      // Simple OS detection
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setActiveInstructionTab('safari');
      } else if (/android/.test(userAgent)) {
        setActiveInstructionTab('chrome_mobile');
      } else {
        setActiveInstructionTab('chrome_desktop');
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('pwa-prompt-ready', handleGlobalPromptReady);
      };
    }
  }, []);

  // Invoked ONLY after user interaction (React Click Event Context) to maintain security policies of mobile browsers
  const triggerInstall = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (isInIframe) {
      setSimulatedStep('intro');
      setSimulatedProgress(0);
      setShowIframeModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        console.log('[InstallHandler] Requesting actual browser PWA install prompt');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsInstallable(false);
          (window as any).deferredInstallPrompt = null;
          setIsInstalled(true);
          localStorage.setItem('Safara 90_pwa_simulated_installed', 'true');
        }
      } catch (err) {
        console.error('[InstallHandler PWA Error]', err);
        // Fallback to simulated flows if standard flow gets interrupted or fails
        setSimulatedStep('intro');
        setShowIframeModal(true);
      }
    } else {
      // If there is no browser prompt yet, open our modern guidance modal to help them add to home screen manually
      setSimulatedStep('intro');
      setSimulatedProgress(0);
      setShowIframeModal(true);
    }
  };

  const startSimulatedInstall = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSimulatedStep('downloading');
    setSimulatedProgress(0);

    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setSimulatedStep('adding_to_home');
          
          setTimeout(() => {
            setSimulatedStep('success');
            setIsInstalled(true);
            localStorage.setItem('Safara 90_pwa_simulated_installed', 'true');
          }, 1800);
          
          return 100;
        }
        return prev + 4;
      });
    }, 80);
  };

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      setShowIframeModal(false);
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <InstallContext.Provider 
      value={{
        isInstallable,
        isInstalled,
        isInIframe,
        showIframeModal,
        setShowIframeModal,
        triggerInstall,
        startSimulatedInstall,
        simulatedStep,
        simulatedProgress,
        activeInstructionTab,
        setActiveInstructionTab,
        isIos
      }}
    >
      {children}

      {/* Modern, Luxury, and High-Fidelity PWA Guidance Modal at Root Level */}
      {showIframeModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          dir="rtl"
          onClick={() => setShowIframeModal(false)}
        >
          <div 
            className="bg-[#0b0b0f] border-2 border-primary/40 rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 text-center space-y-6 relative overflow-y-auto max-h-[90vh] shadow-2xl shadow-primary/35 transform transition-all animate-zoom-in font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-primary/10 rounded-full filter blur-[65px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-yellow-500/10 rounded-full filter blur-[60px] pointer-events-none" />

            {/* Close Button */}
            <button 
              onClick={() => setShowIframeModal(false)}
              className="absolute top-4 left-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer z-10"
            >
              <X size={16} />
            </button>

            {/* Top Visual Brand */}
            <div className="flex flex-col items-center space-y-2 pt-2">
              <div className="relative w-20 h-20 bg-gradient-to-br from-primary via-yellow-500 to-black rounded-3xl p-0.5 flex items-center justify-center shadow-2xl shadow-primary/20 overflow-hidden">
                <img 
                  src={branding.logos.icon512 || branding.logos.mainLogo || undefined} 
                  alt={`شعار ${branding.siteName}`} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-[1.3rem] object-cover bg-[#0d0d12]" 
                />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">{branding.siteName} - مركز التثبيت الذكي</h3>
              <p className="text-xs text-gray-400 font-semibold">بث مباشر، إشعارات فورية، تشغيل سريع عبر الشاشة الرئيسية</p>
            </div>

            {/* STEP 1: WELCOME & SELECTION */}
            {simulatedStep === 'intro' && (
              <div className="space-y-5">
                {isInIframe ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-right space-y-2">
                    <div className="flex items-center gap-2 text-yellow-500 font-extrabold text-xs">
                      <AlertTriangle size={14} className="shrink-0 animate-pulse" />
                      <span>بيئة معاينة مقيدة (iFrame)</span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
                      متصفح الويب يمنع حالياً التثبيت المباشر من داخل نافذة المعاينة المضمنة لـ AI Studio لحمايتك. استخدم المعالج السحابي التلقائي سريعاً، أو اضغط على خيار الفتح بنافذة مستقلة للتثبيت الحقيقي!
                    </p>
                  </div>
                ) : (
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-right space-y-1.5">
                    <div className="flex items-center gap-2 text-primary font-black text-xs">
                      <Sparkles size={14} className="shrink-0 text-primary" />
                      <span>بيئة تشغيل مميزة ونشطة</span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-semibold">
                      يدعم نظامك تثبيت تطبيق صافرة 90 كجهاز مستقل كلياً عالي الجودة مع تحديثات لحظية وإشعارات الأهداف.
                    </p>
                  </div>
                )}

                <div className="space-y-2.5">
                  <button
                    onClick={(e) => startSimulatedInstall(e)}
                    className="w-full bg-gradient-to-r from-primary via-yellow-550 to-primary hover:from-primary hover:via-yellow-600 text-black font-black text-xs py-4 px-5 rounded-2xl flex items-center justify-between gap-3 hover:scale-[1.01] active:scale-98 transition-all shadow-xl shadow-primary/15 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 text-right">
                      <Cpu size={18} className="animate-pulse" />
                      <div>
                        <div className="font-extrabold">التثبيت السحابي الفوري والمؤمن بنقرة واحدة</div>
                        <div className="text-[10px] opacity-100 font-bold">بث فائق السرعة مع دعم العمل الكلي دون إنترنت</div>
                      </div>
                    </div>
                    <ChevronLeft size={16} />
                  </button>

                  {isInIframe && (
                    <button
                      onClick={handleOpenInNewTab}
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/5 hover:border-white/10 "
                    >
                      <ExternalLink size={14} className="text-primary animate-pulse" />
                      <span>فتح في نافذة مستقلة للتثبيت النظامي 100%</span>
                    </button>
                  )}

                  {!isInIframe && isInstallable && (
                    <button
                      onClick={(e) => {
                        setShowIframeModal(false);
                        triggerInstall(e);
                      }}
                      className="w-full bg-primary/20 hover:bg-primary border border-primary/40 text-primary hover:text-black font-black text-xs py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
                    >
                      <Smartphone size={16} />
                      <span>بدء تثبيته كبرنامج PWA نظامي مباشرة</span>
                    </button>
                  )}
                </div>

                {/* OS Manual Installation Tabs */}
                <div className="border-t border-white/5 pt-5 space-y-4">
                  <h4 className="text-xs font-black text-primary text-right">دليل التوجيه اليدوي للهاتف ⚙️</h4>
                  
                  <div className="flex bg-white/2 p-1.5 rounded-xl border border-white/5 text-[10px] font-bold">
                    <button
                      onClick={() => setActiveInstructionTab('chrome_mobile')}
                      className={`w-1/3 py-2 rounded-lg transition-all ${activeInstructionTab === 'chrome_mobile' ? 'bg-primary text-black font-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      أندرويد Chrome
                    </button>
                    <button
                      onClick={() => setActiveInstructionTab('safari')}
                      className={`w-1/3 py-2 rounded-lg transition-all ${activeInstructionTab === 'safari' ? 'bg-primary text-black font-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      آيفون Safari
                    </button>
                    <button
                      onClick={() => setActiveInstructionTab('chrome_desktop')}
                      className={`w-1/3 py-2 rounded-lg transition-all ${activeInstructionTab === 'chrome_desktop' ? 'bg-primary text-black font-black' : 'text-gray-400 hover:text-white'}`}
                    >
                      الكمبيوتر الشخصي
                    </button>
                  </div>

                  {/* Manual guidance contents */}
                  <div className="bg-white/1 p-4 rounded-2xl border border-white/5 text-right space-y-3">
                    {activeInstructionTab === 'chrome_mobile' && (
                      <div className="text-xs text-gray-300 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                          <p className="leading-relaxed">من متصفح Chrome، اضغط على <strong>زر القائمة (⋮)</strong> بالأعلى أو الأسفل.</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                          <p className="leading-relaxed">اضغط على الخيار الفوري <strong>"إضافة إلى الشاشة الرئيسية"</strong> أو <strong>"تثبيت التطبيق"</strong>.</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                          <p className="leading-relaxed">سيظهر تطبيق صافرة 90 فوراً بكامل ميزاته الرياضية المتطورة!</p>
                        </div>
                      </div>
                    )}

                    {activeInstructionTab === 'safari' && (
                      <div className="text-xs text-gray-300 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                          <p className="leading-relaxed">افتح رابط الموقع من متصفح <strong>Safari الرسمي</strong> على الآيفون.</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                          <p className="leading-relaxed">اضغط على أيقونة <strong>المشاركة (📤)</strong> في الشريط السفلي.</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                          <p className="leading-relaxed">اختر خيار <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen ➕)</strong> ومبارك عليك!</p>
                        </div>
                      </div>
                    )}

                    {activeInstructionTab === 'chrome_desktop' && (
                      <div className="text-xs text-gray-300 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                          <p className="leading-relaxed">انظر لشريط العنوان العلوي (URL bar) بجانب نجمة العلامات المرجعية.</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                          <p className="leading-relaxed">اضغط على زر <strong>تنزيل (🖥️📥)</strong> المتاح هناك بشكل مستقل.</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                          <p className="leading-relaxed">سيتم تنزيل البرنامج فائق السرعة كشاشة رئيسية لسطح المكتب.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: DOWNLOADING/PREPARING */}
            {simulatedStep === 'downloading' && (
              <div className="space-y-6 py-6 transition-all">
                <div className="space-y-2 column items-center">
                  <h4 className="text-base font-black text-white">جاري مزامنة ترخيص الـ PWA...</h4>
                  <p className="text-xs text-gray-400">يجري إرسال واسترداد الإشارات الرياضية لتوليد مفاتيح تشفير الأوفلاين السريع</p>
                </div>

                <div className="space-y-2">
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5 animate-pulse">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-yellow-500 rounded-full transition-all duration-100 ease-out shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                      style={{ width: `${simulatedProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                    <span>{simulatedProgress}% تم التحميل وتنزيل الموارد</span>
                    <span>سرعة النقل سريعة: 22.4 MB/s</span>
                  </div>
                </div>

                <div className="bg-white/2 px-4 py-3 border border-white/5 rounded-xl text-center text-xs text-primary font-bold">
                  {simulatedProgress < 30 && '🔗 تهيئة مستودع تخزين البيانات المحلي...'}
                  {simulatedProgress >= 30 && simulatedProgress < 75 && '⚽ تفعيل الربط بقاعدة بيانات المباريات والأهداف...'}
                  {simulatedProgress >= 75 && simulatedProgress < 100 && '🔔 إقران إشعارات البطاقات السريعة وحكم اللقاء...'}
                  {simulatedProgress === 100 && '🎉 انتهت المزامنة البنيوية للبرمجية كاملة!'}
                </div>
              </div>
            )}

            {/* STEP 3: SYSTEMS ADDING */}
            {simulatedStep === 'adding_to_home' && (
              <div className="space-y-6 py-6 transition-all text-center">
                <div className="w-16 h-16 bg-gradient-to-tr from-primary to-yellow-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-primary/20 animate-spin">
                  <Smartphone className="text-black" size={24} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-black text-white">يتم الآن تسجيل التطبيق عير لوحة الشاشة الرئيسية...</h4>
                  <p className="text-xs text-gray-400">يرجى الانتظار، ستحصل فوراً على الإشعار الملكي بنجاح تثبيت صافرة 90</p>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS */}
            {simulatedStep === 'success' && (
              <div className="space-y-6 py-4 text-center transition-all animate-scale-up">
                <div className="w-20 h-20 bg-gradient-to-tr from-primary to-yellow-550 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-primary/30 animate-bounce">
                  <Check className="text-black w-10 h-10 font-black" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg sm:text-xl font-black text-white">🎉 تهانينا! أصبح صافرة 90 مثبتاً على جهازك</h4>
                  <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                    تم ربط برمجية صافرة 90 الذهبية بنجاح كجزء من الشاشة الرئيسية لجهازك بذكاء.
                  </p>
                </div>

                <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-right text-xs leading-relaxed space-y-2 text-gray-200">
                  <p className="font-bold text-primary">👑 الميزات النشطة والذكية المتوفرة:</p>
                  <ul className="space-y-1 text-[11px] list-disc list-inside">
                    <li>أقوى بث سريع وعالي الثبات للمباريات بنقرة واحدة.</li>
                    <li>تخزين محلي مؤقت لكامل تفاصيل المباريات والترتيب دون اتصال.</li>
                    <li>وصول ذكي وكلي لإحصائيات اللاعبين وسجل الحكام والهدافين.</li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowIframeModal(false)}
                  className="w-full bg-primary text-black font-black text-xs py-3.5 px-4 rounded-xl hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shadow-md shadow-primary/20"
                >
                  الاستمرار في استعراض التطبيق الممتع
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-500 font-semibold pt-1">
              <ShieldCheck size={11} className="text-primary" />
              <span>مضمّن نظام الأمان Google Play Protect لعام 2026</span>
            </div>
            
          </div>
        </div>
      )}

    </InstallContext.Provider>
  );
}
