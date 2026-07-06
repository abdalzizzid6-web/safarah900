import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, PlusCircle, Radio, Megaphone, Users, FileImage, Star, Rss, BookOpen } from 'lucide-react';

function QuickAction({ icon, label, path, onClick, color }: any) {
  const navigate = useNavigate();
  return (
    <button 
      onClick={onClick || (() => navigate(path))}
      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl transition-all duration-300 hover:scale-105 border ${color}`}
    >
      {icon}
      <span className="text-[10px] font-black">{label}</span>
    </button>
  );
}

export default function QuickActions({ setShowApiSettings, showApiSettings }: any) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <QuickAction 
          icon={<Settings size={22} />} 
          label="إدارة إعدادات الـ API" 
          onClick={() => setShowApiSettings(!showApiSettings)}
          color="bg-sky-600/10 text-sky-400 border-sky-500/10 hover:border-sky-500/30 font-bold" 
        />
        <QuickAction icon={<PlusCircle size={22} />} label="إضافة وإعداد مباراة" path="/admin/matches" color="bg-green-600/10 text-green-400 border-green-500/10 hover:border-green-500/30 font-bold" />
        <QuickAction icon={<Radio size={22} />} label="بث مباشر وقنوات" path="/admin/channels" color="bg-rose-600/10 text-rose-400 border-rose-500/10 hover:border-rose-500/30 font-bold" />
        <QuickAction icon={<Megaphone size={22} />} label="إدارة إعلانات المنصة" path="/admin/ads" color="bg-purple-600/10 text-purple-400 border-purple-500/10 hover:border-purple-500/30 font-bold" />
        <QuickAction icon={<Users size={22} />} label="الأدوار والصلاحيات" path="/admin/users" color="bg-amber-600/10 text-amber-400 border-amber-500/10 hover:border-amber-500/30 font-bold" />
        <QuickAction icon={<FileImage size={22} />} label="مخزن الوسائط (DAM)" path="/admin/media" color="bg-blue-600/10 text-blue-400 border-blue-500/10 hover:border-blue-500/30 font-bold" />
        <QuickAction icon={<Star size={22} />} label="كأس العالم 2026" path="/admin/world-cup" color="bg-amber-500/10 text-amber-500 border-amber-500/10 hover:border-amber-500/30 font-bold" />
        <QuickAction icon={<Rss size={22} />} label="إدارة خلاصات RSS" path="/admin/rss" color="bg-orange-600/10 text-orange-400 border-orange-500/10 hover:border-orange-500/30 font-bold" />
        <QuickAction icon={<BookOpen size={22} />} label="قاعدة المعرفة" path="/admin/knowledge-base" color="bg-indigo-600/10 text-indigo-400 border-indigo-500/10 hover:border-indigo-500/30 font-bold" />
    </div>
  );
}
