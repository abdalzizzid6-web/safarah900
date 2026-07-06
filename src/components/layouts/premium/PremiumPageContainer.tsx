import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import BackNavigation from '../../Navigation/BackNavigation';
import { useSettings } from '../../../context/SettingsContext';
import Container from '../../ui/Container';

interface PremiumPageContainerProps {
  children: React.ReactNode;
}

export default function PremiumPageContainer({ children }: PremiumPageContainerProps) {
  const location = useLocation();
  const { settings } = useSettings();

  return (
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
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </Container>
  );
}
