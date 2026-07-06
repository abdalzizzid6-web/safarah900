import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MiniStickyHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#070c16]/80 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center justify-between">
      <Link to="/">
         <img src="/logo-master.png" alt="صافرة 90" className="h-8" />
      </Link>
      <div className="flex items-center gap-4">
        <Search className="text-gray-400" size={20} />
        <Bell className="text-gray-400" size={20} />
        <Menu className="text-gray-400" size={20} />
      </div>
    </header>
  );
}
