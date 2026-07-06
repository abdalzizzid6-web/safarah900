import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import PremiumHeader from './PremiumHeader';
import PremiumSidebar from './PremiumSidebar';
import PremiumBottomNavigation from './PremiumBottomNavigation';
import PremiumPageContainer from './PremiumPageContainer';
import SearchModal from '../../SearchModal';
import LiveScoreWidget from '../../LiveScoreWidget';
import { useSettings } from '../../../context/SettingsContext';

interface PremiumLayoutProps {
  children: React.ReactNode;
}

export default function PremiumLayout({ children }: PremiumLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings } = useSettings();

  return (
    <div className="flex flex-col min-h-screen bg-background text-text font-sans antialiased selection:bg-primary/30 selection:text-white" dir="rtl">
      <PremiumSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <PremiumHeader onOpenSidebar={() => setIsSidebarOpen(true)} />

      <PremiumPageContainer>
        {children}
      </PremiumPageContainer>

      <PremiumBottomNavigation />

      <SearchModal />
      {settings.liveScoreWidgetEnabled && <LiveScoreWidget />}
    </div>
  );
}
