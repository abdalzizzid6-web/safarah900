import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Menu, Search } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import PremiumNotificationCenter from './PremiumNotificationCenter';
import PremiumUserMenu from './PremiumUserMenu';
import PremiumSearch from './PremiumSearch';

interface PremiumHeaderProps {
  onOpenSidebar: () => void;
}

export default function PremiumHeader({ onOpenSidebar }: PremiumHeaderProps) {
  const { settings } = useSettings();

  return (
    <div className="max-w-7xl mx-auto w-full px-4 pt-4 sm:pt-6 sticky top-0 z-40">
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full glass-premium border border-border rounded-2xl md:rounded-[2rem] shadow-dropdown overflow-hidden backdrop-blur-xl"
      >
        <div className="px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
          
          {/* Left: Menu & Branding */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenSidebar}
              className="p-2.5 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text transition-all active:scale-95"
            >
              <Menu size={24} />
            </button>

            <Link to="/" className="flex items-center gap-3 group relative">
              <div className="relative">
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {settings.logoUrl ? (
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl overflow-hidden border border-border bg-black/40 p-1 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                    <img 
                      src={settings.logoUrl || undefined} 
                      alt={settings.appName || 'logo'} 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-secondary to-primary rounded-2xl flex items-center justify-center shadow-glow transform group-hover:rotate-6 transition-all duration-500 relative overflow-hidden">
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
                  <h1 className="font-black text-xl md:text-3xl tracking-tighter text-text group-hover:text-primary transition-colors duration-500 flex items-center gap-2">
                    <span className="italic">صافرة</span>
                    <span className="text-primary">90</span>
                  </h1>
                </div>
              </div>
            </Link>
          </div>

          {/* Middle: Professional Search Bar (Desktop only) */}
          <PremiumSearch />

          {/* Right: Functional Controls */}
          <div className="flex items-center gap-1.5 md:gap-3">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-search-modal'))}
              className="lg:hidden p-2.5 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text transition-all active:scale-90"
            >
              <Search size={20} />
            </button>

            <PremiumNotificationCenter />

            <div className="hidden md:flex h-8 w-px bg-border mx-1" />

            <PremiumUserMenu />
          </div>
        </div>

        {/* Subtle underline gradient */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-50" />
      </motion.header>
    </div>
  );
}
