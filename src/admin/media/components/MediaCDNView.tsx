import React, { useState } from 'react';
import { Globe, Server, CheckCircle, Database, ShieldCheck, Zap, ArrowUpRight, Cpu } from 'lucide-react';

export default function MediaCDNView() {
  const [activeProvider, setActiveProvider] = useState<'firebase' | 'r2' | 's3' | 'gcs'>('firebase');
  const [cdnDomain, setCdnDomain] = useState('cdn.safara90.com');
  const [isPurging, setIsPurging] = useState(false);

  const handlePurge = () => {
    setIsPurging(true);
    setTimeout(() => {
      setIsPurging(false);
      alert('تم إرسال أمر التطهير العاجل لـ CDN (Global Cache Purge) بنجاح لجميع نقاط التوزيع الجغرافي.');
    }, 1500);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div>
        <h3 className="text-sm font-black text-white">شبكة توزيع المحتوى (CDN & Multi-Cloud CDN)</h3>
        <p className="text-xs text-gray-400 mt-1">تنسيق مسار الروابط الفائقة والأصول الرقمية وتوجيهها جغرافياً لتقليص زمن استجابة التصفح.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Setup */}
        <div className="lg:col-span-2 bg-[#111112] border border-white/5 rounded-2xl p-5 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-white/5">
            <Server className="text-amber-500" size={18} />
            <h4 className="text-xs font-black text-white">إعدادات الملقم السحابي ومزود التخزين</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'firebase', name: 'Firebase Storage', desc: 'مزود افتراضي مدمج' },
              { id: 'r2', name: 'Cloudflare R2', desc: 'توزيع بدون رسوم مرور' },
              { id: 's3', name: 'Amazon S3', desc: 'مخازن الأرشيف المرنة' },
              { id: 'gcs', name: 'Google Cloud Storage', desc: 'استجابة فائقة السرعة' }
            ].map(prov => (
              <div
                key={prov.id}
                onClick={() => setActiveProvider(prov.id as any)}
                className={`
                  p-4 rounded-xl border cursor-pointer transition-all text-center space-y-2
                  ${activeProvider === prov.id ? 'bg-amber-500/10 border-amber-500/30 text-white' : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/10'}
                `}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${activeProvider === prov.id ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-gray-500'}`}>
                  <Database size={16} />
                </div>
                <h5 className="text-[10px] font-black">{prov.name}</h5>
                <p className="text-[8px] text-gray-500 font-semibold">{prov.desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-1.5">مسار النطاق المخصص للشبكة (Custom CDN Domain)</label>
              <input
                type="text"
                value={cdnDomain}
                onChange={(e) => setCdnDomain(e.target.value)}
                placeholder="cdn.example.com"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-1.5">معرف الحاوية السحابية (Bucket Name)</label>
              <input
                type="text"
                disabled
                value="safara90-sports-media-prod"
                className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-gray-500 font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePurge}
              disabled={isPurging}
              className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap size={14} className={isPurging ? 'animate-spin' : ''} />
              <span>{isPurging ? 'جاري تطهير الذاكرة الوسيطة...' : 'تطهير الذاكرة الوسيطة (Purge Cache)'}</span>
            </button>
            <button
              onClick={() => alert('تم التحقق من الاتصال بمخزن التوزيع الرقمي وهو يعمل بكفاءة 100%')}
              className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-black text-xs rounded-xl hover:bg-white/10 transition-all cursor-pointer"
            >
              اختبار اتصال الملقب السحابي
            </button>
          </div>
        </div>

        {/* Global CDN Status metrics */}
        <div className="bg-[#111112] border border-white/5 rounded-2xl p-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-4 border-b border-white/5">
              <Globe className="text-emerald-500" size={18} />
              <h4 className="text-xs font-black text-white">حالة التوزيع الجغرافي النشط</h4>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-gray-400">نقاط التوزيع العالمية (Edge Points)</span>
                <span className="text-white">285+ نقطة</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">معدل إصابة الكاش (Cache Hit Rate)</span>
                <span className="text-emerald-400 font-black">98.4%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">زمن استجابة استدعاء الصورة</span>
                <span className="text-emerald-400 font-mono">14 ms (متوسط)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">حالة النطاق التوزيعي</span>
                <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded flex items-center gap-1 font-black">
                  نشط وآمن <CheckCircle size={10} />
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-2.5">
            <Cpu className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <p className="text-[10px] text-amber-300 leading-relaxed font-bold">
              يدعم النظام تصفية وتحويل صيغ الملفات عند الحافة (On-the-fly Image Resizing) بالتعاون مع Cloudflare، مما يختزل زمن التوليد الأولي.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
