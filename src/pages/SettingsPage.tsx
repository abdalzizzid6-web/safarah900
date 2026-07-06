import React from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Bell, Shield, Paintbrush, Globe, Zap, Clock } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useNotifications, SubscriptionSettings } from '../context/NotificationContext';

const SettingGroup = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-primary/10 rounded-2xl text-primary">
        <Icon size={20} />
      </div>
      <h2 className="text-xl font-black text-white">{title}</h2>
    </div>
    <div className="grid gap-4">
      {children}
    </div>
  </div>
);

const SettingItem = ({ 
  label, 
  desc, 
  type = 'toggle', 
  value, 
  onChange 
}: { 
  label: string, 
  desc: string, 
  type?: 'toggle' | 'select',
  value?: boolean,
  onChange?: () => void
}) => (
  <div 
    className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group cursor-pointer"
    onClick={onChange}
  >
    <div className="text-right">
      <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{label}</div>
      <div className="text-[10px] text-gray-500 font-bold mt-0.5">{desc}</div>
    </div>
    {type === 'toggle' && (
      <div className={`w-12 h-6 rounded-full relative p-1 transition-colors ${value ? 'bg-primary' : 'bg-white/10'}`}>
        <motion.div 
          animate={{ x: value ? 24 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-4 h-4 bg-white rounded-full" 
        />
      </div>
    )}
  </div>
);

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { subscriptions, toggleSubscription } = useNotifications();

  return (
    <div className="space-y-12 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-white/5 rounded-3xl text-gray-400 mb-2">
          <SettingsIcon size={48} className="animate-spin-slow" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white italic">الإعدادات <span className="text-primary tracking-tighter">العامة</span></h1>
        <p className="text-gray-400 font-bold max-w-2xl mx-auto">قم بتخصيص تجربتك الفريدة في تطبيق صافرة 90 للوصول إلى أفضل أداء رياضي رقمي.</p>
      </div>

      <div className="max-w-4xl mx-auto grid gap-6">
        <SettingGroup title="التنبيهات الذكية" icon={Zap}>
          <SettingItem 
            label="تنبيهات الدوريات الذكية" 
            desc="تفعيل المزامنة التلقائية لنتائج وتنبيهات الدوريات المفضلة لديك"
            value={subscriptions.smartLeagueAlerts}
            onChange={() => toggleSubscription('smartLeagueAlerts')}
          />
          <SettingItem 
            label="صافرة البداية" 
            desc="إرسال تنبيه فور انطلاق صافرة البداية للمباريات الهامة"
            value={subscriptions.kickoff}
            onChange={() => toggleSubscription('kickoff')}
          />
        </SettingGroup>

        <SettingGroup title="تخصيص الواجهة" icon={Paintbrush}>
          <SettingItem label="الوضع الليلي" desc="تحويل الواجهة إلى الألوان الداكنة المريحة للعين" value={true} />
          <SettingItem 
            label="أداة النتائج المباشرة العائمة" 
            desc="إظهار أداة النتائج المباشرة أثناء تصفح الموقع"
            value={!!settings.liveScoreWidgetEnabled}
            onChange={() => updateSettings({ liveScoreWidgetEnabled: !settings.liveScoreWidgetEnabled })}
          />
          <SettingItem label="الخط الاحترافي" desc="استخدام خط 'Inter' الرياضي المخصص للمنصة" value={true} />
          <SettingItem label="التحكم بالأنميشن" desc="تفعيل الحركات الانتقالية السلسة بين الصفحات" value={true} />
        </SettingGroup>

        <SettingGroup title="التنبيهات الرياضية" icon={Bell}>
          <SettingItem 
            label="مباريات الفرق المفضلة فقط" 
            desc="تلقي الإشعارات وتنبيهات الأهداف للفرق التي تفضلها فقط"
            value={subscriptions.onlyFavoriteTeams}
            onChange={() => toggleSubscription('onlyFavoriteTeams')}
          />
          <SettingItem 
            label="أهداف المباريات" 
            desc="إرسال تنبيه فوري عند تسجيل الأهداف في المباريات المفضلة" 
            value={subscriptions.goals}
            onChange={() => toggleSubscription('goals')}
          />
          <SettingItem 
            label="البث المباشر" 
            desc="تنبييهات عند توفر روابط إضافية للبث المباشر عالي السرعة"
            value={subscriptions.results}
            onChange={() => toggleSubscription('results')}
          />
          <SettingItem 
            label="البطاقات الحمراء" 
            desc="متابعة حالات الطرد والإنذارات في اللحظة والثانية"
            value={subscriptions.cardsAndSubs}
            onChange={() => toggleSubscription('cardsAndSubs')}
          />
        </SettingGroup>

        <SettingGroup title="اللغة والمنطقة" icon={Globe}>
          <SettingItem label="لغة التطبيق" desc="التطبيق مهيأ حالياً باللغة العربية الافتراضية" type="select" />
          <SettingItem label="نظام المونديال" desc="تغطية المجموعات بحسب التوقيت المحلي لمنطقتك" value={true} />
        </SettingGroup>

        <SettingGroup title="الأمان والخصوصية" icon={Shield}>
          <SettingItem label="المصادقة الثنائية" desc="زيادة أمان حسابك الشخصي في المنصة" value={false} />
          <SettingItem label="حفظ سجل البحث" desc="تخزين عمليات البحث السابقة للوصول السريع" value={true} />
        </SettingGroup>
      </div>
      
      <div className="max-w-4xl mx-auto flex justify-end gap-4">
         <button className="px-8 py-4 rounded-2xl font-black text-xs text-gray-400 hover:text-white transition-all">إعادة ضبط المصنع</button>
         <button className="bg-primary text-black px-12 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-primary/20">حفظ التغييرات</button>
      </div>
    </div>
  );
}
