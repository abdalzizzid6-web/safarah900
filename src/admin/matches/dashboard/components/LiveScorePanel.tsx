import React from 'react';
import { Save, RefreshCw } from 'lucide-react';

interface Props {
  match: any; // Ideally typed
  onUpdate: (data: any) => Promise<void>;
}

export const LiveScorePanel = ({ match, onUpdate }: Props) => {
  return (
    <div className="bg-[#18181C] p-4 rounded-xl border border-white/5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-white">لوحة النتيجة</h3>
        <button className="text-primary text-xs font-bold flex items-center gap-1">
          <Save size={14} /> حفظ
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input type="number" defaultValue={match?.scoreHome} className="bg-[#111112] border border-white/5 p-2 rounded-lg text-center text-white" placeholder="Home" />
        <input type="number" defaultValue={match?.scoreAway} className="bg-[#111112] border border-white/5 p-2 rounded-lg text-center text-white" placeholder="Away" />
      </div>
    </div>
  );
};
