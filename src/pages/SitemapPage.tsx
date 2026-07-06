import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Home, 
  Calendar, 
  TrendingUp, 
  Tv, 
  Award, 
  Download, 
  User, 
  Heart, 
  Activity, 
  Cpu, 
  Terminal, 
  ShieldAlert, 
  Sliders, 
  FileText, 
  Layout, 
  Compass, 
  Flame,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import SEO from '../components/SEO';
import { matchService } from '../services/matchService';
import { Match } from '../types';

interface SitemapLink {
  path: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface SitemapCategory {
  title: string;
  icon: React.ReactNode;
  description: string;
  links: SitemapLink[];
}

export default function SitemapPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const matchesData = await matchService.getRealFirestoreMatches();
        setMatches(matchesData || []);
      } catch (err) {
        console.error('Failed to fetch sitemap data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const categories: SitemapCategory[] = [
    {
      title: "الرئيسية والمباريات المباشرة",
      icon: <Tv className="w-5 h-5 text-primary" />,
      description: "المباريات المباشرة ونتائج المباريات وتوقعات المحللين الرياضيين بالذكاء الاصطناعي.",
      links: [
        { 
          path: "/", 
          label: "الصفحة الرئيسية", 
          desc: "البث المباشر، مباريات اليوم، الغد، والأمس مع تغطية شاملة.", 
          icon: <Home className="w-4 h-4 text-emerald-400" /> 
        },
        { 
          path: "/schedule", 
          label: "جدول المباريات بالتفصيل", 
          desc: "عرض تفاصيل وأوقات كافة المباريات وتصفيتها حسب البطولة واليوم.", 
          icon: <Calendar className="w-4 h-4 text-emerald-400" />,
          badge: "محدث مباشر"
        },
        { 
          path: "/leagues", 
          label: "دليل البطولات", 
          desc: "قائمة كاملة بالدوريات العالمية والمحلية والبطولات القارية الكبرى.", 
          icon: <Award className="w-4 h-4 text-emerald-400" /> 
        }
      ]
    },
    {
      title: "خدمات المشجع والتطبيق",
      icon: <Compass className="w-5 h-5 text-blue-400" />,
      description: "تنزيل التطبيق وإدارة حسابك والتفضيلات الرياضية المفعلة لديك.",
      links: [
        { 
          path: "/download", 
          label: "تنزيل التطبيق APK / PWA", 
          desc: "حمل تطبيق صافرة 90 V2 السريع للاندرويد ووفر تصفح مميز فائق السرعة بدون إعلانات.", 
          icon: <Download className="w-4 h-4 text-blue-400" />,
          badge: "نسخة أندرويد"
        },
        { 
          path: "/profile", 
          label: "الملف الشخصي الرياضي", 
          desc: "إدارة تفضيلات الإشعارات للأهداف الرياضية، واختيار الدوريات المفضلة.", 
          icon: <User className="w-4 h-4 text-blue-400" /> 
        }
      ]
    },
    {
      title: "أدوات مـطورة واختبارات الأداء",
      icon: <Terminal className="w-5 h-5 text-amber-500" />,
      description: "فحص جودة الاتصال بمزود البيانات الرياضية ومزامنة التحليلات المتقدمة.",
      links: [
        { 
          path: "/brand", 
          label: "نظام الهوية البصرية (Brand)", 
          desc: "دليل الهوية الكامل، أنظمة الألوان، المكونات القياسية والتصميم البصري للتطبيق.", 
          icon: <Layout className="w-4 h-4 text-amber-500" /> 
        },
        { 
          path: "/football-debug", 
          label: "مصحح الأخطاء (Football Debug)", 
          desc: "شاشة تقنية تتيح للمطور فحص بيانات المباريات محلياً واكتشاف الاختلافات.", 
          icon: <Activity className="w-4 h-4 text-amber-500" /> 
        },
        { 
          path: "/test-match", 
          label: "منصة مباريات غيمي الذاتية", 
          desc: "بيئة محاكاة واختبار الأهداف، الكروت، ومجريات البث الحي قبل إطلاقها.", 
          icon: <Flame className="w-4 h-4 text-amber-500" /> 
        },
        { 
          path: "/apifootball-test", 
          label: "فحص واجهات الرياضة المباشرة", 
          desc: "منصة اختبار استدعاءات API Connection والتحقق مع الـ API-Football.", 
          icon: <Cpu className="w-4 h-4 text-amber-500" /> 
        }
      ]
    },
    {
      title: "لوحات التحكم وحالة الخادم",
      icon: <Sliders className="w-5 h-5 text-rose-500" />,
      description: "مركز الإشراف والمراقبة للبيانات وسير الأداء والتوجيهات السحابية.",
      links: [
        { 
          path: "/admin", 
          label: "لوحة التحكم الإدارية", 
          desc: "إدارة سيرفرات البث، تعديل مواعيد المباريات، التحكم بالإشعارات وقاعدة البيانات السحابية.", 
          icon: <Sliders className="w-4 h-4 text-rose-500" />,
          badge: "عرض تجريبي",
          badgeColor: "bg-red-500/10 text-rose-400"
        },
        { 
          path: "/admin/system-health", 
          label: "حالة النظام التفصيلية", 
          desc: "مراقبة حيّة لاتصال Firebase وGemini API واستهلاك كوتا البيانات الرياضية في الوقت الفعلي.", 
          icon: <ShieldAlert className="w-4 h-4 text-rose-500" /> 
        }
      ]
    }
  ];

  // Dynamic Content links
  const matchLinks: SitemapLink[] = matches.slice(0, 8).map(m => {
    const homeName = typeof m.homeTeam === 'object' ? (m.homeTeam?.name || '') : (m.homeTeam || '');
    const awayName = typeof m.awayTeam === 'object' ? (m.awayTeam?.name || '') : (m.awayTeam || '');
    const leagueName = typeof m.league === 'object' ? (m.league?.name || '') : (m.league || 'كرة القدم');
    return {
      path: `/match/${m.id}`,
      label: `${homeName} vs ${awayName}`,
      desc: `بث مباشر وتفاصيل مباراة ${homeName} ضد ${awayName} في بطولة ${leagueName}.`,
      icon: <Tv className="w-4 h-4 text-emerald-400" />,
      badge: m.isLive ? "مباشر الآن" : "تفاصيل"
    };
  });

  // Schema structured data for SEO indexing
  const sitemapSchema = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "name": "خريطة موقع صافرة 90 V2",
    "description": "خريطة تنقل شاملة لجميع أقسام ومحتويات وتفاصيل ومباريات موقع صافرة 90 العريق.",
    "url": window.location.href,
    "hasPart": [
      ...categories.flatMap(cat => cat.links.map(link => ({
        "@type": "WebPage",
        "name": link.label,
        "description": link.desc,
        "url": `${window.location.origin}${link.path}`
      }))),
      ...matchLinks.map(link => ({
        "@type": "WebPage",
        "name": link.label,
        "description": link.desc,
        "url": `${window.location.origin}${link.path}`
      }))
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 md:px-8">
      <SEO 
        title="خريطة الموقع الشاملة - دليل الأقسام" 
        description="تصفح جميع أقسام وتفاصيل صافرة 90 V2. تصفية شاملة لجدول المباريات، البطولات، الأخبار، لوحة التحكم الإدارية، وخوادم الاتصال مباشرة."
        schema={sitemapSchema}
      />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black tracking-widest uppercase">
            🌎 خريطة الموقع / Navigation Guide
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
            خريطة الموقع الشاملة
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            دليلك التفاعلي السريع للوصول إلى كافة الأقسام، صفحات المباريات، لوحات التحكم، والخدمات التقنية المتاحة على منصة صافرة 90 V2 للذكاء الاصطناعي الكروي.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-slate-400 text-sm font-medium">جاري تحليل بيانات الموقع وتوليد الروابط...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {categories.map((cat, catIdx) => (
              <SitemapCategoryCard key={catIdx} category={cat} index={catIdx} />
            ))}

            {matchLinks.length > 0 && (
              <SitemapCategoryCard 
                category={{
                  title: "مباريات جارية ومجدولة",
                  icon: <Activity className="w-5 h-5 text-emerald-400" />,
                  description: "روابط مباشرة لأبرز المواجهات الرياضية الحالية في قاعدة البيانات.",
                  links: matchLinks
                }} 
                index={4} 
              />
            )}
          </div>
        )}

        {/* Dynamic Static XML Helper Section for human inspect */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-slate-900/20 border border-slate-800/60 rounded-3xl p-6 md:p-8 text-center space-y-4 max-w-xl mx-auto"
        >
          <div className="inline-block p-3 bg-slate-950 border border-slate-800 rounded-2xl text-emerald-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">ملف sitemap.xml لمحركات البحث</h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
            تم أيضاً إدراج وتهيئة ملف الفهرسة التقني ليتطابق بالكامل مع بروتوكولات Google Search Console وBing Webmaster للحصول على تهيئة SEO مثالية وأرشفة فورية للمباريات.
          </p>
          <a 
            href="/sitemap.xml" 
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
          >
            استعراض ملف sitemap.xml المباشر
            <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </a>
        </motion.div>
      </div>
    </div>
  );
}

