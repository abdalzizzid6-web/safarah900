import { 
  LayoutDashboard, Users, Trophy, Users as UsersIcon, Radio, 
  Megaphone, Settings, Database, Activity, Server, Tv, Bell, MessageSquare, 
  FileText, Globe, LogOut, Menu, X, PlusCircle, ShieldCheck, History, Share2, Sparkles,
  FileImage, BookOpen, Rss, Star, Languages, HardDrive, Newspaper
} from 'lucide-react';
import { UserRole } from '../../types';

export const navGroups = [
  {
    title: 'الإحصائيات والتحليل',
    items: [
      { name: 'لوحة القيادة الشاملة', path: '/admin/dashboard', icon: Activity, requiredRole: UserRole.EDITOR },
      { name: 'مركز التحليلات المتكامل', path: '/admin/analytics-center', icon: LayoutDashboard, requiredRole: UserRole.ADMIN },
    ]
  },
  {
    title: 'إدارة المحتوى الرياضي',
    items: [
      { name: 'إدارة الأخبار والمقالات', path: '/admin/news', icon: Newspaper, requiredRole: UserRole.EDITOR },
      { name: 'إدارة المباريات', path: '/admin/matches', icon: Database, requiredRole: UserRole.EDITOR },
      { name: 'البطولات والدوريات', path: '/admin/leagues', icon: Trophy, requiredRole: UserRole.EDITOR },
      { name: 'الفرق والأندية', path: '/admin/teams', icon: UsersIcon, requiredRole: UserRole.EDITOR },
      { name: 'قنوات البث المباشر', path: '/admin/channels', icon: Tv, requiredRole: UserRole.EDITOR },
      { name: 'إدارة الوسائط (DAM)', path: '/admin/media', icon: FileImage, requiredRole: UserRole.EDITOR },
      { name: 'قاعدة المعرفة', path: '/admin/knowledge-base', icon: BookOpen, requiredRole: UserRole.ADMIN },
      { name: 'منشئ الصفحة الرئيسية', path: '/admin/homepage', icon: LayoutDashboard, requiredRole: UserRole.ADMIN },
      { name: 'تغذية الأخبار RSS', path: '/admin/rss', icon: Rss, requiredRole: UserRole.ADMIN },
      { name: 'مركز كأس العالم 2026', path: '/admin/world-cup', icon: Star, requiredRole: UserRole.ADMIN },
    ]
  },
  {
    title: 'التسويق والتواصل',
    items: [
      { name: 'إدارة الإعلانات', path: '/admin/ads', icon: Megaphone, requiredRole: UserRole.ADMIN },
      { name: 'الإشعارات الفورية', path: '/admin/notifications', icon: Bell, requiredRole: UserRole.MODERATOR },
      { name: 'مركز منصات التواصل', path: '/admin/social', icon: Share2, requiredRole: UserRole.ADMIN },
    ]
  },
  {
    title: 'الإدارة والنظام والأمان',
    items: [
      { name: 'المستخدمين والصلاحيات (RBAC)', path: '/admin/users', icon: Users, requiredRole: UserRole.SUPER_ADMIN },
      { name: 'سجلات المراقبة والأمان', path: '/admin/security-dashboard', icon: ShieldCheck, requiredRole: UserRole.SUPER_ADMIN },
      { name: 'مركز إدارة الـ API والمزودين', path: '/admin/api-management-center', icon: Database, requiredRole: UserRole.ADMIN },
      { name: 'إدارة النسخ الاحتياطي', path: '/admin/backups', icon: HardDrive, requiredRole: UserRole.SUPER_ADMIN },
      { name: 'حالة وصحة النظام', path: '/admin/system-health', icon: Server, requiredRole: UserRole.SUPER_ADMIN },
      { name: 'مركز الأعطال والصيانة', path: '/admin/error-center', icon: Activity, requiredRole: UserRole.SUPER_ADMIN },
      { name: 'تشخيصات الـ SEO', path: '/admin/seo-diagnostics', icon: Globe, requiredRole: UserRole.ADMIN },
      { name: 'الصفحات الثابتة', path: '/admin/pages', icon: FileText, requiredRole: UserRole.ADMIN },
      { name: 'الترجمة والذكاء الاصطناعي', path: '/admin/translations', icon: Languages, requiredRole: UserRole.ADMIN },
      { name: 'إعدادات النظام', path: '/admin/settings', icon: Settings, requiredRole: UserRole.SUPER_ADMIN },
    ]
  }
];

