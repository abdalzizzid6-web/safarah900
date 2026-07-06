import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Trophy, AlertTriangle, Goal, Target, UserPlus, AlertCircle, Clock, Play, Pause, Square, RefreshCw } from 'lucide-react';
import { matchEnterpriseService, MatchStatus } from '@/src/admin/matches/services/matchEnterpriseService';
import { useError } from '@/src/context/ErrorContext';
import { auth } from '@/src/firebase';
import { cn } from '@/src/lib/utils';

export default function LiveMatchControls({ match, onClose }: { match: any, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useError();
  const user = auth.currentUser;

  const handleUpdateStatus = async (status: MatchStatus) => {
    setLoading(true);
    try {
      await matchEnterpriseService.updateMatchStatus(match.id, status, user?.uid || 'system', user?.displayName || user?.email || 'System');
      showToast(`تم تغيير الحالة إلى ${status}`, 'success');
    } catch (e) {
      console.error(e);
      showToast('خطأ أثناء تغيير الحالة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (type: string, detail: string) => {
    setLoading(true);
    try {
      const event = {
        id: Date.now().toString(),
        type,
        detail,
        minute: 0, 
        timestamp: new Date().toISOString()
      };
      await matchEnterpriseService.addMatchEvent(match.id, event, user?.uid || 'system', user?.displayName || user?.email || 'System');
      showToast('تمت إضافة الحدث بنجاح', 'success');
    } catch (e) {
      console.error(e);
      showToast('خطأ أثناء إضافة الحدث', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111] border border-white/10 rounded-[2.5rem] w-full max-w-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white">التحكم المباشر: {match.homeTeam?.name || 'Home'} - {match.awayTeam?.name || 'Away'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-gray-500"><X size={20} /></button>
        </div>

        <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase">دورة حياة المباراة</h4>
            <div className="grid grid-cols-4 gap-2">
                <button onClick={() => handleUpdateStatus(MatchStatus.Live)} disabled={loading} className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold text-[10px]">
                    <Play size={14} className="mx-auto mb-1"/> بدء
                </button>
                <button onClick={() => handleUpdateStatus(MatchStatus.HalfTime)} disabled={loading} className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl font-bold text-[10px]">
                    <Pause size={14} className="mx-auto mb-1"/> توقف
                </button>
                <button onClick={() => handleUpdateStatus(MatchStatus.Live)} disabled={loading} className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl font-bold text-[10px]">
                    <RefreshCw size={14} className="mx-auto mb-1"/> استئناف
                </button>
                <button onClick={() => handleUpdateStatus(MatchStatus.Finished)} disabled={loading} className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold text-[10px]">
                    <Square size={14} className="mx-auto mb-1"/> إنهاء
                </button>
            </div>
        </div>

        <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase">أحداث المباراة</h4>
            <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleAddEvent('Goal', 'Goal scored')} disabled={loading} className="flex flex-col items-center justify-center p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold text-[10px]">
                <Goal size={16} className="mb-1" /> هدف
            </button>
            <button onClick={() => handleAddEvent('YellowCard', 'Yellow card')} disabled={loading} className="flex flex-col items-center justify-center p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl font-bold text-[10px]">
                <AlertTriangle size={16} className="mb-1" /> صفراء
            </button>
            <button onClick={() => handleAddEvent('Substitution', 'Substitution')} disabled={loading} className="flex flex-col items-center justify-center p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl font-bold text-[10px]">
                <UserPlus size={16} className="mb-1" /> تبديل
            </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
