import { useState } from 'react';
import { worldCupAdminRepository } from '../repositories/worldCupAdminRepository';
import { worldCupSyncService } from '../../../services/worldCupSyncService';

type ToastTrigger = (msg: string) => void;

export function useWorldCupActions(triggerToast: ToastTrigger, onRefreshAllData: () => void, loadCmsData: () => void) {
  const [loading, setLoading] = useState(false);
  
  const runSync = async (customSyncUrl: string) => {
    setLoading(true);
    triggerToast("جاري المزامنة...");
    try {
      const success = await worldCupSyncService.syncEditionData(2026, customSyncUrl || undefined);
      if (success) {
        triggerToast("✅ تم تحديث بيانات كأس العالم بنجاح!");
        loadCmsData();
      } else {
        triggerToast("❌ فشلت المزامنة");
      }
    } catch (e) {
      console.error(e);
      triggerToast("❌ خطأ أثناء المزامنة");
    } finally {
      setLoading(false);
    }
  };

  const saveMatchOverride = async (editingMatchId: string, form: any) => {
    try {
      await worldCupAdminRepository.saveMatchOverride(editingMatchId, {
        homeScore: Number(form.homeScore),
        awayScore: Number(form.awayScore),
        status: form.status,
        elapsed: Number(form.elapsed),
        
        matchName: form.matchName,
        homeTeamName: form.homeTeamName,
        awayTeamName: form.awayTeamName,
        homeTeamCrest: form.homeTeamCrest,
        awayTeamCrest: form.awayTeamCrest,
        utcDate: form.utcDate ? new Date(form.utcDate).toISOString() : form.utcDate,
        matchDescription: form.matchDescription,
        matchImage: form.matchImage,
        competitionName: form.competitionName,
        venue: form.venue,
        referee: form.referee,
        broadcastingChannels: form.broadcastingChannels
      });

      triggerToast("✅ تم تحديث جميع تفاصيل وبيانات المباراة بنجاح!");
      loadCmsData();
      onRefreshAllData();
      return true;
    } catch (e) {
      console.error(e);
      triggerToast("❌ فشل كتابة التعديلات إلى Firestore");
      return false;
    }
  };

  const saveTeamOverride = async (editingTeamId: string, form: any) => {
    try {
      await worldCupAdminRepository.saveTeamOverride(editingTeamId, {
        name: form.name,
        coach: form.coach,
        ranking: Number(form.ranking),
        history: form.history
      });

      triggerToast("✅ تم تحديث بيانات المنتخب وتفضيلاته بنجاح!");
      loadCmsData();
      onRefreshAllData();
      return true;
    } catch (e) {
      console.error(e);
      triggerToast("❌ فشل كتابة المنتخبات إلى Firestore");
      return false;
    }
  };

  const publishNews = async (article: any, cb: () => void) => {
    if (!article.title || !article.content) return;
    try {
      await worldCupAdminRepository.addNews(article);
      triggerToast("✅ تم نشر الخبر المذهب بنجاح!");
      cb(); 
      loadCmsData();
    } catch (e) {
      console.error(e);
      triggerToast("❌ فشل كتابة الخبر");
    }
  };

  const deleteNews = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف الخبر؟")) return;
    try {
      await worldCupAdminRepository.deleteNews(id);
      triggerToast("🗑️ تم حذف الخبر المختار.");
      loadCmsData();
    } catch (e) {
      console.error(e);
      triggerToast("❌ فشل الحذف");
    }
  };

  const publishStream = async (stream: any, editingStreamId: string | null, cb: () => void) => {
    if (!stream.matchId || !stream.channelName || !stream.primaryStream) {
      triggerToast("⚠️ الرجاء ملء الحقول الإلزامية للمباراة");
      return;
    }
    try {
      if (editingStreamId) {
        await worldCupAdminRepository.updateStream(editingStreamId, stream);
        triggerToast("📺 تم تحديث قناة البث بنجاح!");
      } else {
        await worldCupAdminRepository.addStream(stream.matchId, stream);
        triggerToast("📺 تم إدراج قناة البث المباشر بنجاح!");
      }
      cb();
      loadCmsData();
    } catch (e) {
      console.error(e);
      triggerToast("❌ فشل معالجة قنوات البث");
    }
  };

  const toggleStreamActive = async (id: string, currentVal: boolean) => {
    try {
      await worldCupAdminRepository.updateStream(id, { isActive: !currentVal });
      triggerToast("👁️ تم تغيير حالة ظهور البث المباشر!");
      loadCmsData();
    } catch (e) {
      console.error(e);
      triggerToast("❌ فشل تعديل حالة البث");
    }
  };

  const deleteStream = async (id: string, cb: () => void) => {
    try {
      await worldCupAdminRepository.deleteStream(id);
      triggerToast("🗑️ تم إلغاء بث القناة وحذف الرابط.");
      cb();
      loadCmsData();
    } catch (e) {
      console.error(e);
      triggerToast("❌ فشل حذف الرابط");
    }
  };

  const toggleAdmin = async (userId: string, currentVal: boolean) => {
    try {
      await worldCupAdminRepository.updateUserRole(userId, { isAdmin: !currentVal });
      triggerToast("👑 تم تعديل رتبة العضو بنجاح!");
      loadCmsData();
    } catch (e) {
      console.error(e);
      triggerToast("❌ تعديل الرتب في Firestore محمي للمشرف الرئيسي");
    }
  };

  return {
    loading,
    runSync,
    saveMatchOverride,
    saveTeamOverride,
    publishNews,
    deleteNews,
    publishStream,
    toggleStreamActive,
    deleteStream,
    toggleAdmin
  };
}
