import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';

export default function PremiumBreadcrumb() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(p => p);

  if (paths.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-[11px] font-bold text-text-secondary mb-4 overflow-x-auto whitespace-nowrap custom-scrollbar pb-1">
      <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
        <Home size={12} />
        <span>الرئيسية</span>
      </Link>
      
      {paths.map((path, index) => {
        const routeTo = `/${paths.slice(0, index + 1).join('/')}`;
        const isLast = index === paths.length - 1;
        
        // Very basic mapping for paths
        const pathNameMap: Record<string, string> = {
          'schedule': 'المباريات',
          'leagues': 'البطولات',
          'teams': 'الفرق',
          'news': 'الأخبار',
          'admin': 'لوحة التحكم',
          'dashboard': 'الرئيسية',
          'profile': 'الملف الشخصي',
        };

        const label = pathNameMap[path] || decodeURIComponent(path);

        return (
          <React.Fragment key={path}>
            <ChevronLeft size={12} className="opacity-50" />
            {isLast ? (
              <span className="text-text">{label}</span>
            ) : (
              <Link to={routeTo} className="hover:text-primary transition-colors">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
