import React from 'react';
import { Download, Globe, Server, CheckCircle2 } from 'lucide-react';
import MainLayout from '../components/layouts/MainLayout';

const ExportManagement: React.FC = () => {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-sans tracking-tight text-white mb-8">
          إدارة التصدير والنشر 🚀
        </h1>

        <div className="bg-[#1A1D23] rounded-2xl p-6 border border-white/5 space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/20 p-3 rounded-xl shrink-0">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">تحميل نسخة الإنتاج (Production ZIP)</h2>
              <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                هذا الملف يحتوي على النسخة النهائية المجمّعة للمشروع (Build)، جاهزة للرفع المباشر للمنصات التي تدعم Node.js مثل Render، Railway، أو cPanel. تم استبعاد الملفات الزائدة مثل <code>node_modules</code>.
              </p>
              
              <div className="flex items-center gap-3">
                <a 
                  href="/export-download/safara90-production.zip" 
                 // target="_blank"
                  download="safara90-production.zip"
                  className="bg-primary hover:bg-primary-dark text-black font-bold py-3 px-6 rounded-xl transition-all inline-flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  تحميل المشروع كاملاً (ZIP)
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1D23] rounded-2xl p-6 border border-white/5 space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500/20 p-3 rounded-xl shrink-0">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">النشر على Vercel أو Netlify</h2>
              <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                إذا أردت نشر واجهة المستخدم كـ SPA (Single Page Application) بشكل مباشر:
              </p>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  قم بتحميل ملف المشروع أعلاه.
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  سجل دخولك إلى Vercel واختر "Add New Project" ثم ارفع الملف المضغوط.
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  الإعدادات: Framework Preset <code>Vite</code>، وأمر البناء <code>npm run build</code>، ومجلد الإخراج `dist`.
                </li>
              </ul>
              <div className="bg-black/30 rounded-lg p-4 font-mono text-xs text-gray-400">
                ملاحظة: إذا كان تطبيقك يحتوي على دوال Backend (كجلب الخلاصات RSS)، قد يتطلب ذلك استضافة كاملة (Node.js) أو تحويل الـ Backend إلى Vercel Serverless Functions.
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-[#1A1D23] rounded-2xl p-6 border border-white/5 space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-orange-500/20 p-3 rounded-xl shrink-0">
              <Server className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">ربط Firebase الحي (Production)</h2>
              <div className="bg-black/30 rounded-lg p-4 text-sm text-gray-300 space-y-2">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span>المشروع المرتبط حالياً:</span>
                  <span className="font-mono text-primary">ai-studio-8063f3e8-1dda-4447-afcd-1abf0dc4041d</span>
                </div>
                <div className="pt-2 text-xs text-gray-400">
                  كافة الاتصالات بقاعدة البيانات Firestore، التوثيق Auth، والـ Storage مجهزة وتعمل مباشرة في النسخة المنتجة (ZIP).
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};

export default ExportManagement;
