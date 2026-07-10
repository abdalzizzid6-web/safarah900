import { useState } from 'react';
import { matchAdminService } from '../services/matchAdminService';
import { matchEnterpriseService, MatchStatus } from '../services/matchEnterpriseService';
import { useQueryClient } from '@tanstack/react-query';
import { logMatchAction } from '@/services/matchService';
import { Match } from '@/types';
import { createSlugPath } from '@/utils/slugify';
import { auth } from '@/firebase';

export function useMatchActions(matches: Match[], showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const rebuildCache = async () => {
    try {
      await fetch('/api/cache/rebuild', { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['liveMatchesV2'] });
      queryClient.invalidateQueries({ queryKey: ['fixturesV2'] });
      queryClient.invalidateQueries({ queryKey: ['matchDetailsV2'] });
    } catch (e) {
      console.error("Failed to trigger cache rebuild:", e);
    }
  };

  const notifyGoogle = async (match: Match, isApproved: boolean) => {
    try {
      const homeName = typeof match.homeTeam === 'string' ? match.homeTeam : (match.homeTeam?.name || '');
      const awayName = typeof match.awayTeam === 'string' ? match.awayTeam : (match.awayTeam?.name || '');
      const title = `${homeName} vs ${awayName}`;
      const slug = createSlugPath(title, match.id);
      const fullUrl = `https://korea90.xyz/match/${slug}`;
      await fetch('/api/indexing/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl, type: isApproved ? 'URL_UPDATED' : 'URL_DELETED' })
      });
    } catch (err) {
      console.warn('Google Indexing notification failed:', err);
    }
  };

  const toggleApproved = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    setActionLoading(matchId);
    const newApproved = !match.approved;
    try {
      await matchAdminService.updateMatch(matchId, { approved: newApproved });
      await logMatchAction('TOGGLE_APPROVED', matchId, { oldStatus: match.approved, newStatus: newApproved });
      await rebuildCache();
      if (newApproved || match.approved) {
        await notifyGoogle(match, newApproved);
      }
      showToast(newApproved ? 'تمت الموافقة على وعرض المباراة للجمهور ✅' : 'تم سحب الموافقة على المباراة ⏳', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('حدث خطأ أثناء تعديل حالة الموافقة.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleFeatured = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    setActionLoading(matchId);
    const newFeatured = !match.isFeatured;
    try {
      await matchAdminService.updateMatch(matchId, { isFeatured: newFeatured });
      await logMatchAction('TOGGLE_FEATURED', matchId, { oldStatus: match.isFeatured, newStatus: newFeatured });
      await rebuildCache();
      showToast(newFeatured ? 'تم تمييز المباراة في لوحة البث 🌟' : 'تم إلغاء تمييز المباراة.', 'success');
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء تمييز المباراة.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleHidden = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    setActionLoading(matchId);
    const newHidden = !match.isHidden;
    try {
      await matchAdminService.updateMatch(matchId, { isHidden: newHidden });
      await logMatchAction('TOGGLE_HIDDEN', matchId, { oldStatus: match.isHidden, newStatus: newHidden });
      await rebuildCache();
      showToast(newHidden ? 'تم إخفاء وحظر البث المباشر للمباراة' : 'تم إلغاء إخفاء المباراة.', 'warning');
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء تعديل الحظر.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleArchived = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    setActionLoading(matchId);
    const newArchived = !match.archived;
    try {
      await matchAdminService.updateMatch(matchId, { archived: newArchived });
      await logMatchAction('TOGGLE_ARCHIVED', matchId, { oldStatus: match.archived, newStatus: newArchived });
      await rebuildCache();
      showToast(newArchived ? 'تم أرشفة المباراة 📦' : 'تم استعادة المباراة.', 'success');
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء الأرشفة.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteMatch = async (matchId: string) => {
    setActionLoading(matchId);
    const user = auth.currentUser;
    try {
      await matchEnterpriseService.softDelete(matchId, user?.uid || 'system', user?.displayName || user?.email || 'System');
      await rebuildCache();
      showToast('تم نقل المباراة إلى سلة المهملات', 'success');
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء الحذف.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const restoreMatch = async (matchId: string) => {
    setActionLoading(matchId);
    const user = auth.currentUser;
    try {
      await matchEnterpriseService.restoreMatch(matchId, user?.uid || 'system', user?.displayName || user?.email || 'System');
      await rebuildCache();
      showToast('تم استعادة المباراة بنجاح', 'success');
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء الاستعادة.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const duplicateMatch = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    
    setActionLoading(matchId);
    const user = auth.currentUser;
    try {
      const newId = `dup-${matchId}-${Date.now()}`;
      const { 
        id, 
        score, 
        events, 
        minute, 
        isLive, 
        ...duplicateData 
      } = match;
      
      const payload = {
        ...duplicateData,
        status: 'NS', // Not Started
        homeScore: 0,
        awayScore: 0,
        score: { home: 0, away: 0 },
        events: [],
        editorialStatus: MatchStatus.Draft,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await matchAdminService.createMatch(newId, payload);
      await matchEnterpriseService.logAction({
        matchId: newId,
        userId: user?.uid || 'system',
        userName: user?.displayName || user?.email || 'System',
        action: 'Duplicate',
        details: `Duplicated from ${matchId}`
      });
      
      await rebuildCache();
      showToast('تم تكرار المباراة بنجاح (مسودة)', 'success');
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء التكرار.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const bulkAction = async (ids: string[], actionType: 'approve' | 'archive' | 'delete' | 'hide' | 'unhide' | 'restore') => {
    if (ids.length === 0) return;
    setActionLoading('bulk');
    const user = auth.currentUser;
    try {
      if (actionType === 'approve') {
        await matchAdminService.bulkUpdate(ids, { approved: true, editorialStatus: MatchStatus.Approved });
      }
      if (actionType === 'archive') {
        await matchAdminService.bulkUpdate(ids, { archived: true, editorialStatus: MatchStatus.Archived });
      }
      if (actionType === 'hide') {
        await matchAdminService.bulkUpdate(ids, { isHidden: true });
      }
      if (actionType === 'unhide') {
        await matchAdminService.bulkUpdate(ids, { isHidden: false });
      }
      if (actionType === 'delete') {
        for (const id of ids) {
          await matchEnterpriseService.softDelete(id, user?.uid || 'system', user?.displayName || user?.email || 'System');
        }
      }
      if (actionType === 'restore') {
        for (const id of ids) {
          await matchEnterpriseService.restoreMatch(id, user?.uid || 'system', user?.displayName || user?.email || 'System');
        }
      }
      await rebuildCache();
      showToast('تم تنفيذ الإجراء المجمع بنجاح', 'success');
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ في الإجراء المجمع', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const saveMatch = async (modalType: 'add' | 'edit', modalMatchId: string, matchPayload: any) => {
    const user = auth.currentUser;
    const previousMatch = modalType === 'edit' ? matches.find(m => m.id === modalMatchId) : null;

    try {
      if (modalType === 'add') {
        const newId = `apf-manual-${Date.now()}`;
        const payload = {
          ...matchPayload,
          editorialStatus: matchPayload.editorialStatus || MatchStatus.Draft
        };
        await matchAdminService.createMatch(newId, payload);
        await matchEnterpriseService.logAction({
          matchId: newId,
          userId: user?.uid || 'system',
          userName: user?.displayName || user?.email || 'System',
          action: 'Create',
          details: 'Manual match created'
        });
        showToast('تم إضافة المباراة بنجاح', 'success');
      } else {
        const payload = {
          ...matchPayload,
          version: (previousMatch?.version || 0) + 1,
          lastEditedBy: {
            id: user?.uid || 'system',
            name: user?.displayName || user?.email || 'System'
          }
        };
        
        // Create version snapshot before updating
        await matchEnterpriseService.createVersion(
          modalMatchId,
          payload,
          user?.uid || 'system',
          user?.displayName || user?.email || 'System',
          previousMatch
        );

        await matchAdminService.updateMatch(modalMatchId, payload);
        
        await matchEnterpriseService.logAction({
          matchId: modalMatchId,
          userId: user?.uid || 'system',
          userName: user?.displayName || user?.email || 'System',
          action: 'Update',
          details: 'Match content updated'
        });
        
        showToast('تم تحديث المباراة بنجاح', 'success');
      }
      await rebuildCache();
    } catch (err: any) {
      console.error(err);
      showToast(`حدث خطأ أثناء الحفظ: ${err.message || String(err)}`, 'error');
    }
  };

  const quickSave = async (matchId: string, data: { homeScore?: number; awayScore?: number; status?: string }) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    setActionLoading(matchId);
    const user = auth.currentUser;
    try {
      const payload: any = {
        score: {
          home: data.homeScore ?? (match.score?.home || 0),
          away: data.awayScore ?? (match.score?.away || 0)
        },
        status: data.status ?? match.status
      };

      // Simplified update for quick edit
      await matchAdminService.updateMatch(matchId, payload);
      
      await matchEnterpriseService.logAction({
        matchId: matchId,
        userId: user?.uid || 'system',
        userName: user?.displayName || user?.email || 'System',
        action: 'QuickEdit',
        details: `Updated score: ${payload.score.home}-${payload.score.away}, status: ${payload.status}`
      });

      await rebuildCache();
      showToast('تم التحديث السريع بنجاح ⚡', 'success');
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء التحديث السريع.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return { 
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
  };
}
