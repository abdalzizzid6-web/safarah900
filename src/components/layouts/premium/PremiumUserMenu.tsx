import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';

export default function PremiumUserMenu() {
  const [user] = useAuthState(auth);

  return (
    <Link 
      to="/profile"
      className="flex items-center gap-2.5 p-1 md:p-1.5 pr-1 md:pr-3.5 bg-surface border border-border rounded-xl hover:bg-surface-hover hover:border-white/20 transition-all group"
    >
      <span className="text-[11px] font-black hidden md:block group-hover:text-primary transition-colors text-text">
        {user ? (user.displayName || 'حسابي') : 'دخول'}
      </span>
      <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-background flex items-center justify-center overflow-hidden border border-border group-hover:border-primary/50 transition-all shadow-lg">
        {user?.photoURL ? (
          <img src={user.photoURL || undefined} alt="profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <User size={18} className="text-primary" />
        )}
      </div>
    </Link>
  );
}
