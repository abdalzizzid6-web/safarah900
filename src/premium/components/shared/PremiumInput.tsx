import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  icon: Icon,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1.5 flex flex-col w-full">
      {label && <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">{label}</label>}
      <div className="relative group">
        {Icon && (
          <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
        )}
        <input
          className={`
            w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 px-4 text-sm text-white 
            placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] 
            transition-all ${Icon ? 'pr-11' : ''} ${error ? 'border-red-500/50' : ''} ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-[10px] font-bold text-red-500 px-1">{error}</p>}
    </div>
  );
};
