import React from 'react';
import { Search } from 'lucide-react';

export default function PremiumSearch() {
  const handleSearchClick = () => {
    window.dispatchEvent(new CustomEvent('open-search-modal'));
  };

  return (
    <div className="hidden lg:flex flex-1 max-w-md mx-8">
      <button 
        onClick={handleSearchClick}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-surface border border-border rounded-xl text-text-secondary hover:bg-surface-hover hover:border-white/20 transition-all group shadow-sm"
      >
        <Search size={16} className="group-hover:text-primary transition-colors" />
        <span className="text-xs font-bold">ابحث عن مباراة، فريق، أو دوري...</span>
        <div className="mr-auto text-[10px] font-black border border-border px-1.5 py-0.5 rounded bg-background text-text-secondary">K / CTRL</div>
      </button>
    </div>
  );
}
