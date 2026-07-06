import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface PremiumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const PremiumDialog: React.FC<PremiumDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full ${maxWidth} bg-[#0c1322] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl`}
          >
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                {title && <h3 className="text-2xl font-black text-white">{title}</h3>}
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-2xl transition-colors text-gray-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="text-gray-300">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
