import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Smartphone, 
  Globe, 
  Megaphone, 
  Save, 
  Upload, 
  Image as ImageIcon,
  Check,
  Loader2
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useError } from '../../context/ErrorContext';

type Tab = 'branding' | 'widget' | 'ads' | 'seo';

export default function SettingsManager() {
  const { settings, updateSettings, setLogo } = useSettings();
  const { showToast } = useError();
  const [activeTab, setActiveTab] = useState<Tab>('branding');
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...settings });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(localSettings);
      showToast('تم حفظ الإعدادات بنجاح', 'success');
    } catch (error) {
      console.error(error);
      showToast('خطأ في حفظ الإعدادات', 'error');
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: 'branding', label: 'الهوية البصرية', icon: Palette },
    { id: 'widget', label: 'ودجت التثبيت', icon: Smartphone },
    { id: 'ads', label: 'إعدادات الإعلانات', icon: Megaphone },
    { id: 'seo', label: 'محركات البحث', icon: Globe },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">إعدادات المنصة</h2>
          <p className="text-gray-400 text-sm">إدارة الهوية، الإعلانات، والظهور في محركات البحث</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-primary text-black rounded-xl hover:bg-primary/90 transition-all font-black shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>حفظ كافة التغييرات</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Mini */}
        <div className="lg:col-span-1 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
                activeTab === item.id 
                ? 'bg-primary text-black font-black shadow-lg shadow-primary/10' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-surface border border-white/5 rounded-3xl p-8 min-h-[500px]">
            {activeTab === 'branding' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-400">اسم التطبيق</label>
                    <input 
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-all"
                      value={localSettings.appName}
                      onChange={e => setLocalSettings({...localSettings, appName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-400">اللون الرئيسي</label>
                    <div className="flex gap-4">
                      <input 
                        type="color"
                        className="w-16 h-12 bg-white/5 border border-white/10 rounded-xl p-1 cursor-pointer"
                        value={localSettings.primaryColor || '#D4AF37'}
                        onChange={e => setLocalSettings({...localSettings, primaryColor: e.target.value})}
                      />
                      <input 
                        type="text"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono"
                        value={localSettings.primaryColor || '#D4AF37'}
                        onChange={e => setLocalSettings({...localSettings, primaryColor: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ImageIcon size={20} className="text-primary" />
                    الشعار والأيقونة
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center gap-4">
                      <p className="text-sm font-bold">شعار الموقع (Logo)</p>
                      <div className="w-full h-32 bg-black/40 rounded-xl flex items-center justify-center overflow-hidden border border-white/5">
                        <img src={localSettings.logoUrl} className="max-h-24 object-contain" alt="Logo preview" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="رابط الشعار أو base64"
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs"
                        value={localSettings.logoUrl}
                        onChange={e => {
                          setLocalSettings({...localSettings, logoUrl: e.target.value});
                          setLogo(e.target.value);
                        }}
                      />
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center gap-4">
                      <p className="text-sm font-bold">أيقونة التطبيق (App Icon)</p>
                      <div className="w-24 h-24 bg-black/40 rounded-3xl flex items-center justify-center overflow-hidden border border-white/5 shadow-xl">
                        <img src={localSettings.iconUrl || localSettings.logoUrl} className="w-16 h-16 object-contain" alt="Icon preview" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="رابط الأيقونة"
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs"
                        value={localSettings.iconUrl}
                        onChange={e => setLocalSettings({...localSettings, iconUrl: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'widget' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <h3 className="font-black">تفعيل ودجت التثبيت</h3>
                    <p className="text-xs text-gray-500 mt-1">إظهار لافتة ذكية للمستخدمين لحثهم على تثبيت التطبيق (PWA)</p>
                  </div>
                  <input 
                    type="checkbox"
                    className="w-12 h-6 rounded-full bg-gray-600 appearance-none checked:bg-primary transition-all relative after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all checked:after:left-7 cursor-pointer"
                    checked={localSettings.installWidgetEnabled}
                    onChange={e => setLocalSettings({...localSettings, installWidgetEnabled: e.target.checked})}
                  />
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-400">نص التثبيت</label>
                    <input 
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                      value={localSettings.installWidgetText}
                      onChange={e => setLocalSettings({...localSettings, installWidgetText: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-400">موضع الودجت</label>
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                        value={localSettings.installWidgetPosition}
                        onChange={e => setLocalSettings({...localSettings, installWidgetPosition: e.target.value})}
                      >
                        <option value="bottom-left">أسفل اليسار</option>
                        <option value="bottom-right">أسفل اليمين</option>
                        <option value="top-left">أعلى اليسار</option>
                        <option value="top-right">أعلى اليمين</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-400">إعادة الظهور (ساعات)</label>
                      <input 
                        type="number"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                        value={localSettings.installWidgetDismissDelayHours}
                        onChange={e => setLocalSettings({...localSettings, installWidgetDismissDelayHours: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ads' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <h3 className="font-black">تفعيل Google AdSense</h3>
                    <p className="text-xs text-gray-500 mt-1">تشغيل الإعلانات على المستوى العام للمنصة</p>
                  </div>
                  <input 
                    type="checkbox"
                    className="w-12 h-6 rounded-full bg-gray-600 appearance-none checked:bg-primary transition-all relative after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all checked:after:left-7 cursor-pointer"
                    checked={localSettings.adsEnabled}
                    onChange={e => setLocalSettings({...localSettings, adsEnabled: e.target.checked})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-400">AdSense Publisher ID</label>
                    <input 
                      type="text"
                      placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono"
                      value={localSettings.adPublisherId}
                      onChange={e => setLocalSettings({...localSettings, adPublisherId: e.target.value})}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-400">AdMob App ID (للتطبيق)</label>
                    <input 
                      type="text"
                      placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono"
                      value={localSettings.admobAppId}
                      onChange={e => setLocalSettings({...localSettings, admobAppId: e.target.value})}
                    />
                  </div>
                </div>
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-200 text-xs leading-relaxed">
                  تنبيه: تأكد من إضافة رابط الموقع إلى ملف ads.txt الخاص بك في جذر الموقع لضمان عمل الإعلانات بشكل سليم.
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                 <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-400">وصف المنصة (Meta Description)</label>
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[100px] focus:border-primary focus:outline-none"
                      placeholder="وصف مختصر يظهر في محركات البحث..."
                      value={(localSettings as any).metaDescription || ''}
                      onChange={e => setLocalSettings({...localSettings, metaDescription: e.target.value} as any)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-400">Google Search Console Tag</label>
                      <input 
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs"
                        placeholder="google-site-verification=..."
                        value={(localSettings as any).googleVerification || ''}
                        onChange={e => setLocalSettings({...localSettings, googleVerification: e.target.value} as any)}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-400">Bing Webmaster Tools</label>
                      <input 
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs"
                        value={(localSettings as any).bingVerification || ''}
                        onChange={e => setLocalSettings({...localSettings, bingVerification: e.target.value} as any)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
