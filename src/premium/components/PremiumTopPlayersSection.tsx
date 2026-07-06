import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Award, ShieldAlert, Star } from 'lucide-react';

const PLAYERS = [
  { 
    id: '1', 
    name: 'إيرلينج هالاند', 
    team: 'مانشستر سيتي', 
    goals: 18, 
    assists: 4,
    rating: '8.4',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', // Beautiful stylized portrait
    teamLogo: 'https://media.api-sports.io/football/teams/50.png',
    bgGradient: 'from-sky-500/10 to-transparent'
  },
  { 
    id: '2', 
    name: 'كيليان مبابي', 
    team: 'ريال مدريد', 
    goals: 15, 
    assists: 6,
    rating: '8.1',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    teamLogo: 'https://media.api-sports.io/football/teams/541.png',
    bgGradient: 'from-amber-500/10 to-transparent'
  },
  { 
    id: '3', 
    name: 'هاري كين', 
    team: 'بايرن ميونخ', 
    goals: 12, 
    assists: 3,
    rating: '7.9',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    teamLogo: 'https://media.api-sports.io/football/teams/157.png',
    bgGradient: 'from-red-500/10 to-transparent'
  }
];

interface Props {
  title?: string;
}

export default function PremiumTopPlayersSection({ title = "اللاعبون الأكثر تميزاً" }: Props) {
  return (
    <section className="space-y-4" id="premium-top-players-section">
      {title && title.trim() !== "" && (
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
            <Award size={18} className="text-yellow-500" />
            <span>{title}</span>
          </h2>
          <Link to="/stats/players" className="text-xs text-amber-500 font-bold hover:text-amber-400 transition-colors">
            عرض الإحصائيات الكاملة
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAYERS.map((player, index) => {
          let rankColor = "text-yellow-400";
          let rankBadge = "🥇";
          if (index === 1) { rankColor = "text-slate-300"; rankBadge = "🥈"; }
          if (index === 2) { rankColor = "text-amber-700"; rankBadge = "🥉"; }

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`relative overflow-hidden p-4 rounded-2xl bg-[#0a0f18] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-xl flex flex-col justify-between group`}
            >
              {/* Top ambient glow background */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${player.bgGradient} blur-2xl pointer-events-none z-0`} />

              <div className="flex items-center justify-between relative z-10 mb-4">
                <span className="text-sm font-black flex items-center gap-1">
                  <span>{rankBadge}</span>
                  <span className={`${rankColor}`}>المركز {index + 1}</span>
                </span>
                
                {/* Team Logo Badge */}
                <div className="w-8 h-8 rounded-full bg-white/5 p-1 flex items-center justify-center border border-white/10 shadow-md">
                  <img 
                    src={player.teamLogo} 
                    alt={player.team} 
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Player Profile block */}
              <div className="flex items-center gap-3.5 relative z-10 mb-4">
                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-white/10 to-white/30 group-hover:from-amber-500 group-hover:to-yellow-400 transition-all duration-300 shadow-lg">
                  <img 
                    src={player.avatar} 
                    alt={player.name} 
                    className="w-full h-full object-cover rounded-full border border-black bg-zinc-800"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-sm text-white group-hover:text-amber-400 transition-colors duration-300">
                    {player.name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {player.team}
                  </span>
                </div>
              </div>

              {/* Statistics Row */}
              <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 relative z-10 text-center">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white">{player.goals}</span>
                  <span className="text-[9px] text-gray-500 font-bold">الأهداف</span>
                </div>
                <div className="flex flex-col border-x border-white/5">
                  <span className="text-xs font-black text-white">{player.assists}</span>
                  <span className="text-[9px] text-gray-500 font-bold">صناعة</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-amber-500 flex items-center justify-center gap-0.5">
                    <Star size={10} className="fill-amber-500 text-amber-500" />
                    {player.rating}
                  </span>
                  <span className="text-[9px] text-gray-500 font-bold">التقييم</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
