import React, { useState, useEffect } from 'react';
import { 
  collection, query, orderBy, onSnapshot, doc, 
  updateDoc, deleteDoc, writeBatch, getDocs, addDoc, limit
} from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Bug, Trash2, CheckCircle2, Search, Clock, RefreshCw, X, 
  AlertCircle, Sparkles, Filter, ShieldAlert, Terminal, Eye,
  CheckCircle, ArrowLeft, ShieldCheck, Database, Wifi, Shield, Lock, FileJson
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useError } from '../../context/ErrorContext';

interface ErrorLog {
  id: string;
  message: string;
  classification: string;
  timestamp: string;
  url: string;
  userAgent: string;
  userEmail: string;
  resolved: boolean;
  stack?: string | null;
}

export default function BugLogsDashboard() {
  const { showError, showToast } = useError();
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [testErrorType, setTestErrorType] = useState<string>('Network');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'error_logs'), orderBy('timestamp', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const fetchedLogs: ErrorLog[] = [];
      snapshot.forEach((docSnap) => {
        fetchedLogs.push({ id: docSnap.id, ...docSnap.data() } as ErrorLog);
      });
      setLogs(fetchedLogs);
    } catch (err) {
      console.error("Failed to load logs:", err);
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs locally for responsiveness
  const filteredLogs = logs.filter((log) => {
    const matchesClass = filterClass === 'all' || log.classification === filterClass;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'resolved' && log.resolved) || 
      (filterStatus === 'pending' && !log.resolved);
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      log.message?.toLowerCase().includes(searchLower) ||
      log.url?.toLowerCase().includes(searchLower) ||
      log.userEmail?.toLowerCase().includes(searchLower) ||
      log.classification?.toLowerCase().includes(searchLower);

    return matchesClass && matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const totalCount = logs.length;
  const pendingCount = logs.filter(l => !l.resolved).length;
  const resolvedCount = logs.filter(l => l.resolved).length;

  const classificationCounts = logs.reduce((acc: Record<string, number>, log) => {
    acc[log.classification] = (acc[log.classification] || 0) + 1;
    return acc;
  }, {});

  // Actions
  const handleToggleResolve = async (logId: string, currentStatus: boolean) => {
    try {
      const logRef = doc(db, 'error_logs', logId);
      await updateDoc(logRef, { resolved: !currentStatus });
      showToast(currentStatus ? 'تم نقل الخطأ بنجاح لقائمة الأخطاء النشطة' : 'تم تمييز المشكلة كمحلولة بنجاح ✓', 'success');
      if (selectedLog?.id === logId) {
        setSelectedLog(prev => prev ? { ...prev, resolved: !currentStatus } : null);
      }
    } catch (err) {
      showError(err);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      if (!confirm('هل أنت متأكد من رغبتك في حذف هذا السجل بشكل نهائي؟')) return;
      await deleteDoc(doc(db, 'error_logs', logId));
      showToast('تم حذف سجل الخطأ بنجاح', 'success');
      if (selectedLog?.id === logId) {
        setSelectedLog(null);
      }
    } catch (err) {
      showError(err);
    }
  };

  const handleClearAllLogs = async () => {
    try {
      if (!confirm('تحذير! سيتم مسح كافة سجلات الأخطاء المخزنة في قاعدة البيانات نهائياً. هل تود الاستمرار؟')) return;
      const snapshot = await getDocs(collection(db, 'error_logs'));
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      showToast('تم تصفية وإفراغ جميع سجلات الأخطاء بنجاح', 'success');
    } catch (err) {
      showError(err);
    }
  };

  const handleGenerateTestError = () => {
    try {
      if (testErrorType === 'Network') {
        showError(new Error("Failed to fetch match details. DNS lookup timeout. Local cache fallback initiated."));
      } else if (testErrorType === 'Quota') {
        showError(new Error("Firebase Firestore RESOURCE_EXHAUSTED: Quota limit exceeded for read transactions from client 958469007898."));
      } else if (testErrorType === 'Database') {
        showError(new Error("Missing or insufficient permissions. User in 'guest' role cannot write to collection 'settings'."));
      } else if (testErrorType === 'API') {
        showError(new Error("footballApiStatus - Unresolved route request to api-sports: RapidAPI token limit reached or invalid."));
      } else if (testErrorType === 'Runtime') {
        // Trigger a fake JS syntax error or runtime issue
        const fakeStack = "TypeError: Cannot read properties of undefined (reading 'homeLogo')\n    at MatchDetailsPage (MatchDetailsPage.tsx:45:21)\n    at renderWithHooks (react-dom.development.js:15467:18)";
        const errorObj = new Error("Cannot read properties of undefined (reading 'homeLogo')");
        errorObj.stack = fakeStack;
        showError(errorObj);
      } else {
        showError("حدث خطأ مجهول في عرض المكون الأساسي للتطبيق.");
      }
    } catch (err) {
      showError(err);
    }
  };

  const getClassificationStyles = (classification: string) => {
    if (classification.includes('تجاوز الحصة')) return { bg: 'bg-red-500/10 text-red-400 border-red-500/20', icon: ShieldAlert };
    if (classification.includes('قاعدة البيانات')) return { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Database };
    if (classification.includes('الـ API')) return { bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Terminal };
    if (classification.includes('المصادقة')) return { bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: Lock };
    if (classification.includes('الشبكة')) return { bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: Wifi };
    if (classification.includes('التشغيل')) return { bg: 'bg-pink-500/10 text-pink-400 border-pink-500/20', icon: FileJson };
    return { bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: Bug };
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Bug className="text-red-500" size={26} />
            إدارة سجلات الأخطاء (Error Logging)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            مستودع وتحليل فوري للأخطاء والمشكلات البرمجية التي تقع للمستخدمين مصنفة ومؤرشفة لتسهيل أعمال الصيانة وتحديث الكود.
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-300 text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
          >
            <RefreshCw size={15} />
            تحديث
          </button>
          {logs.length > 0 && (
            <button
              onClick={handleClearAllLogs}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer"
            >
              <Trash2 size={15} />
              مسح وتصفية الكل
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Logs Card */}
        <div className="glass border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium block">إجمالي المشكلات المكتشفة</span>
            <span className="text-3xl font-black text-white block mt-1">{totalCount}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-400">
            <Bug size={24} />
          </div>
        </div>

        {/* Pending Card */}
        <div className="glass border border-red-500/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-red-400 text-xs font-medium block">مشكلات نشطة قيد الفحص</span>
            <span className="text-3xl font-black text-red-500 block mt-1">{pendingCount}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertCircle size={24} />
          </div>
        </div>

        {/* Resolved Card */}
        <div className="glass border border-green-500/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-green-400 text-xs font-medium block">أعطال تم معالجتها وإغلاقها</span>
            <span className="text-3xl font-black text-green-500 block mt-1">{resolvedCount}</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Dynamic Simulator Widget inside statistics for smart accessibility */}
        <div className="glass border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
          <span className="text-slate-300 text-xs font-bold flex items-center gap-1.5 mb-2">
            <Sparkles size={13} className="text-yellow-400" />
            محاكي توليد الأخطاء البرمجية
          </span>
          <div className="flex gap-1.5">
            <select
              value={testErrorType}
              onChange={(e) => setTestErrorType(e.target.value)}
              className="bg-black/40 border border-white/5 rounded-lg px-2 py-1 text-xs text-white flex-1 focus:ring-1 focus:ring-red-500/50"
            >
              <option value="Network">عطل اتصال شبكة</option>
              <option value="Quota">تجاوز الكاش السحابي</option>
              <option value="Database">صلاحية قاعدة بيانات</option>
              <option value="API">مفتاح API منتهي</option>
              <option value="Runtime">عطل JS كراش كلاسيكي</option>
              <option value="Raw">رسالة نصية مبهمة</option>
            </select>
            <button
              onClick={handleGenerateTestError}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              جرّب التوليد
            </button>
          </div>
        </div>
      </div>

      {/* Filter and search controllers */}
      <div className="glass border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-[320px]">
          <span className="absolute right-3.5 top-2.5 text-slate-500">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="البحث بنص الخطأ، المسار، أو بريد العضو..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/30 border border-white/5 rounded-xl py-2 pr-10 pl-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white/10"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 bg-black/20 border border-white/5 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${filterStatus === 'pending' ? 'bg-red-500/10 text-red-400' : 'text-slate-400 hover:text-white'}`}
            >
              النشطة ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${filterStatus === 'resolved' ? 'bg-green-500/10 text-green-400' : 'text-slate-400 hover:text-white'}`}
            >
              المحلولة ({resolvedCount})
            </button>
          </div>

          <div className="flex items-center gap-1 bg-black/20 border border-white/5 rounded-xl p-1 shrink-0">
            <span className="text-slate-500 px-2 text-xs font-bold flex items-center gap-1">
              <Filter size={12} />
              فلترة التصنيف:
            </span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-transparent border-none text-slate-200 text-xs font-bold pr-1 pl-4 focus:ring-0 cursor-pointer"
            >
              <option value="all">كافة التصنيفات</option>
              <option value="تجاوز الحصة (Quota Limit)">تجاوز الحصة (Quota)</option>
              <option value="قاعدة البيانات (Database)">قاعدة البيانات (Database)</option>
              <option value="مزامنة الـ API (API)">عمل الـ API</option>
              <option value="المصادقة والصلاحيات (Auth)">المصادقة (Auth)</option>
              <option value="الشبكة والاتصال (Network)">مشاكل الشبكة (Network)</option>
              <option value="أخطاء التشغيل (JS Runtime)">أعطال JS كراش</option>
              <option value="أخرى (Other)">أخرى</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs layout Grid */}
      <div className="glass border border-white/5 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="animate-spin text-red-500" size={32} />
            <p className="text-sm font-bold">جاري تحميل وتحليل سجلات الأعطال من السحابة...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
            <div className="p-4 rounded-full bg-slate-500/5 text-slate-400 border border-slate-500/10">
              <ShieldCheck size={36} />
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-slate-300">سجل المشكلات البرمجية نظيف!</p>
              <p className="text-slate-400 text-xs mt-1">لا توجد أية أخطاء مطابقة للفلاتر النشطة حالياً.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log) => {
              const classMeta = getClassificationStyles(log.classification);
              const ItemIcon = classMeta.icon;
              
              return (
                <div 
                  key={log.id} 
                  className={`p-4 transition-all hover:bg-white/[0.01] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${log.resolved ? 'opacity-65' : ''}`}
                >
                  <div className="flex items-start gap-3 w-full lg:w-4/5">
                    <div className={`mt-0.5 p-2 rounded-xl shrink-0 border ${classMeta.bg}`}>
                      <ItemIcon size={18} />
                    </div>
                    
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-black tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${classMeta.bg}`}>
                          {log.classification}
                        </span>
                        {log.resolved ? (
                          <span className="text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            محلولة ومغلقة
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle size={11} />
                            نشطة قيد الصيانة
                          </span>
                        )}
                        <span className="text-slate-500 text-xs font-mono flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(log.timestamp).toLocaleString('ar-EG', { hour12: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm font-bold text-slate-100 select-all leading-relaxed break-words line-clamp-2 md:line-clamp-none">
                        {log.message}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1 text-slate-300">
                          <span className="text-slate-500">موقع العطل:</span> {log.url}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-slate-500">المستخدم:</span> {log.userEmail}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      title="عرض التفاصيل الكاملة لحزمة الخطأ"
                      className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                    >
                      <Eye size={15} />
                    </button>
                    
                    <button
                      onClick={() => handleToggleResolve(log.id, log.resolved)}
                      title={log.resolved ? "إعادة تنشيط المشكلة" : "تحديد كمحلولة"}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        log.resolved 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' 
                          : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                      }`}
                    >
                      <CheckCircle size={15} />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      title="مسح السجل بشكل نهائي"
                      className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expanded Modal details view */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-slate-100 z-10"
            >
              {/* Modal Core Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${getClassMeta(selectedLog).bg}`}>
                    <Bug size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">تفاصيل الخطأ البرمجي الدقيقة</h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">سلسلة السجل: {selectedLog.id}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedLog(null)}
                  className="hover:bg-white/10 p-2 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Modal Scroll content */}
              <div className="p-6 overflow-y-auto space-y-5">
                <div className="flex flex-wrap gap-4 items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex flex-wrap gap-2.5">
                    <span className={`text-xs font-black px-3 py-1 rounded-full border ${getClassMeta(selectedLog).bg}`}>
                      {selectedLog.classification}
                    </span>
                    {selectedLog.resolved ? (
                      <span className="text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        محلولة ومغلقة
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <AlertCircle size={13} />
                        نشطة قيد العمل
                      </span>
                    )}
                  </div>
                  
                  <span className="text-sm font-bold text-slate-400 font-mono">
                    توقيت العطل: {new Date(selectedLog.timestamp).toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'medium' })}
                  </span>
                </div>

                {/* Error Message Box */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 block">نص الخطأ والرسالة الأساسية:</label>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-slate-200 text-sm font-bold leading-relaxed break-words select-all">
                    {selectedLog.message}
                  </div>
                </div>

                {/* Layout Context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 bg-black/20 border border-white/5 rounded-xl p-4">
                    <label className="text-xs font-bold text-slate-500 block">مسار واجهة المستخدم (Page Link):</label>
                    <span className="text-slate-300 font-mono text-sm block select-all">{selectedLog.url}</span>
                  </div>

                  <div className="space-y-1 bg-black/20 border border-white/5 rounded-xl p-4">
                    <label className="text-xs font-bold text-slate-500 block">العضو المستهدف (Email):</label>
                    <span className="text-slate-300 font-mono text-sm block select-all">{selectedLog.userEmail}</span>
                  </div>
                </div>

                {/* Technical Stack trace */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Terminal size={14} className="text-pink-500" />
                    المسار البرمجي للعطل (Stack Trace):
                  </label>
                  {selectedLog.stack ? (
                    <pre className="p-4 rounded-xl bg-black/60 border border-pink-500/20 text-pink-300 text-xs font-mono overflow-x-auto select-all leading-normal whitespace-pre">
                      {selectedLog.stack}
                    </pre>
                  ) : (
                    <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-slate-500 text-xs font-semibold">
                      لم يتم تمرير تفاصيل Stack Trace مرافقة للخطأ من متصفح المستفيد.
                    </div>
                  )}
                </div>

                {/* User Agent metadata */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 block">بيانات متصفح المستخدم والبيئة (User Agent):</label>
                  <div className="p-3.5 rounded-xl bg-black/20 border border-white/5 text-slate-400 text-xs font-mono select-all">
                    {selectedLog.userAgent}
                  </div>
                </div>
              </div>

              {/* Modal footer Actions */}
              <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3 bg-black/20">
                <button
                  onClick={() => handleDeleteLog(selectedLog.id)}
                  className="px-4 py-2 text-xs font-bold bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 hover:border-red-500/30 rounded-xl transition-all cursor-pointer"
                >
                  حذف السجل نهائياً
                </button>
                <button
                  onClick={() => handleToggleResolve(selectedLog.id, selectedLog.resolved)}
                  className={`px-4 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                    selectedLog.resolved 
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' 
                      : 'bg-green-600 hover:bg-green-500 text-white border-green-500/20'
                  }`}
                >
                  {selectedLog.resolved ? 'تغيير الحالة لـ غير معالج' : 'تمييز المشكلة كمحلولة'}
                </button>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  function getClassMeta(log: ErrorLog) {
    return getClassificationStyles(log.classification);
  }
}
