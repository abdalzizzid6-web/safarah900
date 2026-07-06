import React, { useState, useEffect } from 'react';
import { 
  Globe, Languages, Sparkles, RefreshCw, Save, 
  Search, Filter, CheckCircle2, AlertCircle, 
  Settings, History, Zap, FileText, Brain
} from 'lucide-react';

interface TranslationJob {
  id: string;
  sourceText: string;
  targetText: string;
  type: 'player_bio' | 'team_history' | 'match_report' | 'news';
  status: 'completed' | 'manual_review' | 'failed';
  model: string;
  timestamp: string;
}

export default function TranslationManager() {
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulating loading translation history
    const mockJobs: TranslationJob[] = [
      {
        id: 'j1',
        sourceText: 'Manchester City secured a vital win against Arsenal...',
        targetText: 'حقق مانشستر سيتي فوزاً حيوياً أمام آرسنال...',
        type: 'news',
        status: 'completed',
        model: 'Gemini 1.5 Pro',
        timestamp: new Date().toISOString()
      },
      {
        id: 'j2',
        sourceText: 'Erling Haaland stats for the current season include...',
        targetText: 'تتضمن إحصائيات إيرلينج هالاند للموسم الحالي...',
        type: 'player_bio',
        status: 'manual_review',
        model: 'Gemini 1.5 Flash',
        timestamp: new Date().toISOString()
      }
    ];
    setJobs(mockJobs);
    setIsLoading(false);
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Languages className="text-blue-500" />
            مركز الترجمة والتعريب الآلي (AI Translation Hub)
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            إدارة عمليات الترجمة الفورية للمحتوى الرياضي، مراجعة المصطلحات الفنية، وضبط نماذج الذكاء الاصطناعي.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
            <Sparkles size={18} />
            ترجمة محتوى جديد
          </button>
        </div>
      </div>

      {/* Models Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111112] border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <History size={16} className="text-gray-500" />
                سجل عمليات الترجمة الأخيرة
              </h3>
              <div className="flex items-center gap-2">
                <Search className="text-gray-500" size={14} />
                <input type="text" placeholder="البحث في السجلات..." className="bg-transparent border-none text-xs text-white focus:outline-none w-32" />
              </div>
            </div>
            
            <div className="divide-y divide-white/5">
              {jobs.map(job => (
                <div key={job.id} className="p-6 hover:bg-white/[0.02] transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${job.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{job.type}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-600">{new Date(job.timestamp).toLocaleString('ar-EG')}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <span className="text-[10px] text-gray-500 font-bold">Source (English)</span>
                      <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-xs text-gray-400 font-sans leading-relaxed">
                        {job.sourceText}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] text-blue-500 font-bold">Target (Arabic)</span>
                      <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl text-xs text-blue-100 leading-relaxed">
                        {job.targetText}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                         <Brain size={12} />
                         <span>Model: {job.model}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-[10px] font-black text-white hover:text-blue-400 transition-all">تعديل يدوي</button>
                      <div className="w-px h-3 bg-white/10" />
                      <button className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 transition-all">اعتماد</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#111112] border border-white/5 p-6 rounded-3xl space-y-6">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Settings size={16} className="text-gray-500" />
              إعدادات محرك الترجمة
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-black uppercase">النموذج الافتراضي</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white">
                  <option>Gemini 1.5 Pro (الأكثر دقة)</option>
                  <option>Gemini 1.5 Flash (الأسرع)</option>
                  <option>GPT-4o (احتياطي)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 font-black uppercase">نبرة الترجمة (Tone)</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white">
                  <option>رياضي احترافي</option>
                  <option>صحفي إخباري</option>
                  <option>حماسي / تشجيعي</option>
                </select>
              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-amber-500" />
                  <span className="text-[11px] font-black text-amber-500">التعريب التلقائي</span>
                </div>
                <p className="text-[10px] text-amber-500/70 leading-relaxed">
                  عند تفعيل هذا الخيار، سيتم تعريب أسماء اللاعبين والفرق غير الموجودة في قاعدة البيانات تلقائياً وحفظها في القاموس التقني.
                </p>
                <div className="mt-3 flex items-center justify-between">
                   <span className="text-[10px] text-white font-bold">الحالة: نشط</span>
                   <div className="w-8 h-4 bg-amber-600 rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-0.5 w-3 h-3 bg-white rounded-full translate-x-4" />
                   </div>
                </div>
              </div>
            </div>

            <button className="w-full bg-white text-black font-black text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              <Save size={16} />
              حفظ التكوينات
            </button>
          </div>

          <div className="bg-[#111112] border border-white/5 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Globe size={16} className="text-emerald-500" />
              إحصائيات استهلاك الـ API
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Tokens المستهلكة اليوم</span>
                <span className="text-white font-mono">142,500</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="w-[45%] h-full bg-emerald-500 rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>الميزانية اليومية</span>
                <span>300,000 Tokens</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
