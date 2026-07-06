import React from 'react';

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function H1({ className = "", children, ...props }: TextProps) {
  return <h1 className={`font-sans text-4xl font-bold tracking-tighter text-white ${className}`} {...props}>{children}</h1>;
}

export function H2({ className = "", children, ...props }: TextProps) {
  return <h2 className={`font-sans text-2xl font-semibold tracking-tight text-white/90 ${className}`} {...props}>{children}</h2>;
}

export function H3({ className = "", children, ...props }: TextProps) {
  return <h3 className={`font-sans text-xl font-medium tracking-tight text-white/80 ${className}`} {...props}>{children}</h3>;
}

export function Body({ className = "", children, ...props }: TextProps) {
  return <p className={`font-sans text-base leading-relaxed text-white/60 ${className}`} {...props}>{children}</p>;
}

export function Label({ className = "", children, ...props }: TextProps) {
  return <span className={`font-sans text-xs font-medium uppercase tracking-wider text-white/40 ${className}`} {...props}>{children}</span>;
}
