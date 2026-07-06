import React from 'react';

interface PremiumBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
  dot = false
}) => {
  const variants = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-white/5 text-gray-400 border-white/10',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[8px]',
    sm: 'px-3 py-1 text-[10px]',
    md: 'px-4 py-1.5 text-xs'
  };

  return (
    <span className={`
      inline-flex items-center font-black uppercase tracking-widest rounded-full border 
      ${variants[variant]} ${sizes[size]} ${className}
    `}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      )}
      {children}
    </span>
  );
};
