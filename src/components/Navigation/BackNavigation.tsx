import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Home } from 'lucide-react';

export default function BackNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isHome = location.pathname === '/';
  
  const handleBack = () => {
    // Check if we are further than 1 step deep from Home
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(p => p);
    
    // Map paths to readable names
    const pathNames: Record<string, string> = {
      'news': 'الأخبار',
      'schedule': 'المباريات',
      'leagues': 'البطولات',
      'standings': 'الترتيب',
      'match': 'تفاصيل المباراة',
      'league': 'البطولات',
      'team': 'الفريق',
      'player': 'اللاعب',
      'store': 'المتجر',
      'stadiums': 'حجز الملاعب',
      'events': 'الفعاليات',
      'esports': 'الرياضات الإلكترونية',
      'radio': 'الراديو',
      'premium-services': 'الخدمات المتميزة',
      'vip': 'VIP',
      'dashboard': 'لوحة التحكم',
      'admin': 'الإدارة',
      'settings': 'الإعدادات',
      'profile': 'حسابي',
      'competitions': 'المسابقات'
    };

    return [
      { name: 'الرئيسية', path: '/', isLast: paths.length === 0 },
      ...paths.map((path, index) => ({
        name: pathNames[path] || path,
        path: '/' + paths.slice(0, index + 1).join('/'),
        isLast: index === paths.length - 1
      }))
    ];
  };

  if (isHome) return null;

  const breadcrumbs = getBreadcrumbs();

  return (
    <AnimatePresence>
      <motion.nav 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className="w-full flex items-center gap-3 py-4 sticky top-16 z-30 bg-background/80 backdrop-blur-md"
        dir="rtl"
      >
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all active:scale-95 text-gray-300 hover:text-primary"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-1.5 overflow-hidden text-sm font-bold text-gray-500 whitespace-nowrap">
          {breadcrumbs.slice(0, 3).map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              <Link 
                to={crumb.path}
                className={`transition-colors hover:text-primary ${crumb.isLast ? 'text-white' : ''} truncate`}
              >
                {crumb.name}
              </Link>
              {!crumb.isLast && <span className="text-gray-700">/</span>}
            </React.Fragment>
          ))}
        </div>
      </motion.nav>
    </AnimatePresence>
  );
}
