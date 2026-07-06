import React from 'react';
import { motion } from 'motion/react';
import { Search, Trophy, Calendar, Filter, Layers } from 'lucide-react';

export default function MatchFilters({
  searchQuery, setSearchQuery,
  selectedLeagueFilter, setSelectedLeagueFilter,
  selectedDateFilter, setSelectedDateFilter,
  statusFilter, setStatusFilter,
  sourceFilter, setSourceFilter,
  leagues
}: any) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 mt-2 bg-white/[0.02] border border-white/5 rounded-2xl">
        <div>
          <label className="block text-[10px] font-black text-gray-400 mb-1.5 mr-1">ابحث</label>
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs">
            <Search className="text-gray-500 select-none mr-1" size={14} />
            <input type="text" placeholder="بحث..." className="bg-transparent text-white w-full outline-0 placeholder-gray-500 font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 mb-1.5 mr-1">الدوري</label>
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs">
            <Trophy className="text-gray-500 select-none mr-1" size={14} />
            <select className="bg-transparent text-white w-full outline-0 font-bold" value={selectedLeagueFilter} onChange={e => setSelectedLeagueFilter(e.target.value)}>
              <option value="ALL" className="bg-slate-950">الكل</option>
              {leagues.map((l: any) => <option key={l.id} value={l.id} className="bg-slate-950">{l.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 mb-1.5 mr-1">تاريخ مقيّد</label>
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs">
            <Calendar className="text-gray-500 select-none mr-2" size={14} />
            <input type="date" className="bg-transparent text-white w-full outline-0 font-bold text-xs cursor-pointer scheme-dark" value={selectedDateFilter} onChange={e => setSelectedDateFilter(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 mb-1.5 mr-1">الفرز الصارم</label>
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs">
            <Filter className="text-gray-500 select-none mr-1" size={14} />
            <select className="bg-transparent text-white w-full outline-0 font-bold" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
              <option value="ALL" className="bg-slate-950">الكل</option>
              <option value="PENDING" className="bg-slate-950 text-yellow-500">قيد الانتظار ⏳</option>
              <option value="APPROVED" className="bg-slate-950 text-emerald-400">معتمدة ✅</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 mb-1.5 mr-1">المصدر (Source)</label>
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-xs">
            <Layers className="text-gray-500 select-none mr-1" size={14} />
            <select className="bg-transparent text-white w-full outline-0 font-bold" value={sourceFilter} onChange={e => setSourceFilter(e.target.value as any)}>
              <option value="ALL" className="bg-slate-950">كل المصادر</option>
              <option value="manual" className="bg-slate-950">يدوي (Manual)</option>
              <option value="api-football" className="bg-slate-950">API-Football</option>
              <option value="world-cup" className="bg-slate-950">World Cup API</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
