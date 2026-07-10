import React from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Share2, LayoutDashboard, Calendar, Library, Key, Settings, Activity, Send } from 'lucide-react';
import SocialDashboard from './pages/SocialDashboard';
import ConnectedAccounts from './pages/ConnectedAccounts';
import SocialScheduler from './pages/SocialScheduler';
import MediaLibrary from './pages/MediaLibrary';
import ApiKeyManager from './pages/ApiKeyManager';
import SocialSettings from './pages/SocialSettings';

const SocialMediaCenter: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: 'لوحة القيادة', path: '/admin/social/dashboard', icon: LayoutDashboard },
    { name: 'الحسابات المتصلة', path: '/admin/social/accounts', icon: Share2 },
    { name: 'الجدولة والنشر', path: '/admin/social/scheduler', icon: Calendar },
    { name: 'مكتبة الوسائط', path: '/admin/social/media', icon: Library },
    { name: 'إدارة مفاتيح الـ API', path: '/admin/social/apikeys', icon: Key },
    { name: 'الإعدادات العامة', path: '/admin/social/settings', icon: Settings },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Share2 className="w-8 h-8 text-primary" />
            مركز إدارة وسائل التواصل الاجتماعي
          </h1>
          <p className="text-gray-400 mt-1">
            إدارة متكاملة لجميع حساباتك، النشر التلقائي، والمجدول.
          </p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
             <Activity className="w-4 h-4" />
             نبض النظام
           </button>
           <button className="px-4 py-2 bg-primary text-black hover:bg-primary-hover rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
             <Send className="w-4 h-4" />
             نشر جديد
           </button>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary text-black font-semibold'
                  : 'bg-surface-elevated text-gray-400 hover:text-white hover:bg-surface-elevated/80'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          );
        })}
      </div>

      <div className="bg-surface-elevated rounded-xl border border-white/10 p-6 min-h-[500px]">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SocialDashboard />} />
          <Route path="accounts" element={<ConnectedAccounts />} />
          <Route path="scheduler" element={<SocialScheduler />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="apikeys" element={<ApiKeyManager />} />
          <Route path="settings" element={<SocialSettings />} />
        </Routes>
      </div>
    </div>
  );
};

export default SocialMediaCenter;
