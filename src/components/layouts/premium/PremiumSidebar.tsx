import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Home, Calendar, Newspaper, Users, Trophy, Settings, ShieldAlert, Video } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';
import { useSettings } from '../../../context/SettingsContext';
import { triggerHapticVibration } from '../../../utils/haptics';

interface PremiumSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { path: '/', icon: Home, label: 'الرئيسية' },
  { path: '/schedule', icon: Calendar, label: 'المباريات' },
  { path: '/news', icon: Newspaper, label: 'الأخبار' },
  { path: '/leagues', icon: Trophy, label: 'البطولات' },
  { path: '/teams', icon: Users, label: 'الفرق' },
  { path: '/videos', icon: Video, label: 'فيديو' },
];

export default function PremiumSidebar({ isOpen, onClose }: PremiumSidebarProps) {
  const [user] = useAuthState(auth);
  const location = useLocation();
  const { settings } = useSettings();
  
  const isAdmin = user?.email === 'abdalziz2022@gmail.com' || user?.email === 'admin@safara90.com';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[280px] sm:w-[320px] bg-surface border-l border-border z-50 flex flex-col shadow-dropdown"
          >
            <div className="p-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                )}
                <span className="font-bold text-lg text-text tracking-tighter">
                  <span className="italic">صافرة</span>
                  <span className="text-primary">90</span>
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      triggerHapticVibration(15);
                      onClose();
                    }}
                    className="block"
                  >
                    <motion.div
                      whileTap={{ 
                        scale: 0.95, 
                        rotate: [0, -1.5, 1.5, -1.5, 1.5, 0],
                        x: [0, -1, 1, -1, 1, 0],
                        transition: { duration: 0.25 }
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                        isActive 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : 'text-text hover:bg-surface-hover border border-transparent'
                      }`}
                    >
                      <Icon 
                        size={20} 
                        strokeWidth={isActive ? 2.5 : 1.75}
                        className={isActive ? 'text-primary' : 'text-text-secondary group-hover:text-text transition-colors'} 
                      />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <motion.div layoutId="active-sidebar-pill" className="absolute left-4 w-1.5 h-6 bg-primary rounded-full" />
                      )}
                    </motion.div>
                  </Link>
                );
              })}

              {isAdmin && (
                <div className="pt-4 mt-4 border-t border-border">
                  <p className="px-4 text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">الإدارة</p>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => {
                      triggerHapticVibration(15);
                      onClose();
                    }}
                    className="block"
                  >
                    <motion.div
                      whileTap={{ 
                        scale: 0.95, 
                        rotate: [0, -1.5, 1.5, -1.5, 1.5, 0],
                        x: [0, -1, 1, -1, 1, 0],
                        transition: { duration: 0.25 }
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-error hover:bg-error/10 border border-transparent hover:border-error/20"
                    >
                      <ShieldAlert size={20} strokeWidth={2} />
                      <span className="font-medium">لوحة التحكم</span>
                    </motion.div>
                  </Link>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border">
              <Link 
                to="/profile"
                onClick={() => {
                  triggerHapticVibration(15);
                  onClose();
                }}
                className="block"
              >
                <motion.div 
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-surface border border-border overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-secondary">
                        <Settings size={20} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text">{user?.displayName || 'حسابي'}</p>
                    <p className="text-xs text-text-secondary">{user?.email || 'إعدادات الحساب'}</p>
                  </div>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
