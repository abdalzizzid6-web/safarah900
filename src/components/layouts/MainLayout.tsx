import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Calendar, 
  Newspaper, 
  Bookmark, 
  User, 
  Moon, 
  Sun, 
  Search,
  Bell,
  CheckCircle2,
  XCircle,
  Trophy,
  LayoutGrid,
  Menu
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useSettings } from '../../context/SettingsContext';
import { auth } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import NotificationCenter from '../NotificationCenter';
import { triggerHapticVibration } from '../../utils/haptics';
import WhistleIcon from '../ui/WhistleIcon';
import SearchModal from '../SearchModal';
import Sidebar from '../Sidebar';
import BackNavigation from '../Navigation/BackNavigation';
import LiveScoreWidget from '../LiveScoreWidget';
import Container from '../ui/Container';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { toggleTheme } = useAppStore();
  const { settings } = useSettings();
  const [user] = useAuthState(auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const navItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'المباريات', path: '/schedule', icon: Calendar },
    { name: 'البطولات', path: '/leagues', icon: Trophy },
    { name: 'المزيد', path: '/profile', icon: Menu },
  ];

  const handleSearchClick = () => {
    const event = new CustomEvent('open-search-modal');
    window.dispatchEvent(event);
  };

  const isDarkMode = document.documentElement.classList.contains('light') === false;

  useEffect(() => {
    const handleToggleTheme = () => toggleTheme();
    window.addEventListener('toggle-theme', handleToggleTheme);
    return () => window.removeEventListener('toggle-theme', handleToggleTheme);
  }, [toggleTheme]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-[color:var(--color-text)] font-sans antialiased selection:bg-primary/30 selection:text-white" dir="rtl">
      
      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Premium Floating Dynamic Header */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-4 sm:pt-6 sticky top-0 z-40">
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full glass-premium border border-white/10 rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden backdrop-blur-xl"
        >
          <div className="px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
            
            {/* Left: Menu & Branding */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-95"
              >
                <Menu size={24} />
              </button>

              <Link to="/" className="flex items-center gap-3 group relative">
              <div className="relative">
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {settings.logoUrl ? (
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl overflow-hidden border border-white/10 bg-black/40 p-1 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                    <img 
                      src={settings.logoUrl || undefined} 
                      alt={settings.appName || 'logo'} 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-secondary to-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.3)] transform group-hover:rotate-6 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img 
                      src="/src/assets/images/safara_90_logo_1780785060409.png" 
                      alt="Safara 90 Logo" 
                      className="w-[85%] h-[85%] object-contain relative z-10"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-xl md:text-3xl tracking-tighter text-white group-hover:text-primary transition-colors duration-500 flex items-center gap-2">
                    <span className="italic">صافرة</span>
                    <span className="text-primary">90</span>
                  </h1>
                </div>
              </div>
            </Link>
          </div>

          {/* Middle: Professional Search Bar (Desktop only) */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <button 
                onClick={handleSearchClick}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:bg-white/10 hover:border-white/10 transition-all group"
              >
                <Search size={16} className="group-hover:text-primary transition-colors" />
                <span className="text-xs font-bold">ابحث عن مباراة، فريق، أو دوري...</span>
                <div className="mr-auto text-[9px] font-black border border-white/10 px-1.5 py-0.5 rounded bg-black/40">K / CTRL</div>
              </button>
            </div>

            {/* Right: Functional Controls */}
            <div className="flex items-center gap-1.5 md:gap-3">
              <button 
                onClick={handleSearchClick}
                className="lg:hidden p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-90"
              >
                <Search size={20} />
              </button>

              <NotificationCenter />

              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-yellow-400 transition-all active:rotate-45"
              >
                <AnimatePresence mode="wait">
                  {isDarkMode ? (
                    <motion.div
                      key="sun"
                      initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                    >
                      <Sun size={20} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                    >
                      <Moon size={20} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              <div className="hidden md:flex h-8 w-px bg-white/10 mx-1" />

              <Link 
                to="/profile"
                className="flex items-center gap-2.5 p-1 md:p-1.5 pr-1 md:pr-3.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all group"
              >
                <span className="text-[11px] font-black hidden md:block group-hover:text-primary transition-colors">
                  {user ? (user.displayName || 'حسابي') : 'دخول'}
                </span>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-surface flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-primary/50 transition-all shadow-lg">
                  {user?.photoURL ? (
                    <img src={user.photoURL || undefined} alt="profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={18} className="text-primary" />
                  )}
                </div>
              </Link>
            </div>
          </div>

          {/* Subtle underline gradient */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-50" />
        </motion.header>
      </div>

      {/* Main Content Body */}
      <Container className="flex-grow py-8 pb-32 md:pb-20 transition-all duration-300">
        <BackNavigation />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={
              settings?.navigation?.animationType === 'slide' ? { opacity: 0, x: -20 } :
              settings?.navigation?.animationType === 'fade' ? { opacity: 0 } :
              settings?.navigation?.animationType === 'none' ? { opacity: 1 } :
              { opacity: 0, scale: 0.99 }
            }
            animate={
              settings?.navigation?.animationType === 'slide' ? { opacity: 1, x: 0 } :
              settings?.navigation?.animationType === 'fade' ? { opacity: 1 } :
              settings?.navigation?.animationType === 'none' ? { opacity: 1 } :
              { opacity: 1, scale: 1 }
            }
            exit={
              settings?.navigation?.animationType === 'slide' ? { opacity: 0, x: 20 } :
              settings?.navigation?.animationType === 'fade' ? { opacity: 0 } :
              settings?.navigation?.animationType === 'none' ? { opacity: 1 } :
              { opacity: 0, scale: 0.99 }
            }
            transition={{ duration: settings?.navigation?.animationType === 'none' ? 0 : 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Container>

      {/* Modern Floating Bottom Nav (Mobile) */}
      <nav className="fixed bottom-6 inset-x-4 z-50 md:max-w-2xl md:mx-auto">
        <div className="glass-premium border border-white/10 rounded-[2rem] p-2 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path.includes('#') && location.pathname + location.hash === item.path);
            const Icon = item.icon;
            
            return (
              <li key={item.path} className="list-none flex-1">
                <Link 
                  to={item.path}
                  onClick={() => triggerHapticVibration(15)}
                  className="flex flex-col items-center gap-1 group py-2 relative transition-all duration-300"
                >
                  <motion.div 
                    whileTap={{ 
                      scale: 0.88, 
                      rotate: [0, -4, 4, -4, 4, 0],
                      x: [0, -1.5, 1.5, -1.5, 1.5, 0],
                      transition: { duration: 0.25 }
                    }}
                    className={`relative p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary text-black scale-110 shadow-lg shadow-primary/30' : 'text-gray-400 group-hover:text-gray-200'}`}
                  >
                    <Icon 
                      strokeWidth={isActive ? 2.5 : 1.75}
                      className="w-5 h-5" 
                    />
                  </motion.div>
                  <span className={`text-[10px] font-black tracking-tighter ${isActive ? 'text-primary' : 'text-gray-500'} md:block transition-colors`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </div>
      </nav>
      
      <SearchModal />
      {settings.liveScoreWidgetEnabled && <LiveScoreWidget />}
    </div>
  );
}
