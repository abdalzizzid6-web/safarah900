import React from 'react';
import { Plus, Trash, Edit2 } from 'lucide-react';

interface Props {
  events: any[]; // Ideally typed
  onAddEvent: (event: any) => void;
}

export const LiveEventEditor = ({ events, onAddEvent }: Props) => {
  return (
    <div className="bg-[#18181C] p-4 rounded-xl border border-white/5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-white">محرر الأحداث</h3>
        <button className="text-primary text-xs font-bold flex items-center gap-1" onClick={() => onAddEvent({})}>
          <Plus size={14} /> حدث جديد
        </button>
      </div>
      <div className="space-y-2">
        {events.map((e, i) => (
          <div key={i} className="flex justify-between items-center bg-[#111112] p-2 rounded-lg border border-white/5">
            <span className="text-xs text-white">{e.type || 'هدف'} - {e.minute}'</span>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-white/10 rounded"><Edit2 size={12} /></button>
              <button className="p-1 hover:bg-red-500/20 rounded text-red-500"><Trash size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
