import React, { useState } from 'react';
import { Trophy, Radio, LayoutGrid, AlertTriangle } from 'lucide-react';
import { useMatches } from '../hooks/useMatches';
import { useMatchActions } from '../hooks/useMatchActions';
import { useError } from '@/context/ErrorContext';
import { LiveMatchRoom } from './components/LiveMatchRoom';
import MatchStatistics from '../components/MatchStatistics';
import MatchesTable from '../components/MatchesTable';
import MatchFilters from '../components/MatchFilters';

export function MatchOperationsDashboard() {
  const { matches, isLoading: loading } = useMatches({ subscribe: true });
  const { showToast } = useError();
  const { actionLoading, toggleApproved, toggleFeatured } = useMatchActions(matches, showToast);
  const [activeView, setActiveView] = useState<'live' | 'all' | 'missing'>('live');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'FEATURED' | 'HIDDEN' | 'ARCHIVED'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'manual' | 'api-football' | 'world-cup'>('ALL');

  const statsSummary = React.useMemo(() => {
    const total = matches.length;
    const pending = matches.filter(m => !m.approved && !m.archived).length;
    const approved = matches.filter(m => m.approved && !m.archived).length;
    const featured = matches.filter(m => m.isFeatured === true).length;
    const live = matches.filter(m => m.isLive).length;
    const archived = matches.filter(m => m.archived === true).length;
    return { total, pending, approved, featured, live, archived };
  }, [matches]);

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      <div className="flex items-center gap-4 bg-black/40 p-4 rounded-3xl border border-white/5">
        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
          <Trophy className="text-amber-500" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">إدارة المباريات المتطورة</h1>
          <p className="text-xs text-gray-500 font-bold">مركز العمليات - Enterprise Edition</p>
        </div>
      </div>

      <MatchStatistics statsSummary={statsSummary} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveView('live')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeView === 'live' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
        >
          <Radio size={16} className="inline-block ml-2" />
          مباريات مباشرة
        </button>
        <button 
          onClick={() => setActiveView('all')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeView === 'all' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
        >
          <LayoutGrid size={16} className="inline-block ml-2" />
          جميع المباريات
        </button>
        <button 
          onClick={() => setActiveView('missing')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeView === 'missing' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <AlertTriangle size={16} className="inline-block ml-2" />
          بيانات مفقودة
        </button>
      </div>

      <div className="min-h-[500px]">
        {activeView === 'live' && <LiveMatchRoom />}
        {activeView === 'all' && (
          <div className="space-y-4">
            <MatchFilters 
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              selectedLeagueFilter={selectedLeagueFilter} setSelectedLeagueFilter={setSelectedLeagueFilter}
              selectedDateFilter={selectedDateFilter} setSelectedDateFilter={setSelectedDateFilter}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              sourceFilter={sourceFilter} setSourceFilter={setSourceFilter}
              leagues={[]}
            />
            {/* Table would go here */}
          </div>
        )}
        {activeView === 'missing' && <div className="text-gray-500">البيانات المفقودة (يتم فحص المباريات هنا)...</div>}
      </div>
    </div>
  );
}
