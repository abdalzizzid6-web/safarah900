import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Trophy, Shield, Stars, ArrowLeft } from 'lucide-react';

const COMPETITIONS = [
  { 
    id: 'world-cup', 
    name: 'كأس العالم 2026', 
    subtitle: 'الدولية • 32 منتخب', 
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80', 
    path: '/world-cup-2026',
    emoji: '🏆',
    borderColor: 'border-yellow-500/30 hover:border-yellow-400/60',
    tag: 'الأكبر عالمياً'
  },
  { 
    id: 'ucl', 
    name: 'دوري أبطال أوروبا', 
    subtitle: 'أوروبا • 32 نادٍ', 
    image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=400&q=80', 
    path: '/league/2',
    emoji: '⭐',
    borderColor: 'border-blue-500/30 hover:border-blue-400/60',
    tag: 'أقوى الأندية'
  },
  { 
    id: 'pl', 
    name: 'الدوري الإنجليزي', 
    subtitle: 'إنجلترا • 20 نادٍ', 
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80', 
    path: '/league/39',
    emoji: '🦁',
    borderColor: 'border-purple-500/30 hover:border-purple-400/60',
    tag: 'الأكثر إثارة'
  },
  { 
    id: 'laliga', 
    name: 'الدوري الإسباني', 
    subtitle: 'إسبانيا • 20 نادٍ', 
    image: 'https://images.unsplash.com/photo-1504016798967-59a258e9386d?auto=format&fit=crop&w=400&q=80', 
    path: '/league/140',
    emoji: '🇪🇸',
    borderColor: 'border-red-500/30 hover:border-red-400/60',
    tag: 'دوري العمالقة'
  },
];

interface Props {
  title?: string;
}

export default function PremiumCompetitionsSection({ title = "البطولات المفضلة" }: Props) {
  return (
    <section className="space-y-4" id="premium-competitions-section">
      {title && title.trim() !== "" && (
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            <span>{title}</span>
          </h2>
          <Link to="/leagues" className="text-xs text-amber-500 font-bold hover:text-amber-400 transition-colors flex items-center gap-1">
            <span>تصفح الكل</span>
            <ArrowLeft size={12} />
          </Link>
        </div>
      )}

      <div className="flex overflow-x-auto scrollbar-none gap-4 pb-2" dir="rtl">
        {COMPETITIONS.map((comp, index) => (
          <motion.div
            key={comp.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="flex-shrink-0 w-[140px]"
          >
            <Link 
              to={comp.path}
              className="flex flex-col gap-2.5 group cursor-pointer"
            >
              {/* Premium Card Frame */}
              <div className={`w-[140px] h-48 rounded-[1.5rem] overflow-hidden relative shadow-lg border bg-[#0a0f18] transition-all duration-300 ${comp.borderColor}`}>
                {/* Background image with glassmorphism blending */}
                <img 
                  src={comp.image} 
                  alt={comp.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 mix-blend-overlay" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                
                {/* Accent Tag */}
                <span className="absolute top-2.5 right-2.5 bg-white/10 backdrop-blur-md text-[8px] font-black text-white px-2 py-0.5 rounded-full border border-white/5">
                  {comp.tag}
                </span>

                {/* Animated Emblem Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300 shadow-xl shadow-black/50">
                    <span className="text-3xl select-none">{comp.emoji}</span>
                  </div>
                </div>
              </div>
              
              {/* Labels */}
              <div className="flex flex-col text-center px-1">
                <span className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {comp.name}
                </span>
                <span className="text-[10px] text-gray-500 font-bold mt-0.5">
                  {comp.subtitle}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
