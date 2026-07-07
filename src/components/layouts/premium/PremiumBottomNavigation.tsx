import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Trophy, Menu } from 'lucide-react';
import { motion } from 'motion/react';
import { triggerHapticVibration } from '../../../utils/haptics';

export default function PremiumBottomNavigation() {
  const location = useLocation();

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'المباريات', path: '/schedule', icon: Calendar },
    { name: 'البطولات', path: '/leagues', icon: Trophy },
    { name: 'المزيد', path: '/profile', icon: Menu },
  ];

  return (
    <nav className="fixed bottom-6 inset-x-4 z-50 md:max-w-2xl md:mx-auto">
      <div className="glass-premium border border-border rounded-[2rem] p-2 flex items-center justify-around shadow-dropdown backdrop-blur-2xl bg-surface/80">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path.includes('#') && location.pathname + location.hash === item.path);
          const Icon = item.icon;
          
          return (
            <li key={item.path} className="list-none flex-1 relative">
              <Link 
                to={item.path}
                onClick={() => triggerHapticVibration(15)}
                className="flex flex-col items-center gap-1 group py-2 relative transition-all duration-300"
              >
                <motion.div 
                  whileTap={{ 
                    scale: 0.88, 
                    rotate: [0, -4, 4, -4, 4, 0],
                    x: [0, -1.5, 1.5, -1.5, 1.5, 0],
                    transition: { duration: 0.25 }
                  }}
                  className="relative z-10 p-2 rounded-xl transition-all duration-300"
                >
                  <Icon 
                    strokeWidth={isActive ? 2.5 : 1.75}
                    className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-black' : 'text-text-secondary group-hover:text-text'}`} 
                  />
                </motion.div>
                {isActive && (
                  <motion.div 
                    layoutId="active-bottom-nav" 
                    className="absolute top-2 w-10 h-10 bg-primary rounded-xl -z-0 shadow-glow"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <span className={`text-[10px] font-bold tracking-tighter ${isActive ? 'text-primary' : 'text-text-secondary'} md:block transition-colors`}>
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </div>
    </nav>
  );
}

