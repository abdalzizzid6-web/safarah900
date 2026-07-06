import React, { useState, useEffect } from 'react';
import { Send, Bell, Info, ShieldAlert, Zap, Users, Globe, Eye, History, UserCheck, ShieldCheck, RefreshCw } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { NotificationType } from '../../types';
import { useError } from '../../context/ErrorContext';

export default function NotificationBroadcast() {
  const { showToast } = useError();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<NotificationType>(NotificationType.SYSTEM_BROADCAST);
  const [target, setTarget] = useState<'ALL' | 'VIP'>('ALL');
  const [sending, setSending] = useState(false);
  
  // History table states
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await notificationService.getNotificationHistory();
      setHistory(data);
    } catch (err) {
      console.warn("Failed to load notification history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSend = async () => {
    if (!title || !body) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }
    setSending(true);
    try {
      await notificationService.sendBroadcast(title, body, type, target);
      showToast('تم إرسال الإشعار المخصص بنجاح ✅', 'success');
      setTitle('');
      setBody('');
      loadHistory(); // Refresh table logs
    } catch (err) {
      showToast('فشل إرسال الإشعار، يرجى المحاولة لاحقاً', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Sender Panel Container */}
      <div className="space-y-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Bell className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">إرسال إشعارات فورية متقدمة</h2>
              <p className="text-xs text-gray-500 font-bold mt-1">بث مباشر للأخبار العاجلة والنتائج وتنبيه فئات معينة من المستخدمين.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={loadHistory}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-all self-end sm:self-center"
          >
            <RefreshCw size={14} className={loadingHistory ? "animate-spin" : ""} />
            تحديث السجلات
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              {/* Form Row: Title */}
              <div>
                <label className="block text-xs font-black text-gray-400 mb-2">عنوان الإشعار</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: هدف عالمي لصالح الهلال! ⚽"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary text-white font-bold"
                />
              </div>
              
              {/* Form Row: Description */}
              <div>
                <label className="block text-xs font-black text-gray-400 mb-2">نص الإشعار التفصيلي</label>
                <textarea 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="اكتب هنا تفاصيل الخبر أو الرسالة التي تود إيصالها..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary text-white min-h-[120px] leading-relaxed"
                />
              </div>

              {/* Form Row: Audience Target */}
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-3">
                <label className="block text-xs font-black text-gray-400">تحديد فئة المستهدفين بالتنبيه</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setTarget('ALL')}
                    className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-black text-xs ${
                      target === 'ALL'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg'
                        : 'bg-white/5 border-white/5 text-gray-500 hover:text-gray-400'
                    }`}
                  >
                    <Users size={16} />
                    جميع الزوار والمشتركين (عام)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTarget('VIP')}
                    className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-black text-xs ${
                      target === 'VIP'
                        ? 'bg-primary/10 border-primary text-primary shadow-lg ring-1 ring-primary/20'
                        : 'bg-white/5 border-white/5 text-gray-500 hover:text-gray-400'
                    }`}
                  >
                    <ShieldCheck size={16} />
                    المشتركون المميزون VIP
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={handleSend}
                disabled={sending || !title || !body}
                className="px-10 py-4 bg-primary text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3 disabled:opacity-50 disabled:scale-100 cursor-pointer"
              >
                {sending ? 'جاري بث الإشعار...' : 'إرسال الإشعار الآن'}
                <Send size={18} />
              </button>
              <p className="text-[10px] text-gray-500 font-bold max-w-xs leading-relaxed">
                * ملاحظة: يتم توصيل هذا التنبيه لحظياً لجميع الأجهزة النشطة والويب وتطبيقات الهاتف الذكي عبر قنوات Firebase Cloud Messaging.
              </p>
            </div>
          </div>

          {/* Form Side: Category Selectors */}
          <div className="space-y-4">
            <label className="block text-xs font-black text-gray-400">نوع الإشعار والتصنيف</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: NotificationType.SYSTEM_BROADCAST, label: 'تنبيه نظام عام', icon: Globe, color: 'text-blue-400' },
                { id: NotificationType.BREAKING_NEWS, label: 'خبر عاجل 🔥', icon: Zap, color: 'text-orange-400' },
                { id: NotificationType.GOAL, label: 'هدف / نتيجة مباراة', icon: Info, color: 'text-emerald-400' },
                { id: NotificationType.VIP_EXCLUSIVE, label: 'محتوى حصري VIP', icon: ShieldAlert, color: 'text-primary' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as any)}
                  className={`p-4 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer text-right ${
                    type === t.id 
                    ? 'bg-white/10 border-primary shadow-lg translate-x-[-4px]' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-400'
                  }`}
                >
                  <t.icon className={t.color} size={18} />
                  <span className="text-xs font-black text-white">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History Log Panel Container */}
      <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
            <History size={18} />
          </div>
          <div>
            <h3 className="text-md font-black text-white">سجل الإشعارات المرسلة</h3>
            <p className="text-[11px] text-gray-500 font-bold mt-1">تتبع حالة التوصيل والمستهدفين وتفاصيل البث والتحقق الفوري.</p>
          </div>
        </div>

        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
            <RefreshCw className="animate-spin text-primary" size={24} />
            <p className="text-xs font-bold font-mono">جاري تحميل سجل البث الرياضي...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.01] border border-white/5 rounded-2xl">
            <Bell className="text-gray-600 block mx-auto mb-3 opacity-30" size={32} />
            <p className="text-xs text-gray-500 font-bold">لا توجد إشعارات مرسلة في السجل حالياً.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/5 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-white/5">
                  <th className="p-4">العنوان والخبر</th>
                  <th className="p-4">نوع الإشعار</th>
                  <th className="p-4">الفئة المستهدفة</th>
                  <th className="p-4">توقيت البث</th>
                  <th className="p-4">حالة التوصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((log) => {
                  const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('ar-SA', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  }) : 'غير محدد';
                  
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.01] text-xs transition-colors">
                      <td className="p-4 max-w-xs">
                        <p className="font-black text-white">{log.title}</p>
                        <p className="text-[10px] text-gray-500 truncate mt-1">{log.body}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                          log.type === NotificationType.BREAKING_NEWS ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          log.type === NotificationType.GOAL ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          log.type === NotificationType.VIP_EXCLUSIVE ? 'bg-primary/10 text-primary border border-primary/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {log.type === NotificationType.BREAKING_NEWS ? 'عاجل 🔥' :
                           log.type === NotificationType.GOAL ? 'هدف ⚽' :
                           log.type === NotificationType.VIP_EXCLUSIVE ? 'حصري VIP ✨' :
                           'عام 📢'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-extrabold flex items-center gap-1.5">
                          {log.target === 'VIP' ? (
                            <>
                              <ShieldCheck className="text-primary" size={12} />
                              <span className="text-primary text-[10px]">المشتركون VIP</span>
                            </>
                          ) : (
                            <>
                              <Users className="text-gray-400" size={12} />
                              <span className="text-gray-400 text-[10px]">الجميع (بث عام)</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-gray-400 text-[10px]">{dateStr}</td>
                      <td className="p-4 font-mono">
                        <span className="text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px]">
                          {log.deliveryStatus || '✓ Sent'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
