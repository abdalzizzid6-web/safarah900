import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Network, Trophy, MapPin, Calendar, GitCommit, Eye } from 'lucide-react';
import { worldCupService, WCMatch } from '../../services/worldCupService';

interface WcBracketProps {
  matches: WCMatch[];
  onOpenMatch: (id: string | number) => void;
}

interface BracketMatch {
  id: string;
  label: string;
  homeTeam: { name: string; crest: string; score?: number | null };
  awayTeam: { name: string; crest: string; score?: number | null };
  status: string;
  time?: string;
  venue?: string;
  nextMatchId?: string;
  realMatchId?: string;
}

export default function WcBracket({ matches, onOpenMatch }: WcBracketProps) {
  const [activeStageFilter, setActiveStageFilter] = useState<'all' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'>('all');
  const safeMatches = Array.isArray(matches) ? matches : [];

  // Build the bracket from real matches prop
  const bracketData = useMemo(() => {
    const r32Matches: BracketMatch[] = [];
    const r16Matches: BracketMatch[] = [];
    const qfMatches: BracketMatch[] = [];
    const sfMatches: BracketMatch[] = [];
    const finalMatches: BracketMatch[] = [];

    safeMatches.forEach(m => {
        const bm: BracketMatch = {
            id: String(m.id),
            label: `${worldCupService.translateStage(m.stage)} - ${worldCupService.translateTeam(m.homeTeam.name)} vs ${worldCupService.translateTeam(m.awayTeam.name)}`,
            homeTeam: { name: worldCupService.translateTeam(m.homeTeam.name), crest: m.homeTeam.crest, score: m.score.fullTime.home },
            awayTeam: { name: worldCupService.translateTeam(m.awayTeam.name), crest: m.awayTeam.crest, score: m.score.fullTime.away },
            status: m.status,
            venue: m.venue,
            realMatchId: String(m.id)
        };
        
        switch(m.stage) {
            case 'r32': r32Matches.push(bm); break;
            case 'r16': r16Matches.push(bm); break;
            case 'qf': qfMatches.push(bm); break;
            case 'sf': sfMatches.push(bm); break;
            case 'final': finalMatches.push(bm); break;
        }
    });

    return { r32Matches, r16Matches, qfMatches, sfMatches, finalMatches };
  }, [matches]);

  const renderMatchCard = (m: BracketMatch) => (
    <div
      key={m.id}
      className="bg-[#0b0b0c] hover:bg-[#121213] border border-[#d4af37]/20 hover:border-[#d4af37]/50 rounded-2xl p-4 space-y-3 transition-all transform hover:-translate-y-1 shadow-lg relative min-w-[240px] select-none"
    >
      <div className="flex items-center justify-between text-[9px] text-[#d4af37]/80 font-black">
        <span>{m.label}</span>
        {m.realMatchId ? (
          <button
            onClick={() => onOpenMatch(m.realMatchId!)}
            className="flex items-center gap-1 bg-[#d4af37]/10 hover:bg-[#d4af37]/25 px-1.5 py-0.5 rounded border border-[#d4af37]/30 text-[#f3c623]"
          >
            <Eye size={8} />
            <span>تفاصيل</span>
          </button>
        ) : (
          <span className="text-gray-500">سيناريو متوقع</span>
        )}
      </div>

      <div className="space-y-2 text-xs border-y border-white/5 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={m.homeTeam.crest} className="w-5 h-5 object-contain" alt="" referrerPolicy="no-referrer" />
            <span className="font-extrabold text-white">{m.homeTeam.name}</span>
          </div>
          <span className="font-mono font-black text-[#f3c623] text-sm">
            {m.homeTeam.score !== null && m.homeTeam.score !== undefined ? m.homeTeam.score : '--'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={m.awayTeam.crest} className="w-5 h-5 object-contain" alt="" referrerPolicy="no-referrer" />
            <span className="font-extrabold text-white">{m.awayTeam.name}</span>
          </div>
          <span className="font-mono font-black text-[#f3c623] text-sm">
            {m.awayTeam.score !== null && m.awayTeam.score !== undefined ? m.awayTeam.score : '--'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold">
        <MapPin size={10} className="text-[#d4af37]" />
        <span className="truncate max-w-[180px]">{m.venue || ''}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      {/* Title block */}
      <div className="flex items-center gap-3 border-b border-[#d4af37]/15 pb-4">
        <div className="p-2 bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 rounded-xl">
          <Network className="w-5 h-5 text-[#f3c623]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">مخطط وأدوار البطولة الإقصائية (Bracket)</h2>
          <p className="text-xs text-gray-400">تتبع مسار المنتخبات المتصارعة للوصول إلى المباراة النهائية ورفع الكأس الغالية</p>
        </div>
      </div>

      {/* Stage Selector Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'الشجرة كاملة' },
          { id: 'r32', label: 'دور الـ 32' },
          { id: 'r16', label: 'دور الـ 16' },
          { id: 'qf', label: 'ربع النهائي' },
          { id: 'sf', label: 'نصف النهائي' },
          { id: 'final', label: 'المباراة النهائية 🏆' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveStageFilter(filter.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeStageFilter === filter.id 
                ? 'bg-[#d4af37] text-black border border-amber-300'
                : 'bg-[#0d0d0d] text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Dynamic bracket rendering */}
      <div className="overflow-x-auto pb-6 pt-2">
        <div className="flex gap-8 items-start min-w-[1200px] justify-between p-2">
          {/* Column 1: Round of 32 */}
          {(activeStageFilter === 'all' || activeStageFilter === 'r32') && (
            <div className="space-y-6 flex-1">
              <div className="text-xs font-black text-center text-gray-400 bg-black/60 py-2 border border-white/10 rounded-xl mb-4">دور الـ 32</div>
              <div className="grid grid-cols-1 gap-6">
                {bracketData.r32Matches.map(renderMatchCard)}
              </div>
            </div>
          )}

          {/* Column 2: Round of 16 */}
          {(activeStageFilter === 'all' || activeStageFilter === 'r16') && (
            <div className="space-y-6 flex-1 mt-12">
              <div className="text-xs font-black text-center text-gray-400 bg-black/60 py-2 border border-white/10 rounded-xl mb-4">دور الـ 16</div>
              <div className="grid grid-cols-1 gap-14 justify-around h-full">
                {bracketData.r16Matches.map(renderMatchCard)}
              </div>
            </div>
          )}

          {/* Column 3: Quarter-Finals */}
          {(activeStageFilter === 'all' || activeStageFilter === 'qf') && (
            <div className="space-y-6 flex-1 mt-24">
              <div className="text-xs font-black text-center text-gray-400 bg-black/60 py-2 border border-white/10 rounded-xl mb-4">ربع النهائي</div>
              <div className="grid grid-cols-1 gap-28 h-full justify-around">
                {bracketData.qfMatches.map(renderMatchCard)}
              </div>
            </div>
          )}

          {/* Column 4: Semi-Finals */}
          {(activeStageFilter === 'all' || activeStageFilter === 'sf') && (
            <div className="space-y-6 flex-1 mt-36">
              <div className="text-xs font-black text-center text-gray-400 bg-black/60 py-2 border border-white/10 rounded-xl mb-4">نصف النهائي</div>
              <div className="grid grid-cols-1 gap-48 h-full justify-around">
                {bracketData.sfMatches.map(renderMatchCard)}
              </div>
            </div>
          )}

          {/* Column 5: Final */}
          {(activeStageFilter === 'all' || activeStageFilter === 'final') && (
            <div className="space-y-6 flex-1 mt-48">
              <div className="text-xs font-black text-center text-[#f3c623] bg-[#d4af37]/10 py-2 border border-[#d4af37]/30 rounded-xl mb-4">النهائي الكبير</div>
              <div className="grid grid-cols-1 h-full">
                {bracketData.finalMatches.map(renderMatchCard)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
