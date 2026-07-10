import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, ChevronDown, LayoutGrid, List, RefreshCcw, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';

import { useError } from '@/context/ErrorContext';
import { cn } from '@/lib/utils';
import { Match } from '@/types';

import { useMatches } from '../hooks/useMatches';
import { useMatchActions } from '../hooks/useMatchActions';
import { useMatchForm } from '../hooks/useMatchForm';
import { useMatchLock } from '../hooks/useMatchLock';
import { matchEnterpriseService, MatchStatus, MatchVersion, MatchAuditLog } from '../services/matchEnterpriseService';
import { Download, Upload, Trash, History as HistoryIcon, X } from 'lucide-react';

import { leagueService } from '@/services/leagueService';
import { matchService } from '@/services/matchService';
import { cmsService, LeagueSettings } from '@/services/cmsService';

import MatchStatistics from '../components/MatchStatistics';
import MatchApprovalPanel from '../components/MatchApprovalPanel';
import MatchFilters from '../components/MatchFilters';
import MatchesTable from '../components/MatchesTable';
import { MatchModal as MatchEditor } from '../components/MatchEditor';
import { MatchBulkActions as BulkActionsToolbar } from '../components/BulkActionsToolbar';
import MatchDiagnosticTool from '../components/MatchDiagnosticTool';
import MatchesAnalyticsDashboard from '@/admin/shared/MatchesAnalyticsDashboard';

