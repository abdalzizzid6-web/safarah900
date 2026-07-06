import React from 'react';
import { NavLink } from 'react-router-dom';
import { navGroups } from '../../navigation/navigation';
import { useAuth } from '../../../context/AuthContext';
import { ChevronRight } from 'lucide-react';

export function AdminSidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { hasPermission } = useAuth();

  return (
    <aside className={`fixed inset-y-0 right-0 z-40 w-72 bg-[#111112] border-l border-white/5 transition-transform duration-300 ease-out transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
      {/* Sidebar Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-black text-lg">90</div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">صافرة 90</h1>
            <p className="text-[10px] text-gray-500 tracking-wider uppercase">الإدارة المركزية</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {navGroups.map((group, idx) => {
          const visibleItems = group.items.filter(item => hasPermission(item.requiredRole));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <p className="px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">{group.title}</p>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2.5 rounded-lg gap-3 text-sm transition-all ${
                      isActive ? 'bg-white/5 text-white font-medium border border-white/10' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
                      <span className="flex-1">{item.name}</span>
                      {isActive && <ChevronRight size={14} className="text-white" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
