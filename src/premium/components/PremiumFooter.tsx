import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ShieldCheck, Heart, ExternalLink } from 'lucide-react';

export default function PremiumFooter() {
  return (
    <footer className="w-full bg-[#05080f] border-t border-white/5 pt-12 pb-8 mt-12 text-white/70" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Brand info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-black text-black shadow-lg shadow-amber-500/20 text-lg">
              90
            </div>
            <span className="text-xl font-black text-white tracking-tight">سفارة 90</span>
          </div>
          <p className="text-xs text-white/50 leading-relaxed font-medium">
            منصتك الرياضية المتكاملة لمتابعة نتائج المباريات، البث المباشر، ترتيب الدوريات، وأحدث الأخبار بأعلى معايير السرعة والدقة.
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-white uppercase tracking-wider border-r-2 border-amber-500 pr-2">روابط سريعة</h4>
          <ul className="space-y-2 text-xs font-bold text-white/60">
            <li><Link to="/" className="hover:text-amber-400 transition-colors">مباريات اليوم</Link></li>
            <li><Link to="/standings" className="hover:text-amber-400 transition-colors">ترتيب الدوريات</Link></li>
            <li><Link to="/news" className="hover:text-amber-400 transition-colors">الأخبار الرياضية</Link></li>
            <li><Link to="/leagues" className="hover:text-amber-400 transition-colors">البطولات والمنافسات</Link></li>
          </ul>
        </div>

        {/* Top Competitions */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-white uppercase tracking-wider border-r-2 border-amber-500 pr-2">أبرز البطولات</h4>
          <ul className="space-y-2 text-xs font-bold text-white/60">
            <li><Link to="/league/39" className="hover:text-amber-400 transition-colors">الدوري الإنجليزي الممتاز</Link></li>
            <li><Link to="/league/140" className="hover:text-amber-400 transition-colors">الدوري الإسباني (لا ليغا)</Link></li>
            <li><Link to="/league/2" className="hover:text-amber-400 transition-colors">دوري أبطال أوروبا</Link></li>
            <li><Link to="/league/307" className="hover:text-amber-400 transition-colors">دوري روشن السعودي</Link></li>
          </ul>
        </div>

        {/* Legal & Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-white uppercase tracking-wider border-r-2 border-amber-500 pr-2">معلومات وحقوق</h4>
          <ul className="space-y-2 text-xs font-bold text-white/60">
            <li><Link to="/privacy" className="hover:text-amber-400 transition-colors">سياسة الخصوصية</Link></li>
            <li><Link to="/terms" className="hover:text-amber-400 transition-colors">شروط الاستخدام</Link></li>
            <li><Link to="/contact" className="hover:text-amber-400 transition-colors">اتصل بنا</Link></li>
            <li><Link to="/faq" className="hover:text-amber-400 transition-colors">الأسئلة الشائعة</Link></li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
        <span>© {new Date().getFullYear()} SAFARA 90. جميع الحقوق محفوظة.</span>
        <div className="flex items-center gap-1 text-[11px]">
          <span>صُمم بشغف لعشاق كرة القدم العربية</span>
          <Heart size={12} className="text-red-500 fill-red-500" />
        </div>
      </div>
    </footer>
  );
}
