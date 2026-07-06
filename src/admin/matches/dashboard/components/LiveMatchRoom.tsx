import React from 'react';
import { Clock, Radio } from 'lucide-react';
import { LiveScorePanel } from './LiveScorePanel';
import { LiveEventEditor } from './LiveEventEditor';
import { MissingDataInspector } from './MissingDataInspector';

export const LiveMatchRoom = () => {
  const mockMatch = { scoreHome: 2, scoreAway: 1, stadium: '', events: [{ type: 'هدف', minute: 20 }] };
  
  return (
    <div className="bg-[#111112] border border-white/5 rounded-2xl p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Radio className="text-emerald-500" size={20} />
          غرفة التحكم المباشر
        </h2>
        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
          <Clock className="text-amber-500" size={16} />
          <span className="text-white font-mono font-bold">45:00 + 3'</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LiveScorePanel match={mockMatch} onUpdate={async () => {}} />
        <MissingDataInspector match={mockMatch} />
      </div>

      <LiveEventEditor events={mockMatch.events} onAddEvent={() => {}} />
    </div>
  );
};
