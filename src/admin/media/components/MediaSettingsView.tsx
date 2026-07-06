import React, { useState } from 'react';
import { Settings, Shield, UserCheck, CheckCircle2, Save, Info, Key, Globe } from 'lucide-react';
import { DAMConfig } from '../types';

interface MediaSettingsViewProps {
  config: DAMConfig;
  onSaveConfig: (cfg: DAMConfig) => Promise<void>;
}

export default function MediaSettingsView({ config, onSaveConfig }: MediaSettingsViewProps) {
  const [allowedRoles, setAllowedRoles] = useState<string[]>(config.allowedRoles || ['SUPER_ADMIN', 'ADMIN', 'EDITOR']);
  const [maxUploadSize, setMaxUploadSize] = useState(config.maxUploadSize || 10); // in MB
  const [isSaving, setIsSaving] = useState(false);

  const rolesList = [
    { code: 'SUPER_ADMIN', name: 'المدير العام للمنصة (Super Admin)', desc: 'صلاحيات مطلقة لإدارة الأصول والتطهير والإتلاف' },
    { code: 'ADMIN', name: 'مدير النظام (Admin)', desc: 'رفع، تعديل، دمج الأصول وتصميم الألبومات الذكية' },
    { code: 'EDITOR', name: 'محرر رئيسي (Editor)', desc: 'رفع وتعديل الأصول دون صلاحية الدمج أو الإتلاف النهائي' },
    { code: 'MODERATOR', name: 'منسق عام (Moderator)', desc: 'إدارة الروابط الذكية والأوسمة دون تعديل ملفات الوسائط' },
    { code: 'USER', name: 'المستخدم العام (User)', desc: 'عرض وتحميل الصور الرسمية فقط' }
  ];

  const handleToggleRole = (roleCode: string) => {
    setAllowedRoles(prev => 
      prev.includes(roleCode) 
        ? prev.filter(r => r !== roleCode) 
        : [...prev, roleCode]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveConfig({
      ...config,
      allowedRoles,
      maxUploadSize
    });
    setIsSaving(false);
    alert('تم حفظ السياسات الأمنية وصلاحيات الأصول بنجاح وتعميمها على الخوادم.');
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div>
        <h3 className="text-sm font-black text-white">إعدادات النظام والسياسات الأمنية (Media Settings)</h3>
        <p className="text-xs text-gray-400 mt-1">تحديد الأدوار المخولة بالتصرف في الأصول المرفوعة، وتعيين الحدود القصوى للتلقيم السحابي.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Permission Rules Wrapper */}
        <div className="lg:col-span-2 bg-[#111112] border border-white/5 rounded-2xl p-5 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-white/5">
            <Shield className="text-amber-500" size={18} />
            <h4 className="text-xs font-black text-white">مستويات الوصول والتفويض الإداري (RBAC Policies)</h4>
          </div>

          <div className="space-y-3">
            {rolesList.map(role => {
              const hasAccess = allowedRoles.includes(role.code);

              return (
                <div 
                  key={role.code}
                  onClick={() => handleToggleRole(role.code)}
                  className={`
                    p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between
                    ${hasAccess ? 'bg-amber-500/[0.03] border-amber-500/20' : 'bg-black/40 border-white/5 opacity-60'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasAccess ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-gray-500'}`}>
                      <UserCheck size={14} />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-white">{role.name}</h5>
                      <p className="text-[10px] text-gray-400 mt-1">{role.desc}</p>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${hasAccess ? 'border-amber-500 bg-amber-500 text-black' : 'border-white/10'}`}>
                    {hasAccess && <CheckCircle2 size={12} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Limits panel */}
        <div className="bg-[#111112] border border-white/5 rounded-2xl p-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-4 border-b border-white/5">
              <Key className="text-amber-500" size={18} />
              <h4 className="text-xs font-black text-white">محددات الحجم والتلقيم السحابي</h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1.5">الحد الأقصى لحجم الملف الفردي</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={maxUploadSize}
                    onChange={(e) => setMaxUploadSize(Number(e.target.value))}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <span className="text-xs text-gray-400 font-black">ميغابايت (MB)</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1.5">أمان الملفات المرفوعة</label>
                <p className="text-[10px] text-gray-500 leading-relaxed font-bold">يقوم النظام تلقائياً بتنظيف ملفات الميديا من البرمجيات الضارة وفحص المرفقات للتأكد من مواءمتها التامة لشفرة الويب القياسية.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/[0.03]">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save size={14} />
              <span>{isSaving ? 'جاري حفظ السياسات...' : 'حفظ السياسات العامة'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
