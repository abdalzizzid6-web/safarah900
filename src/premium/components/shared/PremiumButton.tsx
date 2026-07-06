import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumButtonProps extends Omit<HTMLMotionProps<"button">, "onDrag" | "onDragStart" | "onDragEnd" | "children"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  isLoading?: boolean;
  fullWidth?: boolean;
  to?: string;
  children?: React.ReactNode;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  isLoading,
  fullWidth,
  className = '',
  disabled,
  to,
  onClick,
  ...props
}) => {
  const navigate = useNavigate();
  const baseStyles = 'inline-flex items-center justify-center font-black transition-all rounded-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border';
  
  const variants = {
    primary: 'bg-primary border-primary text-black shadow-lg shadow-primary/20 hover:bg-amber-500 hover:border-amber-500',
    secondary: 'bg-white/10 border-white/10 text-white hover:bg-white/20',
    outline: 'bg-transparent border-white/20 text-white hover:border-primary hover:text-primary',
    ghost: 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5',
    danger: 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-sm',
    xl: 'px-10 py-5 text-base'
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (to) {
      navigate(to);
    }
    if (onClick) {
      onClick(e as any);
    }
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : Icon && (
        <Icon className={`w-4 h-4 ${children ? 'ml-2' : ''}`} />
      )}
      {children}
    </motion.button>
  );
};
