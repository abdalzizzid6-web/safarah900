import React from 'react';
import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useBranding } from '../contexts/BrandingContext';

export default function Footer() {
  const { settings } = useSettings();
  const branding = useBranding();
  
  return (
    <footer className="bg-black/40 border-t border-border pt-12 pb-24 md:pb-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={branding.logos.mainLogo || undefined} alt={branding.siteName} className="w-8 h-8 rounded-lg object-contain bg-black/40" />
            <span className="text-xl font-black tracking-tighter uppercase">
              {branding.siteName}
            </span>
          </Link>
          <p className="text-gray-500 text-sm max-w-xs">
            أول موقع رياضي عربي يقدم تغطية شاملة ومباشرة لكافة البطولات العالمية والمحلية بإحصائيات حية وتوقعات الذكاء الاصطناعي.
          </p>
          <div className="flex items-center gap-2 mt-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs py-1.5 px-3 rounded-xl w-fit font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>تغطية ترجمة أسماء الفرق للغة العربية: 100%</span>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">روابط سريعة</h4>
          <ul className="space-y-2 text-sm text-gray-400 font-medium">
            <li><Link to="/#live" className="hover:text-primary transition-colors">مباريات مباشرة</Link></li>
            <li><Link to="/#upcoming" className="hover:text-primary transition-colors">المباريات القادمة</Link></li>
            <li><Link to="/#results" className="hover:text-primary transition-colors">نتائج المباريات</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">منصة صافرة 90</h4>
          <ul className="space-y-2 text-sm text-gray-400 font-medium">
            <li><Link to="/about" className="hover:text-primary transition-colors">من نحن</Link></li>
            <li><Link to="/contact" className="hover:text-primary transition-colors">اتصل بنا</Link></li>
            <li><Link to="/privacy" className="hover:text-primary transition-colors">سياسة الخصوصية</Link></li>
            <li><Link to="/cookies" className="hover:text-primary transition-colors">سياسة الكوكيز</Link></li>
            <li><Link to="/terms" className="hover:text-primary transition-colors">الشروط والأحكام</Link></li>
            <li><Link to="/disclaimer" className="hover:text-primary transition-colors">إخلاء المسؤولية</Link></li>
            <li><Link to="/advertising" className="hover:text-primary transition-colors">الناشرون والإعلانات</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-600 font-black uppercase tracking-widest">
        <p>© 2026 {settings.appName || 'Safara 90'}. جميع الحقوق محفوظة</p>
        <div className="flex gap-6">
          <Link to="/sitemap" className="hover:text-gray-400">خريطة الموقع</Link>
          <Link to="/privacy" className="hover:text-gray-400">الخصوصية</Link>
          <Link to="/terms" className="hover:text-gray-400">الشروط</Link>
          <Link to="/about" className="hover:text-gray-400">حول</Link>
        </div>
      </div>
    </footer>
  );
}