export default function MatchesDashboard() {
  const { showToast } = useError();
  const { matches, isLoading: loading } = useMatches({ subscribe: true });
  
  const [leagues, setLeagues] = useState<any[]>([]);
  const [leagueSettings, setLeagueSettings] = useState<Record<string, LeagueSettings>>({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Custom Hooks
  const { 
    actionLoading, 
    toggleApproved, 
    toggleFeatured, 
    toggleHidden, 
    toggleArchived, 
    deleteMatch, 
    restoreMatch,
    duplicateMatch,
    quickSave,
    bulkAction, 
    saveMatch, 
    rebuildCache 
  } = useMatchActions(matches, showToast);
  const { showMatchModal, setShowMatchModal, modalType, modalMatchId, formData, setFormData, handleStartAddMatch, handleStartEditMatch } = useMatchForm(leagues);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyMatchId, setHistoryMatchId] = useState<string | null>(null);
  const [matchVersions, setMatchVersions] = useState<MatchVersion[]>([]);
  const [matchAuditLogs, setMatchAuditLogs] = useState<MatchAuditLog[]>([]);
  const [historyTab, setHistoryTab] = useState<'versions' | 'timeline'>('versions');
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [viewDeleted, setViewDeleted] = useState(false);

  const [tabFilter, setTabFilter] = useState<'ALL' | 'LIVE' | 'TODAY' | 'TOMORROW' | 'UPCOMING' | 'FINISHED' | 'POSTPONED' | 'CANCELLED' | 'MISSING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'FEATURED' | 'HIDDEN' | 'ARCHIVED'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'manual' | 'api-football' | 'world-cup'>('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const handleSaveMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.homeTeamName || !formData.awayTeamName || !formData.leagueName) {
      showToast('الرجاء تعبئة اسم الفريقين والبطولة على الأقل', 'error');
      return;
    }
    
    const defaultUrl = formData.streamUrl || '';
    const streamingLinks = defaultUrl ? [{
      label: formData.streamLabel || 'سيرفر المشاهدة 1',
      name: formData.streamLabel || 'سيرفر المشاهدة 1',
      url: defaultUrl,
      quality: 'Auto',
      enabled: true,
      priority: 1,
      type: defaultUrl.includes('iframe') ? 'iframe' : 'custom'
    }] : [];

    const parsedStartTime = formData.startTime ? new Date(formData.startTime).toISOString() : new Date().toISOString();
    const parsedStartDate = formData.featuredStartDate ? new Date(formData.featuredStartDate).toISOString() : '';
    const parsedEndDate = formData.featuredEndDate ? new Date(formData.featuredEndDate).toISOString() : '';

    const matchPayload: any = {
      isFeatured: formData.isFeatured,
      featuredPriority: Number(formData.featuredPriority) || 0,
      featuredPinned: formData.featuredPinned,
      featuredStartDate: parsedStartDate,
      featuredEndDate: parsedEndDate,
      featuredEnabled: formData.featuredEnabled,
      homeTeam: { name: formData.homeTeamName, logo: formData.homeTeamLogo || '' },
      awayTeam: { name: formData.awayTeamName, logo: formData.awayTeamLogo || '' },
      homeLogo: formData.homeTeamLogo || '',
      awayLogo: formData.awayTeamLogo || '',
      league: formData.leagueName,
      leagueLogo: formData.leagueLogo || '',
      leagueDetails: { id: 'manual', name: formData.leagueName, country: '', logo: formData.leagueLogo || '' },
      startTime: parsedStartTime,
      utcDate: parsedStartTime,
      commentator: formData.commentator || '',
      channel: formData.channel || 'بث مباشر',
      status: formData.status,
      isLive: formData.status === 'LIVE',
      score: { home: Number(formData.homeScore) || 0, away: Number(formData.awayScore) || 0 },
      homeScore: Number(formData.homeScore) || 0,
      awayScore: Number(formData.awayScore) || 0,
      youtubeLink: formData.youtubeLink || '',
      isManual: true,
      approved: true,
      streamingLinks: streamingLinks,
      seo: {
        title: formData.seoTitle || `${formData.homeTeamName} ضد ${formData.awayTeamName}`,
        description: formData.seoDescription || `شاهد مباراة ${formData.homeTeamName} ضد ${formData.awayTeamName} بث مباشر في بطولة ${formData.leagueName}`,
        keywords: formData.seoKeywords || `${formData.homeTeamName}, ${formData.awayTeamName}, بث مباشر`
      }
    };
    
    await saveMatch(modalType, modalMatchId, matchPayload);
    setShowMatchModal(false);
  };

  useEffect(() => {
    const loadLeagues = async () => {
      try {
        let allLeagues = await leagueService.getRawLeaguesFromApi();
        if (!allLeagues || allLeagues.length === 0) {
          allLeagues = [
            { id: '39', name: "الدوري الإنجليزي الممتاز", logo: "https://media.api-sports.io/football/leagues/39.png", country: "England" },
            { id: '140', name: "لاليغا الإسبانية", logo: "https://media.api-sports.io/football/leagues/140.png", country: "Spain" },
            { id: '307', name: "دوري روشن السعودي", logo: "https://media.api-sports.io/football/leagues/307.png", country: "Saudi Arabia" }
          ];
        }
        setLeagues(allLeagues);
        const cmsLeaguesList = await cmsService.getLeagueSettingsList();
        const leaguesMap: Record<string, LeagueSettings> = {};
        cmsLeaguesList.forEach(l => { leaguesMap[String(l.id)] = l; });
        setLeagueSettings(leaguesMap);
      } catch (err) {
        console.error("Error loading CMS data:", err);
      }
    };
    loadLeagues();
  }, []);

  const loadData = async () => {
    matchService.clearManualCache();
    await rebuildCache();
    showToast("جاري تحديث البيانات بالكامل من السحابة...", "info");
  };

  const statsSummary = useMemo(() => {
    const total = matches.length;
    const pending = matches.filter(m => !m.approved && !m.archived).length;
    const approved = matches.filter(m => m.approved && !m.archived).length;
    const featured = matches.filter(m => m.isFeatured === true).length;
    const live = matches.filter(m => m.isLive).length;
    const archived = matches.filter(m => m.archived === true).length;
    return { total, pending, approved, featured, live, archived };
  }, [matches]);

  const filteredMatches = useMemo(() => {
    let result = matches;
    if (searchQuery.trim()) {
      const qs = searchQuery.toLowerCase();
      result = result.filter(m => {
        const homeTag = typeof m.homeTeam === 'object' ? m.homeTeam?.name : m.homeTeam;
        const awayTag = typeof m.awayTeam === 'object' ? m.awayTeam?.name : m.awayTeam;
        const leagueTag = typeof m.league === 'object' ? m.league?.name : m.league;
        return homeTag?.toLowerCase().includes(qs) || awayTag?.toLowerCase().includes(qs) || leagueTag?.toLowerCase().includes(qs);
      });
    }
    if (selectedLeagueFilter !== 'ALL') {
      result = result.filter(m => {
        const lId = String(m.leagueDetails?.id || (m as any).leagueId || (typeof m.league === 'object' ? (m.league as any).id : ''));
        return lId === selectedLeagueFilter;
      });
    }
    if (selectedDateFilter) {
      result = result.filter(m => {
        const mDate = new Date(m.startTime || m.utcDate || Date.now());
        const mDateLocal = new Date(mDate.getTime() - (mDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        return mDateLocal === selectedDateFilter;
      });
    }
    if (tabFilter !== 'ALL') {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      switch (tabFilter) {
        case 'LIVE':
          result = result.filter(m => ['Live', 'Half Time', 'Second Half', 'Extra Time', 'Penalties'].includes(m.status));
          break;
        case 'TODAY':
          result = result.filter(m => (m.startTime || m.utcDate || '').toString().startsWith(todayStr));
          break;
        case 'TOMORROW':
          result = result.filter(m => (m.startTime || m.utcDate || '').toString().startsWith(tomorrowStr));
          break;
        case 'UPCOMING':
          result = result.filter(m => (m.startTime || m.utcDate || '').toString() > todayStr && !['Finished', 'Postponed', 'Cancelled', 'Abandoned'].includes(m.status));
          break;
        case 'FINISHED':
          result = result.filter(m => m.status === 'Finished');
          break;
        case 'POSTPONED':
          result = result.filter(m => m.status === 'Postponed');
          break;
        case 'CANCELLED':
          result = result.filter(m => m.status === 'Cancelled');
          break;
        case 'MISSING':
          result = result.filter(m => !m.league || !m.homeTeam || !m.awayTeam || !m.utcDate || !m.stadium);
          break;
      }
    }
    
    if (statusFilter !== 'ALL') {
      switch (statusFilter) {
        case 'PENDING': result = result.filter(m => !m.approved && !m.archived && !m.isDeleted); break;
        case 'APPROVED': result = result.filter(m => m.approved && !m.archived && !m.isDeleted); break;
        case 'FEATURED': result = result.filter(m => m.isFeatured && !m.isDeleted); break;
        case 'HIDDEN': result = result.filter(m => m.isHidden && !m.isDeleted); break;
        case 'ARCHIVED': result = result.filter(m => m.archived && !m.isDeleted); break;
      }
    }

    if (viewDeleted) {
      result = result.filter(m => m.isDeleted);
    } else {
      result = result.filter(m => !m.isDeleted);
    }

    if (sourceFilter !== 'ALL') {
      result = result.filter(m => m.source === sourceFilter);
    }
    return result.sort((a, b) => new Date(b.startTime || b.utcDate || 0).getTime() - new Date(a.startTime || a.utcDate || 0).getTime());
  }, [matches, searchQuery, selectedLeagueFilter, selectedDateFilter, statusFilter, sourceFilter, tabFilter, viewDeleted]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [tabFilter, searchQuery, selectedLeagueFilter, selectedDateFilter, statusFilter, sourceFilter, viewDeleted]);

  const paginatedMatches = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMatches.slice(startIndex, startIndex + pageSize);
  }, [filteredMatches, currentPage]);

  const totalPages = Math.ceil(filteredMatches.length / pageSize) || 1;

  const handleToggleSelectMatch = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllVisible = (currentList: Match[]) => {
    const allIds = currentList.map(m => m.id);
    if (allIds.every(id => selectedIds.includes(id))) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const formatDateString = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'تاريخ غير صالح';
    }
  };

  const handleBulkApprove = () => bulkAction(selectedIds, 'approve').then(() => setSelectedIds([]));
  const handleBulkFeature = () => bulkAction(selectedIds, 'approve').then(() => setSelectedIds([]));
  const handleBulkHide = () => bulkAction(selectedIds, 'hide').then(() => setSelectedIds([]));
  const handleBulkArchive = () => bulkAction(selectedIds, 'archive').then(() => setSelectedIds([]));
  const handleBulkDelete = () => bulkAction(selectedIds, 'delete').then(() => setSelectedIds([]));
  
  const handleShowHistory = async (id: string) => {
    setHistoryMatchId(id);
    setShowHistoryModal(true);
    setLoadingVersions(true);
    setHistoryTab('versions');
    try {
      const [versions, logs] = await Promise.all([
        matchEnterpriseService.getVersions(id),
        matchEnterpriseService.getAuditLogs(id)
      ]);
      setMatchVersions(versions);
      setMatchAuditLogs(logs);
    } catch (err) {
      showToast('خطأ في تحميل سجل التعديلات', 'error');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    const data = matchEnterpriseService.exportMatches(filteredMatches, format);
    const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matches_export_${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    showToast('تم تصدير البيانات بنجاح', 'success');
  };

  const handleToggleViewDeleted = () => {
    setViewDeleted(!viewDeleted);
    setSelectedIds([]);
  };

  const handleBulkRestore = () => bulkAction(selectedIds, 'restore').then(() => setSelectedIds([]));
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans" style={{ direction: 'rtl' }}>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-black/40 p-4 rounded-3xl border border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
            <Trophy className="text-amber-500" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">إدارة المباريات المتطورة</h1>
            <p className="text-xs text-gray-500 font-bold">نظام التحكم والتحرير للمباريات - Enterprise Edition</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-gray-300 transition-all border border-white/5"
          >
            <Download size={14} />
            تصدير CSV
          </button>
          <button
            onClick={handleToggleViewDeleted}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all border",
              viewDeleted ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-white/5 border-white/10 text-gray-300 hover:text-white"
            )}
          >
            <Trash size={14} />
            {viewDeleted ? 'العودة للمباريات' : 'سلة المهملات'}
          </button>
        </div>
      </div>

      <MatchStatistics 
        statsSummary={statsSummary} 
        statusFilter={statusFilter} 
        setStatusFilter={setStatusFilter} 
      />

      <div className="flex flex-wrap gap-2 mb-4 bg-black/40 p-2 rounded-2xl border border-white/5">
        {['ALL', 'LIVE', 'TODAY', 'TOMORROW', 'UPCOMING', 'FINISHED', 'POSTPONED', 'CANCELLED', 'MISSING'].map(t => (
          <button
            key={t}
            onClick={() => setTabFilter(t as any)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black transition-all",
              tabFilter === t ? "bg-amber-500 text-black" : "text-gray-500 hover:text-white"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all border border-white/5"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin text-amber-500" : ""} />
            تحديث البيانات
          </button>
          
          <div className="h-4 w-px bg-white/10 mx-2" />
          
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'table' ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'cards' ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all border border-white/5"
        >
          <Activity size={14} className="text-primary" />
          {showAnalytics ? 'إخفاء الإحصائيات البصرية' : 'عرض الإحصائيات البصرية'}
          <ChevronDown size={14} className={cn("transition-transform duration-300", showAnalytics ? "rotate-180" : "")} />
        </button>
      </div>

      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <MatchesAnalyticsDashboard 
              stats={{
                live: matches.filter(m => m.isLive || m.status === 'LIVE' || m.status?.long === 'LIVE').length,
                upcoming: matches.filter(m => !m.isLive && m.status !== 'Finished').length,
                finished: matches.filter(m => m.status === 'Finished').length,
                cancelled: matches.filter(m => m.status === 'Cancelled' || m.status === 'Postponed').length,
                leagueData: [], // simplify
                dayData: [] // simplify
              }}
            />
            <MatchDiagnosticTool />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-black/25 border border-white/5 rounded-3xl p-5 space-y-4">
        <MatchApprovalPanel 
          filteredMatchesLength={filteredMatches.length}
          loadData={loadData}
          loading={loading}
          handleStartAddMatch={handleStartAddMatch}
          showAdvancedFilters={showAdvancedFilters}
          setShowAdvancedFilters={setShowAdvancedFilters}
          selectedLeagueFilter={selectedLeagueFilter}
          selectedDateFilter={selectedDateFilter}
          searchQuery={searchQuery}
        />

        <AnimatePresence>
          {(showAdvancedFilters || selectedLeagueFilter !== 'ALL' || selectedDateFilter || searchQuery) && (
            <MatchFilters 
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              selectedLeagueFilter={selectedLeagueFilter} setSelectedLeagueFilter={setSelectedLeagueFilter}
              selectedDateFilter={selectedDateFilter} setSelectedDateFilter={setSelectedDateFilter}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              sourceFilter={sourceFilter} setSourceFilter={setSourceFilter}
              leagues={leagues}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="slate-glass rounded-[2.5rem] border border-white/5 p-6 relative overflow-hidden">
        <MatchesTable 
          loading={loading}
          filteredMatches={paginatedMatches}
          selectedIds={selectedIds}
          handleSelectAllVisible={handleSelectAllVisible}
          handleToggleSelectMatch={handleToggleSelectMatch}
          formatDateString={formatDateString}
          actionLoading={actionLoading}
          handleToggleApproved={toggleApproved}
          handleToggleFeatured={toggleFeatured}
          handleToggleHidden={toggleHidden}
          handleToggleArchived={toggleArchived}
          handleStartEditMatch={handleStartEditMatch}
          handleDeleteMatch={deleteMatch}
          handleRestoreMatch={restoreMatch}
          handleDuplicateMatch={duplicateMatch}
          handleShowHistory={handleShowHistory}
          handleQuickSave={quickSave}
          viewMode={viewMode}
        />

        {/* Pagination Controls */}
        {filteredMatches.length > 0 && (
          <div className="mt-6 pt-4 flex items-center justify-between border-t border-white/5 text-xs">
            <span className="text-gray-400 font-bold">
              عرض {Math.min(filteredMatches.length, (currentPage - 1) * pageSize + 1)} - {Math.min(filteredMatches.length, currentPage * pageSize)} من أصل {filteredMatches.length} مباراة
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronRight size={16} />
              </button>
              <span className="text-white font-mono font-black px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <BulkActionsToolbar 
        selectedIds={selectedIds} 
        setSelectedIds={setSelectedIds} 
        handleBulkApprove={handleBulkApprove} 
        handleBulkFeature={handleBulkFeature} 
        handleBulkHide={handleBulkHide} 
        handleBulkArchive={handleBulkArchive} 
        handleBulkDelete={handleBulkDelete} 
        handleBulkRestore={viewDeleted ? handleBulkRestore : undefined}
        isRecycleBin={viewDeleted}
      />
      
      <MatchEditor 
        showMatchModal={showMatchModal} 
        setShowMatchModal={setShowMatchModal} 
        modalType={modalType} 
        formData={formData} 
        setFormData={setFormData} 
        handleSaveMatch={handleSaveMatchSubmit} 
      />

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HistoryIcon className="text-amber-500" size={20} />
                  <h3 className="text-lg font-black text-white">سجل وسجل نشاط المباراة</h3>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <div className="flex border-b border-white/5">
                <button 
                  onClick={() => setHistoryTab('versions')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black tracking-widest uppercase transition-all border-b-2",
                    historyTab === 'versions' ? "border-amber-500 text-amber-500 bg-amber-500/5" : "border-transparent text-gray-500 hover:text-white"
                  )}
                >
                  لقطات البيانات (Versions)
                </button>
                <button 
                  onClick={() => setHistoryTab('timeline')}
                  className={cn(
                    "flex-1 py-3 text-[10px] font-black tracking-widest uppercase transition-all border-b-2",
                    historyTab === 'timeline' ? "border-blue-500 text-blue-500 bg-blue-500/5" : "border-transparent text-gray-500 hover:text-white"
                  )}
                >
                  الجدول الزمني (Activity)
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingVersions ? (
                  <div className="flex justify-center py-12"><RefreshCcw className="animate-spin text-amber-500" /></div>
                ) : historyTab === 'versions' ? (
                  matchVersions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">لا يوجد سجل تعديلات متاح لهذه المباراة</div>
                  ) : (
                    matchVersions.map((v, idx) => (
                      <div key={v.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-500">الإصدار #{matchVersions.length - idx}</span>
                          <span className="text-[10px] text-gray-500">{new Date(v.timestamp?.toDate ? v.timestamp.toDate() : v.timestamp).toLocaleString('ar-SA')}</span>
                        </div>
                        <div className="text-xs font-bold text-gray-300">بواسطة: {v.editorName}</div>
                        {v.changedFields.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {v.changedFields.map(f => (
                              <span key={f} className="text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded uppercase font-black">{f}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )
                ) : (
                  matchAuditLogs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">لا يوجد سجل نشاط متاح لهذه المباراة</div>
                  ) : (
                    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-white/5">
                      {matchAuditLogs.map((log, idx) => (
                        <div key={log.id} className="relative flex items-center justify-between md:justify-start md:space-x-4">
                          <div className="flex items-center space-x-4 md:space-x-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#111] border border-white/10 text-amber-500 shadow-sm z-10 shrink-0">
                              <Activity size={16} />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white">{log.action}</span>
                                <span className="text-[10px] text-gray-500 font-bold">{new Date(log.timestamp?.toDate ? log.timestamp.toDate() : log.timestamp).toLocaleString('ar-SA')}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5 font-bold">{log.details}</p>
                              <span className="text-[9px] text-gray-600 font-black mt-1">بواسطة: {log.userName}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
