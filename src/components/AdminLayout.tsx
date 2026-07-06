import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Newspaper, Trophy, Users as UsersIcon, Radio, 
  Megaphone, Settings, Database, Activity, Server, Tv, Bell, MessageSquare, 
  FileText, Globe, LogOut, Menu, X, PlusCircle, ShieldCheck, History, Share2, Sparkles
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const navGroups = [
  {
    title: 'الإحصائيات والتحليل',
    items: [
      { name: 'مركز التحليلات المتكامل', path: '/admin/analytics-center', icon: LayoutDashboard, requiredRole: UserRole.ADMIN },
      { name: 'لوحة القيادة السريعة', path: '/admin', icon: Activity, requiredRole: UserRole.EDITOR },
    ]
  },
  {
    title: 'المحتوى الأساسي',
    items: [
      { name: 'المباريات', path: '/admin/matches', icon: Database, requiredRole: UserRole.EDITOR },
      { name: 'البطولات', path: '/admin/leagues', icon: Trophy, requiredRole: UserRole.EDITOR },
      { name: 'الفرق', path: '/admin/teams', icon: UsersIcon, requiredRole: UserRole.EDITOR },
    ]
  },
  {
    title: 'البث والإعلانات',
    items: [
      { name: 'الإعلانات', path: '/admin/ads', icon: Megaphone, requiredRole: UserRole.ADMIN },
      { name: 'الإشعارات', path: '/admin/notifications', icon: Bell, requiredRole: UserRole.MODERATOR },
    ]
  },
  {
    title: 'الإدارة والنظام',
    items: [
      { name: 'المستخدمين والأدوار', path: '/admin/users', icon: Users, requiredRole: UserRole.SUPER_ADMIN },
      { name: 'حالة النظام (System Health)', path: '/admin/system-health', icon: Server, requiredRole: UserRole.SUPER_ADMIN },
      { name: 'لوحة الأمان والرقابة (Security)', path: '/admin/security-dashboard', icon: ShieldCheck, requiredRole: UserRole.SUPER_ADMIN },
      { name: 'مركز الأعطال (Error Center)', path: '/admin/error-center', icon: Activity, requiredRole: UserRole.SUPER_ADMIN },
      { name: 'تشخيصات الـ SEO', path: '/admin/seo-diagnostics', icon: Globe, requiredRole: UserRole.ADMIN },
      { name: 'الصفحات الثابتة', path: '/admin/pages', icon: FileText, requiredRole: UserRole.ADMIN },
      { name: 'إدارة الـ API', path: '/admin/api-management-v2', icon: Database, requiredRole: UserRole.ADMIN },
      { name: 'الإعدادات', path: '/admin/settings', icon: Settings, requiredRole: UserRole.SUPER_ADMIN },
    ]
  }
];

export default function AdminLayout({ children, title }: { children: React.ReactNode, title?: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { profile, hasPermission, logout } = useAuth();

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
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-white">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-40 w-72 bg-[#111112] border-l border-white/5 transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:relative lg:translate-x-0 flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between mt-14 lg:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-black text-lg">90</div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">صافرة 90</h1>
              <p className="text-[10px] text-gray-500 tracking-wider uppercase">لوحة التحكم</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-24 lg:pb-4">
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
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2.5 rounded-lg gap-3 text-sm transition-all ${
                        isActive ? 'bg-white/5 text-white font-medium border border-white/10' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
                        <span>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 bg-[#111112] z-10 w-full relative">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all text-sm font-bold"
          >
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pt-16 lg:pt-0">
        {/* Top Header Placeholder (Desktop Only) */}
        <header className="hidden lg:flex h-16 bg-[#111112]/50 backdrop-blur-md border-b border-white/5 items-center justify-between px-8 z-30">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 text-sm">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center overflow-hidden">
                {profile?.photoURL ? <img src={profile.photoURL} alt="" /> : <Users size={12} className="text-blue-400" />}
              </div>
              <span className="text-gray-400">أهلاً بك، <span className="text-white font-bold">{profile?.displayName || 'مدير النظام'}</span></span>
            </div>
            <button onClick={() => navigate('/')} className="text-xs bg-green-600/20 text-green-400 px-4 py-1.5 rounded-full border border-green-500/20 font-bold hover:bg-green-600/30 transition-all">
              عرض الموقع
            </button>
          </div>
          
          <div className="flex items-center gap-4 text-gray-400">
             <button onClick={() => navigate('/admin/settings')} className="p-2 hover:bg-white/5 rounded-lg transition-all"><Settings size={18} /></button>
             <button onClick={() => navigate('/admin/notifications')} className="p-2 hover:bg-white/5 rounded-lg transition-all"><Bell size={18} /></button>
          </div>
        </header>

        {/* Main View */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          {title && <h2 className="text-2xl font-black text-white mb-6 pr-2 border-r-4 border-amber-500">{title}</h2>}
          {children}
        </main>
      </div>
    </div>
  );
}
