import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface FollowMatchButtonProps {
  matchId: string;
  variant?: 'icon' | 'button';
  className?: string;
}

export default function FollowMatchButton({ matchId, variant = 'icon', className = '' }: FollowMatchButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      checkFollowStatus();
    } else {
      setLoading(false);
    }
  }, [user, matchId]);

  const checkFollowStatus = async () => {
    if (!user) return;
    const status = await notificationService.isFollowingMatch(user.uid, matchId);
    setIsFollowing(status);
    setLoading(false);
  };

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('يرجى تسجيل الدخول لتفعيل تنبيهات الأهداف');
      return;
    }

    setActionLoading(true);
    try {
      if (isFollowing) {
        const success = await notificationService.unsubscribeFromMatchGoals(user.uid, matchId);
        if (success) setIsFollowing(false);
      } else {
        const success = await notificationService.subscribeToMatchGoals(user.uid, matchId);
        if (success) setIsFollowing(true);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className={`w-8 h-8 flex items-center justify-center ${className}`}><Loader2 className="w-4 h-4 animate-spin text-gray-500" /></div>;
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleToggleFollow}
        disabled={actionLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
          isFollowing 
            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
            : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
        } ${className}`}
      >
        {actionLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <BellOff className="w-4 h-4" />
        ) : (
          <Bell className="w-4 h-4" />
        )}
        {isFollowing ? 'إيقاف التنبيهات' : 'تفعيل تنبيهات الأهداف'}
      </button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleToggleFollow}
      disabled={actionLoading}
      className={`p-2 rounded-xl transition-all ${
        isFollowing 
          ? 'bg-emerald-500/20 text-emerald-500' 
          : 'bg-white/5 text-gray-500 hover:text-white'
      } ${className}`}
      title={isFollowing ? 'إيقاف تنبيهات الأهداف' : 'تفعيل تنبيهات الأهداف'}
    >
      <AnimatePresence mode="wait">
        {actionLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="w-4 h-4 animate-spin" />
          </motion.div>
        ) : (
          <motion.div
            key={isFollowing ? 'on' : 'off'}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            {isFollowing ? <BellOff size={18} /> : <Bell size={18} />}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
