import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Search, ShieldCheck, AlertTriangle, ChevronDown } from 'lucide-react';
import { SecurityAudit } from './hooks/useSecurityLogs';

export default function ActivityLogWidget({ audits, loading, errorString, fetchSecurityAudits }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  const filteredAudits = audits.filter((item: SecurityAudit) => {
    const matchesSearch = 
      item.ip.includes(searchTerm) || 
      item.path.includes(searchTerm) || 
      (item.reason && item.reason.includes(searchTerm)) ||
      (item.userEmail && item.userEmail.includes(searchTerm));
      
    if (typeFilter === 'all') return matchesSearch;
    return item.type === typeFilter && matchesSearch;
  });

  const getAuditBadgeColors = (type: string) => {
    switch (type) {
      case 'ssrf_attempt': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'unauthorized_access': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'validation_failure': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'api_abuse': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'authorized_access': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  const getAuditTypeLabel = (type: string) => {
    switch (type) {
      case 'ssrf_attempt': return 'محاولة هجوم SSRF';
      case 'unauthorized_access': return 'وصول غير مصرح به';
      case 'validation_failure': return 'فشل مطابقة الحقول (Zod)';
      case 'api_abuse': return 'سوء استخدام الـ API';
      case 'authorized_access': return 'وصول إداري مصرح به';
      case 'invalid_credentials': return 'رموز حماية تالفة / مجهولة';
      default: return 'عملية مراقبة نظام';
    }
  };

  return (
    <div className="bg-[#0A0A0B] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-white/5 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-[#0F0F11]">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-amber-400" />
          <h2 className="text-lg font-black text-white">سجلات المراقبة والتحصين الأمني</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              placeholder="ابحث بالنطاق أو الـ IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#151518] border border-white/5 px-4 pr-9 py-2 rounded-xl text-xs text-white placeholder-gray-500 w-full sm:w-56 focus:outline-none focus:border-amber-500/45 transition-all"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#151518] border border-white/5 px-3 py-2 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-amber-500/45 transition-all cursor-pointer"
          >
            <option value="all">كل العمليات والسجلات</option>
            <option value="ssrf_attempt">محاولات SSRF محجوبة</option>
            <option value="unauthorized_access">لوحات وصول غير مصرحة</option>
            <option value="validation_failure">أخطاء حقول Zod المرفوضة</option>
            <option value="api_abuse">مخالفات وسوء استخدام</option>
            <option value="authorized_access">الوصول المصرح (ناجح)</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-black/20">
          <div className="w-9 h-9 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-gray-400 font-semibold animate-pulse">جاري فحص جدار الحماية والاتصال بسجلات المراقبة العميقة...</p>
        </div>
      )}

      {!loading && errorString && (
        <div className="flex flex-col items-center justify-center py-16 bg-rose-500/[0.02] text-rose-300 border-b border-rose-500/10">
          <AlertTriangle size={32} className="text-rose-400 mb-3" />
          <p className="text-xs font-bold mb-1">حدث خطأ في قراءة سجلات الأمان والتحصين بالخادم</p>
          <p className="text-[11px] text-gray-500 mb-4">{errorString}</p>
          <button 
            onClick={fetchSecurityAudits}
            className="bg-rose-500/15 text-rose-300 border border-rose-500/20 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-rose-500/25 transition-all"
          >
            المحاولة مجدداً
          </button>
        </div>
      )}

      {!loading && !errorString && filteredAudits.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <ShieldCheck size={40} className="text-[#d8b4fe]/25 mb-3" />
          <p className="text-xs font-bold text-gray-400">سجل الأمان خالٍ من العمليات المطابقة</p>
          <p className="text-[10px] text-gray-500">جدار الحماية المصحح يتصدى لأي تهديدات بشكل دائم.</p>
        </div>
      )}

      {!loading && !errorString && filteredAudits.length > 0 && (
        <div className="divide-y divide-white/5">
          {filteredAudits.map((item: SecurityAudit) => {
            const isExpanded = expandedAuditId === item.id;
            return (
              <div key={item.id} className="transition-all duration-300 hover:bg-white/[0.01]">
                <div 
                  onClick={() => setExpandedAuditId(isExpanded ? null : item.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`mt-1 sm:mt-0 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold tracking-wider leading-none shrink-0 ${getAuditBadgeColors(item.type)}`}>
                      {getAuditTypeLabel(item.type)}
                    </div>
                    
                    <div className="space-y-1">
                      <code className="text-gray-100 font-mono text-[11px] sm:text-xs block text-left font-black tracking-wide" dir="ltr">
                        <span className="text-amber-500 text-[10px] ml-1 uppercase">{item.method}</span>
                        {item.path}
                      </code>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-gray-500 font-medium">
                        <span>العنوان: <span className="font-mono text-gray-400">{item.ip}</span></span>
                        <span>•</span>
                        <span>الوقت: <span className="text-gray-400">{new Date(item.timestamp).toLocaleString('ar-EG')}</span></span>
                        {item.userEmail && (
                          <>
                            <span>•</span>
                            <span className="bg-white/5 border border-white/5 text-[9px] px-1.5 py-0.5 rounded text-gray-400">
                              بواسطة: {item.userEmail} ({item.role || 'user'})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end mr-auto sm:mr-0 pl-1">
                    <span className={`text-[11px] font-bold ml-1.5 ${item.authorized ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.authorized ? 'مصرح به ✅' : 'تم الرفض والحظر 🛑'}
                    </span>
                    <ChevronDown 
                      size={14} 
                      className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-black/40 border-t border-white/5"
                    >
                      <div className="p-4 sm:p-5 space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-gray-500 font-bold block">التفسير والتقرير الأمني:</span>
                            <p className="bg-white/5 border border-white/5 p-3 rounded-xl text-gray-300 leading-relaxed font-semibold">
                              {item.reason || 'المعاملة تبدو طبيعية ومكتملة، حيث تمت مطابقة كافة قيود التحقق المركزي بنجاح وتم فحص المعاملات ببراعة.'}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <span className="text-gray-500 font-bold block">متصفح العميل (User Agent):</span>
                            <code className="bg-white/5 border border-white/5 p-3 rounded-xl text-gray-400 font-mono block leading-normal text-left break-all" dir="ltr">
                              {item.userAgent}
                            </code>
                          </div>
                        </div>

                        {item.bodySample && (
                          <div className="space-y-2">
                            <span className="text-gray-500 font-bold block">عينة البيانات المستلمة (Payload Sample):</span>
                            <pre className="bg-[#111114] border border-white/5 p-3.5 rounded-xl text-amber-500 font-mono block overflow-x-auto text-left leading-normal" dir="ltr">
                              {item.bodySample}
                            </pre>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