function SitemapCategoryCard({ category, index }: { category: SitemapCategory; index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-slate-900/40 border border-slate-800/40 rounded-3xl p-6 space-y-6 flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* Category Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800/40 border border-slate-700/30 rounded-2xl">
            {category.icon}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-200">{category.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{category.description}</p>
          </div>
        </div>

        {/* Connection Line */}
        <div className="h-px bg-gradient-to-r from-slate-800 via-transparent to-transparent" />

        {/* Links list */}
        <div className="space-y-3 pt-2">
          {category.links.map((link, linkIdx) => (
            <Link 
              key={linkIdx}
              to={link.path}
              className="group flex items-start gap-3 p-3 bg-slate-950/40 hover:bg-slate-900 border border-slate-800/30 hover:border-slate-700/65 rounded-2xl transition-all duration-300 cursor-pointer"
            >
              <div className="p-2 bg-slate-900 group-hover:bg-slate-950 border border-slate-800 rounded-xl mt-0.5 group-hover:scale-105 transition-transform duration-300 shrink-0">
                {link.icon}
              </div>
              <div className="flex-1 space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-300 group-hover:text-primary transition-colors truncate">
                    {link.label}
                  </span>
                  {link.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${link.badgeColor || 'bg-primary/10 text-primary'} whitespace-nowrap`}>
                      {link.badge}
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs font-normal leading-relaxed line-clamp-2">
                  {link.desc}
                </p>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-500 self-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 rtl:rotate-180 shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
