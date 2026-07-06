import React from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizes = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[96rem]',
  full: 'max-w-full',
};

export default function Container({ 
  children, 
  size = 'lg', 
  className = '', 
  ...props 
}: ContainerProps) {
  return (
    <div 
      className={`w-full mx-auto px-4 md:px-6 lg:px-8 ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}
