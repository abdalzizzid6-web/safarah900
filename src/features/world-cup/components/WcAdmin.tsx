import React, { useState } from 'react';
import { useWorldCup } from '../hooks/useWorldCup';
import { useWorldCupActions } from '../hooks/useWorldCupActions';
import { useWorldCupForm } from '../hooks/useWorldCupForm';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Settings, Calendar, Users, Newspaper, Play, UsersRound, Plus, Edit3, Trash2, Check, RefreshCw, Radio, HardDrive, Wifi, Database, Terminal, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { UserRole } from '../../../types';

import { WcMatchesTab } from './tabs/WcMatchesTab';
import { WcTeamsTab } from './tabs/WcTeamsTab';
import { WcNewsTab } from './tabs/WcNewsTab';
import { WcStreamsTab } from './tabs/WcStreamsTab';
import { WcUsersTab } from './tabs/WcUsersTab';
import { WcSourcesTab } from './tabs/WcSourcesTab';
import { WcLogsTab } from './tabs/WcLogsTab';

export default function WcAdmin({ onRefreshAllData }: { onRefreshAllData: () => void }) {
  const { role } = useAuth();
  const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'matches' | 'teams' | 'news' | 'streams' | 'users' | 'sources' | 'logs'>('matches');

  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setSyncStatus(msg);
    setTimeout(() => setSyncStatus(null), 3000);
  };
  
  const { dbMatches, dbTeams, newsList, streamsList, usersList, apiLogs, providerSettings, loadCmsData } = useWorldCup();
  const { loading, runSync, saveMatchOverride, saveTeamOverride, publishNews, deleteNews, publishStream, toggleStreamActive, deleteStream, toggleAdmin } = useWorldCupActions(triggerToast, onRefreshAllData, loadCmsData);
  
  const {
    editingMatch, setEditingMatch, matchOverrideForm, setMatchOverrideForm, handleEditMatchClick,
    matchSearchTerm, setMatchSearchTerm,
    editingTeam, setEditingTeam, teamForm, setTeamForm, handleEditTeamClick,
    newArticle, setNewArticle,
    newStream, setNewStream, editingStreamId, setEditingStreamId, handleEditStreamClick,
    customSyncUrl, setCustomSyncUrl
  } = useWorldCupForm();

  const handleSaveMatchOverride = async () => {
    const success = await saveMatchOverride(String(editingMatch?.id), matchOverrideForm);
    if(success) setEditingMatch(null);
  };

  const handleSaveTeamOverride = async () => {
    const success = await saveTeamOverride(String(editingTeam?.id), teamForm);
    if(success) setEditingTeam(null);
  };

  const handlePublishNews = async (e: React.FormEvent) => {
    e.preventDefault();
    await publishNews(newArticle, () => setNewArticle({ title: '', summary: '', content: '', image: '', author: 'ناشر البطولة' }));
  };

  const handleDeleteNews = async (id: string) => {
    await deleteNews(id);
  };

  const handlePublishStream = async (e: React.FormEvent) => {
    e.preventDefault();
    await publishStream(newStream, editingStreamId, () => {
      setEditingStreamId(null);
      setNewStream({ matchId: '', channelName: '', primaryStream: '', backupStream: '', streamQuality: 'FHD', streamNotes: '', isActive: true });
    });
  };

  const handleToggleStreamActive = async (id: string, currentVal: boolean) => {
    await toggleStreamActive(id, currentVal);
  };

  const handleDeleteStream = async (id: string) => {
    await deleteStream(id, () => {
      if (editingStreamId === id) {
        setEditingStreamId(null);
        setNewStream({ matchId: '', channelName: '', primaryStream: '', backupStream: '', streamQuality: 'FHD', streamNotes: '', isActive: true });
      }
    });
  };

  const handleToggleAdmin = async (userId: string, currentVal: boolean) => {
    await toggleAdmin(userId, currentVal);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 border border-red-500/10 rounded-3xl bg-red-500/5 text-center space-y-4 max-w-lg mx-auto" dir="rtl">
        <ShieldAlert className="w-12 h-12 text-[#f3c623] mx-auto animate-bounce" />
        <h3 className="text-sm font-black text-white">صلاحيات إشرافية مطلوبة</h3>
        <p className="text-xs text-gray-400 font-bold leading-relaxed">
          يتطلب هذا القسم امتلاك حساب بصلاحية "مدير النظام" للتحكم بالبث، والنتائج، ونشر المقالات.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast */}
      <AnimatePresence>
        {syncStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-[#d4af37] text-black text-xs font-black rounded-2xl shadow-2xl border border-amber-300"
          >
            {syncStatus}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 rounded-xl">
            <Settings className="w-5 h-5 text-[#f3c623] animate-spin" style={{ animationDuration: '60s' }} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">لوحة تحكم المشرفين wcup2026.org</h2>
            <p className="text-xs text-[#f3c623] font-bold">بوابة المشرفين الشاملة لإدارة المحتوى والنتائج الحية والمبثوثة</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={loadCmsData}
            className="p-2.5 bg-[#0d0d0d] hover:bg-[#121212] rounded-xl text-gray-400 hover:text-white border border-white/5"
          >
            <RefreshCw size={14} />
          </button>
          <span className="text-[10px] bg-[#d4af37]/25 text-[#f3c623] border border-[#d4af37]/40 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            <Wifi size={11} className="animate-pulse" />
            <span>نطاق الإدارة: Firestore متصل</span>
          </span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
        {[
          { id: 'matches', icon: Calendar, label: 'إدارة المباريات والنتائج' },
          { id: 'teams', icon: Users, label: 'إدارة المنتخبات' },
          { id: 'news', icon: Newspaper, label: 'نشر الأخبار والمقالات' },
          { id: 'streams', icon: Radio, label: 'قنوات البث المباشر' },
          { id: 'users', icon: UsersRound, label: 'إدارة رتب الأعضاء' },
          { id: 'sources', icon: Database, label: 'إدارة المصادر والمزامنة' },
          { id: 'logs', icon: Terminal, label: 'سجلات API' }
        ].map(subTab => (
          <button
            key={subTab.id}
            onClick={() => setActiveAdminSubTab(subTab.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              activeAdminSubTab === subTab.id 
                ? 'bg-[#d4af37] text-black border border-amber-300 shadow-lg'
                : 'bg-white/[0.02] text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            <subTab.icon size={12} />
            <span>{subTab.label}</span>
          </button>
        ))}
      </div>

      {/* ADMIN SUB CONTENT */}
      <div className="bg-[#08080a] border border-white/5 p-5 rounded-3xl min-h-[300px]">
        {activeAdminSubTab === 'matches' && (
          <WcMatchesTab dbMatches={dbMatches} editingMatch={editingMatch} setEditingMatch={setEditingMatch} matchOverrideForm={matchOverrideForm} setMatchOverrideForm={setMatchOverrideForm} handleSaveMatchOverride={handleSaveMatchOverride} matchSearchTerm={matchSearchTerm} setMatchSearchTerm={setMatchSearchTerm} handleEditMatchClick={handleEditMatchClick} />
        )}

        {activeAdminSubTab === 'teams' && (
          <WcTeamsTab dbTeams={dbTeams} editingTeam={editingTeam} setEditingTeam={setEditingTeam} teamForm={teamForm} setTeamForm={setTeamForm} handleSaveTeamOverride={handleSaveTeamOverride} handleEditTeamClick={handleEditTeamClick} />
        )}

        {activeAdminSubTab === 'news' && (
          <WcNewsTab newsList={newsList} newArticle={newArticle} setNewArticle={setNewArticle} handlePublishNews={handlePublishNews} handleDeleteNews={handleDeleteNews} />
        )}

        {activeAdminSubTab === 'streams' && (
          <WcStreamsTab streamsList={streamsList} dbMatches={dbMatches} newStream={newStream} setNewStream={setNewStream} editingStreamId={editingStreamId} setEditingStreamId={setEditingStreamId} handlePublishStream={handlePublishStream} handleEditStreamClick={handleEditStreamClick} handleToggleStreamActive={handleToggleStreamActive} handleDeleteStream={handleDeleteStream} />
        )}

        {activeAdminSubTab === 'users' && (
          <WcUsersTab usersList={usersList} handleToggleAdmin={handleToggleAdmin} role={role} UserRole={UserRole} />
        )}

        {activeAdminSubTab === 'sources' && (
          <WcSourcesTab providerSettings={providerSettings} customSyncUrl={customSyncUrl} setCustomSyncUrl={setCustomSyncUrl} runSync={runSync} loading={loading} />
        )}

        {activeAdminSubTab === 'logs' && (
          <WcLogsTab apiLogs={apiLogs} />
        )}
      </div>
    </div>
  );
}
