import React, { useState } from 'react';
import { 
  Users, LogOut, Menu, X, Settings, Bell, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { OperationsCenter } from '../components/operations/OperationsCenter';

export default function AdminLayout({ children, title }: { children: React.ReactNode, title?: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#0B0B0C] text-gray-300 font-sans" dir="rtl">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#111112] border-b border-white/5 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center font-bold text-black text-xs">90</div>
          <span className="font-bold text-white tracking-tight">صافرة 90</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-white bg-white/5 rounded-lg border border-white/5">
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pt-16 lg:pt-0">
        {/* Top Header */}
        <header className="hidden lg:flex h-20 bg-[#111112]/50 backdrop-blur-md border-b border-white/5 items-center justify-between px-8 z-30">
          <div className="flex items-center gap-8">
            {/* Global Search Placeholder */}
            <div className="bg-white/5 rounded-2xl px-4 py-2 border border-white/5 w-64 text-sm text-gray-500">
               بحث في كافة الأنظمة...
            </div>
          </div>
          
          <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="text-[10px] bg-white/5 text-white px-5 py-2.5 rounded-xl border border-white/10 font-black hover:bg-white/10 transition-all uppercase tracking-tight">
                عرض الموقع
              </button>
              <div className="w-px h-8 bg-white/5" />
              <button onClick={() => navigate('/admin/settings')} className="p-2.5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/5"><Settings size={18} /></button>
              <button onClick={() => navigate('/admin/notifications')} className="p-2.5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/5 relative">
                  <Bell size={18} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#111112]" />
              </button>
          </div>
        </header>

        {/* Main View */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          {title && <h2 className="text-2xl font-black text-white mb-6 pr-2 border-r-4 border-amber-500">{title}</h2>}
          <OperationsCenter />
          {children}
        </main>
      </div>
    </div>
  );
}
