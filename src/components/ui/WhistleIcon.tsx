import React from 'react';

interface WhistleIconProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export default function WhistleIcon({ className = "", size = 24, glow = true }: WhistleIconProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {glow && (
        <span className="absolute inset-0 bg-primary/20 blur-md rounded-full pointer-events-none animate-pulse" />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary relative z-10 transition-transform duration-300 hover:scale-110"
      >
        {/* Whistle Main Body */}
        <path d="M9 5H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h5" />
        <path d="M9 15h3l6 4v-4h1a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3h-7L9 15z" />
        {/* Whistle Sound Hole / Vent */}
        <rect x="6" y="8" width="3" height="3" rx="0.5" fill="currentColor" className="text-secondary" />
        {/* Keyring Attachment */}
        <circle cx="21" cy="11" r="2" />
        {/* Whistle air pathway line */}
        <line x1="12" y1="9" x2="16" y2="9" />
      </svg>
    </div>
  );
}
