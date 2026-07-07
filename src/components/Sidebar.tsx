import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Calendar, 
  Radio, 
  Trophy, 
  Globe, 
  Star, 
  Search, 
  Bell, 
  Info, 
  FileText, 
  ShieldCheck, 
  Phone, 
  HelpCircle, 
  Megaphone, 
  User, 
  Settings as SettingsIcon, 
  Moon, 
  LayoutDashboard, 
  BarChart3, 
  Key, 
  FileEdit,
  Rss,
  Share2,
  X,
  ChevronRight,
  ChevronDown,
  Newspaper
} from 'lucide-react';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import InstallAppButton from './InstallAppButton';
import { triggerHapticVibration } from '../utils/haptics';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [activeSection, setActiveSection] = useState<string | null>('main');

  // Hardcoded for now as per app convention or check from metadata/firebase if needed
  // Typically we'd check user claims, but for this app it might be email based or just a flag
  const isAdmin = user?.email === 'abdalziz2022@gmail.com';

  const menuSections = [
    {
      id: 'main',
      title: 'القائمة الرئيسية',
      items: [
        { name: 'الرئيسية', path: '/', icon: Home },
        { name: 'المباريات', path: '/schedule', icon: Calendar },
        { name: 'البث المباشر', path: '/schedule?tab=LIVE', icon: Radio },
        { name: 'البطولات', path: '/leagues', icon: Trophy },
        { name: 'ترتيب الدوريات', path: '/standings', icon: Trophy },
        { name: 'أخبار الرياضة', path: '/news', icon: Newspaper },
        { name: 'كأس العالم 2026', path: '/world-cup-2026', icon: Globe },
        { name: 'المفضلة', path: '/profile', icon: Star },
        { name: 'البحث', path: '/search', icon: Search, isAction: true },
      ]
    },
    {
      id: 'info',
      title: 'معلومات عننا',
      items: [
        { name: 'من نحن', path: '/about', icon: Info },
        { name: 'شروط الاستخدام', path: '/terms', icon: FileText },
        { name: 'سياسة الخصوصية', path: '/privacy', icon: ShieldCheck },
        { name: 'اتصل بنا', path: '/contact', icon: Phone },
        { name: 'الأسئلة الشائعة', path: '/faq', icon: HelpCircle },
        { name: 'الإعلانات', path: '/announcements', icon: Megaphone },
      ]
    },
    {
      id: 'account',
      title: 'الحساب والإعدادات',
      items: [
        { name: 'ملفي الشخصي', path: '/profile', icon: User },
        { name: 'الإعدادات', path: '/settings', icon: SettingsIcon },
        { name: 'تغيير السمة', path: '/theme', icon: Moon, isAction: true },
      ]
    }
  ];

  if (isAdmin) {
    menuSections.push({
      id: 'admin',
      title: 'لوحة التحكم',
      items: [
        { name: 'لوحة التحكم Pro', path: '/dashboard', icon: LayoutDashboard },
        { name: 'لوحة القيادة السريعة', path: '/admin', icon: LayoutDashboard },
        { name: 'مركز التحليلات المتكامل', path: '/admin/analytics-center', icon: BarChart3 },
        { name: 'إدارة الـ API', path: '/admin?tab=api', icon: Key },
      ]
    });
  }

  const handleAction = (item: any) => {
    triggerHapticVibration(15);
    if (item.name === 'البحث') {
      const event = new CustomEvent('open-search');
      window.dispatchEvent(event);
      onClose();
    } else if (item.name === 'تغيير السمة') {
      // Theme toggle could be handled here or via global event
      const event = new CustomEvent('toggle-theme');
      window.dispatchEvent(event);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-[60] w-[85%] max-w-sm bg-[#0b1121] border-l border-white/5 flex flex-col shadow-2xl overflow-hidden"
            dir="rtl"
          >
            {/* Sidebar Header */}
            <div className="p-8 border-b border-white/5 relative bg-gradient-to-br from-primary/10 via-transparent to-transparent">
              <button 
                onClick={onClose}
                className="absolute top-6 left-6 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all active:scale-95"
              >
                <X size={20} />
              </button>

              <Link to="/" onClick={onClose} className="flex flex-col gap-2 group mt-2">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-emerald-600 rounded-3xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)] transform group-hover:rotate-6 transition-all duration-500">
                  <img 
                    src="/src/assets/images/safara_90_logo_1780785060409.png" 
                    alt="Logo" 
                    className="w-[80%] h-[80%] object-contain"
                  />
                </div>
                <div className="mt-2">
                   <h2 className="text-2xl font-black text-white italic">صافرة <span className="text-primary tracking-tighter">90</span></h2>
                   <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">The Premium Football App</p>
                </div>
              </Link>
            </div>

            {/* Navigation Content */}
            <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
              {menuSections.map((section) => (
                <div key={section.id} className="space-y-3">
                  <h3 className="px-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">
                    {section.title}
                  </h3>
                  <div className="grid gap-1">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path || (location.pathname + location.search === item.path);
                      
                      return (
                        <div key={item.name}>
                          {item.isAction ? (
                            <button
                              onClick={() => handleAction(item)}
                              className="w-full text-right block cursor-pointer outline-none"
                            >
                              <motion.div
                                whileTap={{ 
                                  scale: 0.96, 
                                  rotate: [0, -1.5, 1.5, -1.5, 1.5, 0],
                                  x: [0, -1, 1, -1, 1, 0],
                                  transition: { duration: 0.25 }
                                }}
                                className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 text-gray-400 hover:text-white transition-all group"
                              >
                                <div className="flex items-center gap-4">
                                  <item.icon 
                                    size={20} 
                                    strokeWidth={1.75}
                                    className="group-hover:text-primary transition-colors" 
                                  />
                                  <span className="text-sm font-bold">{item.name}</span>
                                </div>
                              </motion.div>
                            </button>
                          ) : (
                            <Link
                              to={item.path}
                              onClick={() => {
                                triggerHapticVibration(15);
                                onClose();
                              }}
                              className="block"
                            >
                              <motion.div
                                whileTap={{ 
                                  scale: 0.96, 
                                  rotate: [0, -1.5, 1.5, -1.5, 1.5, 0],
                                  x: [0, -1, 1, -1, 1, 0],
                                  transition: { duration: 0.25 }
                                }}
                                className={`flex items-center justify-between p-4 rounded-2xl transition-all group relative ${
                                  isActive 
                                    ? 'bg-primary/10 text-primary border border-primary/20' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <item.icon 
                                    size={20} 
                                    strokeWidth={isActive ? 2.5 : 1.75}
                                    className={isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'} 
                                  />
                                  <span className="text-sm font-bold">{item.name}</span>
                                </div>
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />}
                              </motion.div>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Footer */}
            <div className="p-8 border-t border-white/5 bg-black/20">
              <div className="flex flex-col gap-4">
                {/* Always-visible luxury download option */}
                <InstallAppButton variant="sidebar" className="mb-2" />

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white">صافرة 90</span>
                    <span className="text-[10px] text-gray-500 font-mono">الإصدار 2.1.0 (The Arena)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-gray-500">مباشر</span>
                  </div>
                </div>
                
                <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                  © 2026 صافرة 90. جميع الحقوق محفوظة لشركة المنصات الرياضية الرقمية.
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
