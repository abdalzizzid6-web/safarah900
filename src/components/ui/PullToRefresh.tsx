import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshState, setRefreshState] = useState<'idle' | 'pulling' | 'ready' | 'refreshing' | 'completed'>('idle');
  
  const startYRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);
  const pullThreshold = 75; // px distance needed to trigger refresh
  const maxPullDistance = 130; // maximum visual drag limit
  const resistance = 0.45; // drag resistance factor

  const mainControls = useAnimation();

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Direct initiation only if at the top of the viewport
      if (window.scrollY === 0) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
        if (refreshState === 'idle' || refreshState === 'completed') {
          setRefreshState('pulling');
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;

      // Handle downward pull
      if (deltaY > 0 && window.scrollY === 0) {
        // Prevent default native scroll bouncy behavior
        if (e.cancelable) {
          e.preventDefault();
        }

        const calculatedPull = Math.min(maxPullDistance, deltaY * resistance);
        setPullDistance(calculatedPull);

        if (calculatedPull >= pullThreshold) {
          setRefreshState('ready');
        } else {
          setRefreshState('pulling');
        }
      } else if (deltaY < 0) {
        // Stop tracking if pulling upward
        isPullingRef.current = false;
        setPullDistance(0);
        setRefreshState('idle');
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      if (pullDistance >= pullThreshold && refreshState !== 'refreshing') {
        // Smoothly animate the container to pause at the pullThreshold/refreshing position
        setRefreshState('refreshing');
        setPullDistance(pullThreshold);

        try {
          // Perform refreshing function (queries etc.)
          await onRefresh();
          setRefreshState('completed');
          setPullDistance(0);
          
          // Fast feedback transition
          setTimeout(() => {
            setRefreshState('idle');
          }, 1500);
        } catch (error) {
          console.error("Failed to execute pull-to-refresh logic", error);
          setRefreshState('idle');
          setPullDistance(0);
        }
      } else {
        // Drag not deep enough, spring back to top
        setPullDistance(0);
        setRefreshState('idle');
      }
    };

    // Add event listeners with non-passive option to allow preventDefault()
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, refreshState, onRefresh]);

  // Compute rotation angle based on pull progress
  const rotation = Math.min(360, (pullDistance / pullThreshold) * 360);
  const opacity = Math.min(1, pullDistance / 40);

  return (
    <div className="relative w-full overflow-visible">
      {/* Absolute Loading HUD Header */}
      <div 
        style={{ height: `${maxPullDistance}px` }}
        className="absolute top-0 inset-x-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden z-40 transition-all duration-150"
      >
        <motion.div
          animate={{ 
            y: refreshState === 'refreshing' ? 25 : Math.max(-40, pullDistance - 45), 
            scale: opacity 
          }}
          transition={{ type: 'spring', damping: 18, stiffness: 180 }}
          style={{ opacity }}
          className="flex flex-col items-center justify-center"
        >
          {/* Circular badge design */}
          <div className="w-11 h-11 bg-neutral-900/95 backdrop-blur-xl border border-[#d4af37]/30 rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(212,175,55,0.15)] relative">
            
            {refreshState === 'pulling' && (
              <motion.div style={{ rotate: rotation }}>
                <ArrowDown size={18} className="text-[#d4af37]" />
              </motion.div>
            )}

            {refreshState === 'ready' && (
              <motion.div 
                animate={{ rotate: 180, scale: [1, 1.2, 1] }} 
                transition={{ duration: 0.3 }}
              >
                <ArrowDown size={18} className="text-emerald-400 rotate-180" />
              </motion.div>
            )}

            {refreshState === 'refreshing' && (
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              >
                <RefreshCw size={18} className="text-[#d4af37]" />
              </motion.div>
            )}

            {refreshState === 'completed' && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-full h-full bg-emerald-500 rounded-full flex items-center justify-center"
              >
                <Check size={18} className="text-black font-black" />
              </motion.div>
            )}
          </div>

          {/* Detailed text helper */}
          <span className="text-[11px] font-black mt-2.5 bg-neutral-950/80 px-3 py-1 rounded-full text-white tracking-wide border border-white/5 drop-shadow-md">
            {refreshState === 'pulling' && 'اسحب لتحديث النتائج ⚽'}
            {refreshState === 'ready' && 'أفلت للتحديث المباشر 💫'}
            {refreshState === 'refreshing' && 'جاري جلب آخر المباريات والنتائج... 🔄'}
            {refreshState === 'completed' && 'تم تحديث كافة النتائج بنجاح! ✨'}
          </span>
        </motion.div>
      </div>

      {/* Main App content shifted down during pulling */}
      <motion.div
        animate={{ y: refreshState === 'refreshing' ? pullThreshold : pullDistance }}
        transition={{ type: 'spring', damping: 20, stiffness: 180 }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
