import React, { ReactNode } from 'react';
import { motion } from 'motion/react';

interface SecurityMetricProps {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  colorClass: 'rose' | 'amber' | 'purple' | 'orange';
}

export default function SecurityMetric({ title, value, description, icon, colorClass }: SecurityMetricProps) {
  const colorMap = {
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/15',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/15',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/15',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/15',
  };

  const textMap = {
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
  };

  const glowMap = {
    rose: 'bg-rose-500/5',
    amber: 'bg-amber-500/5',
    purple: 'bg-purple-500/5',
    orange: 'bg-orange-500/5',
  };

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className={`bg-[#0F0F11] border ${colorMap[colorClass].split(' ')[2]} p-5 rounded-2xl relative overflow-hidden`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 ${glowMap[colorClass]} rounded-full blur-2xl`} />
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-xs font-bold">{title}</span>
        <div className={`${colorMap[colorClass].split(' ')[1]} ${textMap[colorClass]} p-2 rounded-xl`}>
          {icon}
        </div>
      </div>
      <h3 className={`text-3xl font-black ${colorMap[colorClass].split(' ')[0]}`}>{value}</h3>
      <p className="text-gray-500 text-[11px] mt-2 font-semibold">{description}</p>
    </motion.div>
  );
}
