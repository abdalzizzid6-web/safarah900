import React from 'react';
import { motion } from 'motion/react';

interface PremiumCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: string;
  footer?: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  title,
  subtitle,
  footer,
  className = '',
  glow = false,
  onClick
}) => {
  return (
    <motion.div
      whileHover={onClick ? { y: -4 } : {}}
      onClick={onClick}
      className={`
        relative bg-white/[0.03] border border-white/5 rounded-[2.5rem] overflow-hidden 
        ${onClick ? 'cursor-pointer hover:border-white/10' : ''}
        ${glow ? 'shadow-[0_0_50px_-12px_rgba(var(--primary-rgb),0.15)]' : ''}
        ${className}
      `}
    >
      {/* Decorative corner glow */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      {(title || subtitle) && (
        <div className="p-6 md:p-8 border-b border-white/5">
          {title && <div className="text-xl font-black text-white">{title}</div>}
          {subtitle && <p className="text-xs text-gray-500 mt-1 font-medium">{subtitle}</p>}
        </div>
      )}
      
      <div className="p-6 md:p-8">
        {children}
      </div>
      
      {footer && (
        <div className="p-6 bg-white/[0.02] border-t border-white/5">
          {footer}
        </div>
      )}
    </motion.div>
  );
};
