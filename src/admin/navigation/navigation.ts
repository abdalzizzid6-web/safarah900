import { 
  LayoutDashboard, Users, Trophy, Users as UsersIcon, Radio, 
  Megaphone, Settings, Database, Activity, Server, Tv, Bell, MessageSquare, 
  FileText, Globe, LogOut, Menu, X, PlusCircle, ShieldCheck, History, Share2, Sparkles,
  FileImage, BookOpen, Rss, Star, Languages
} from 'lucide-react';
import { UserRole } from '../../types';

export const navGroups = [
  {
    title: 'الإحصائيات والتحليل',
    items: [
      { name: 'مركز التحليلات المتكامل', path: '/admin/analytics-center', icon: LayoutDashboard, requiredRole: UserRole.ADMIN },
      { name: 'لوحة القيادة السريعة', path: '/admin/dashboard', icon: Activity, requiredRole: UserRole.EDITOR },
    ]
  },
  {
    title: 'المحتوى الأساسي',
    items: [
      { name: 'المباريات', path: '/admin/matches', icon: Database, requiredRole: UserRole.EDITOR },
      { name: 'البطولات', path: '/admin/leagues', icon: Trophy, requiredRole: UserRole.EDITOR },
      { name: 'الفرق', path: '/admin/teams', icon: UsersIcon, requiredRole: UserRole.EDITOR },
      { name: 'إدارة الوسائط (DAM)', path: '/admin/media', icon: FileImage, requiredRole: UserRole.EDITOR },
      { name: 'قاعدة المعرفة', path: '/admin/knowledge-base', icon: BookOpen, requiredRole: UserRole.ADMIN },
      { name: 'منشئ الصفحة الرئيسية', path: '/admin/homepage', icon: LayoutDashboard, requiredRole: UserRole.ADMIN },
      { name: 'تغذية RSS', path: '/admin/rss', icon: Rss, requiredRole: UserRole.ADMIN },
      { name: 'كأس العالم 2026', path: '/admin/world-cup', icon: Star, requiredRole: UserRole.ADMIN },
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
      { name: 'الترجمة والذكاء الاصطناعي', path: '/admin/translations', icon: Languages, requiredRole: UserRole.ADMIN },
      { name: 'مركز إدارة الـ API', path: '/admin/api-management-center', icon: Database, requiredRole: UserRole.ADMIN },
      { name: 'الإعدادات', path: '/admin/settings', icon: Settings, requiredRole: UserRole.SUPER_ADMIN },
    ]
  }
];
