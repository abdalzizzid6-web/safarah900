import React, { useState } from 'react';
import { RelatedContent } from '../types';
import { Link, Check, Plus, X } from 'lucide-react';

interface Props {
  value: RelatedContent;
  onChange: (value: RelatedContent) => void;
}

export function RelatedSelectors({ value, onChange }: Props) {
  const [matchInput, setMatchInput] = useState('');
  const [teamInput, setTeamInput] = useState('');
  const [playerInput, setPlayerInput] = useState('');

  const addEntity = (type: 'matches' | 'teams' | 'players', name: string) => {
    if (!name.trim()) return;
    const current = value[type] || [];
    if (current.includes(name.trim())) return;

    onChange({
      ...value,
      [type]: [...current, name.trim()]
    });
  };

  const removeEntity = (type: 'matches' | 'teams' | 'players', name: string) => {
    onChange({
      ...value,
      [type]: (value[type] || []).filter((item) => item !== name)
    });
  };

  return (
    <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 space-y-6 text-right">
      <div className="flex items-center gap-2 flex-row-reverse border-b border-white/[0.05] pb-3">
        <Link className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-white text-base">ربط المحتوى بالكيانات والمباريات الرياضية</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Matches Link */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400">ربط بمباراة (رقم معرف المباراة أو الفريقين)</label>
          <div className="flex gap-2">
            <button
              onClick={() => { addEntity('matches', matchInput); setMatchInput(''); }}
              className="px-3 bg-[#18181C] hover:bg-white/10 border border-white/[0.05] text-white rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={matchInput}
              onChange={(e) => setMatchInput(e.target.value)}
              className="flex-1 bg-[#18181C] border border-white/[0.05] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              placeholder="مثال: الهلال ضد النصر"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2 justify-start">
            {value.matches?.map((m) => (
              <span key={m} className="bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                {m}
                <X className="w-2.5 h-2.5 cursor-pointer text-gray-500 hover:text-white" onClick={() => removeEntity('matches', m)} />
              </span>
            ))}
          </div>
        </div>

        {/* Teams Link */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400">ربط بأندية ومنتخبات</label>
          <div className="flex gap-2">
            <button
              onClick={() => { addEntity('teams', teamInput); setTeamInput(''); }}
              className="px-3 bg-[#18181C] hover:bg-white/10 border border-white/[0.05] text-white rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={teamInput}
              onChange={(e) => setTeamInput(e.target.value)}
              className="flex-1 bg-[#18181C] border border-white/[0.05] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              placeholder="مثال: ريال مدريد، الأهلي"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2 justify-start">
            {value.teams?.map((t) => (
              <span key={t} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                {t}
                <X className="w-2.5 h-2.5 cursor-pointer text-gray-500 hover:text-white" onClick={() => removeEntity('teams', t)} />
              </span>
            ))}
          </div>
        </div>

        {/* Players Link */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400">ربط بلاعبين</label>
          <div className="flex gap-2">
            <button
              onClick={() => { addEntity('players', playerInput); setPlayerInput(''); }}
              className="px-3 bg-[#18181C] hover:bg-white/10 border border-white/[0.05] text-white rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              className="flex-1 bg-[#18181C] border border-white/[0.05] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              placeholder="مثال: ميسي، كريستيانو"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2 justify-start">
            {value.players?.map((p) => (
              <span key={p} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                {p}
                <X className="w-2.5 h-2.5 cursor-pointer text-gray-500 hover:text-white" onClick={() => removeEntity('players', p)} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
