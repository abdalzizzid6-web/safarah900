import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { Moon, Sun, Palette, RotateCcw, Upload, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const PRESET_COLORS = [
  { name: 'الأخضر الماسي', value: '#00DF82' },
  { name: 'الأزرق الكهربائي', value: '#3B82F6' },
  { name: 'الذهبي الملكي', value: '#EAB308' },
  { name: 'البنفسجي الجريء', value: '#A855F7' },
  { name: 'الأحمر الناري', value: '#EF4444' },
  { name: 'البرتقالي الوهّاج', value: '#F97316' },
];

export default function ThemeSettings() {
  const { theme, updateTheme, resetTheme } = useTheme();
  const { settings, setLogo, updateSettings } = useSettings();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        
        // Resize image to max 256x256 before saving
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 256;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const resizedDataUrl = canvas.toDataURL('image/png', 0.8);
            setLogo(resizedDataUrl);
          } else {
            setLogo(dataUrl);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="glass p-6 rounded-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Palette size={18} className="text-primary" /> إعدادات المظهر
        </h3>
        <button
          onClick={resetTheme}
          className="p-2 bg-surface border border-border rounded-lg hover:border-primary transition-all text-xs flex items-center gap-1"
        >
          <RotateCcw size={12} />
          <span>افتراضي</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Logo Upload */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-bold px-1">الشعار (Logo)</label>
          <div className="flex items-center gap-4">
            <img src={settings.logoUrl || undefined} alt="Logo" className="w-12 h-12 rounded-xl object-contain border border-border" />
            <label className="cursor-pointer flex items-center gap-2 bg-surface border border-border px-4 py-2 rounded-xl text-xs font-bold hover:border-primary transition-all">
              <Upload size={14} /> رفع شعار جديد
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-bold px-1">الوضع</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateTheme({ mode: 'dark' })}
              className={cn(
                "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-sm font-bold",
                theme.mode === 'dark' 
                  ? "bg-primary/10 border-primary text-primary" 
                  : "bg-surface border-border hover:border-gray-500"
              )}
            >
              <Moon size={16} /> داكن
            </button>
            <button
              onClick={() => updateTheme({ mode: 'light' })}
              className={cn(
                "flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-sm font-bold",
                theme.mode === 'light' 
                  ? "bg-primary/10 border-primary text-primary" 
                  : "bg-surface border-border hover:border-gray-500"
              )}
            >
              <Sun size={16} /> فاتح
            </button>
          </div>
        </div>

        {/* Primary Color */}
        <div className="space-y-2 pt-2">
          <label className="text-xs text-gray-400 font-bold px-1 flex items-center justify-between">
            <span>اللون الرئيسي</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {PRESET_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => updateTheme({ primaryColor: color.value })}
                className={cn(
                  "w-10 h-10 rounded-full border-2 transition-all hover:scale-110",
                  theme.primaryColor === color.value ? "border-white shadow-[0_0_10px_var(--color-primary)]" : "border-transparent"
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
            
            <div className="relative">
              <input 
                type="color" 
                value={theme.primaryColor}
                onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                className="w-10 h-10 rounded-full opacity-0 absolute inset-0 cursor-pointer"
              />
              <div 
                className={cn(
                  "w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center pointer-events-none transition-all",
                  !PRESET_COLORS.find(c => c.value === theme.primaryColor) ? "border-white shadow-[0_0_10px_var(--color-primary)]" : "border-gray-500"
                )}
                style={{ backgroundColor: !PRESET_COLORS.find(c => c.value === theme.primaryColor) ? theme.primaryColor : 'transparent' }}
              >
                {!PRESET_COLORS.find(c => c.value === theme.primaryColor) && (
                  <Palette size={16} className="text-white mix-blend-difference" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Color */}
        <div className="space-y-2 pt-2">
          <label className="text-xs text-gray-400 font-bold px-1 flex items-center justify-between">
            <span>اللون الثانوي</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {PRESET_COLORS.map(color => (
              <button
                key={`${color.value}-sec`}
                onClick={() => updateTheme({ secondaryColor: color.value })}
                className={cn(
                  "w-10 h-10 rounded-full border-2 transition-all hover:scale-110",
                  theme.secondaryColor === color.value ? "border-white shadow-[0_0_10px_var(--color-secondary)]" : "border-transparent"
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
            
            <div className="relative">
              <input 
                type="color" 
                value={theme.secondaryColor}
                onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                className="w-10 h-10 rounded-full opacity-0 absolute inset-0 cursor-pointer"
              />
              <div 
                className={cn(
                  "w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center pointer-events-none transition-all",
                  !PRESET_COLORS.find(c => c.value === theme.secondaryColor) ? "border-white shadow-[0_0_10px_var(--color-secondary)]" : "border-gray-500"
                )}
                style={{ backgroundColor: !PRESET_COLORS.find(c => c.value === theme.secondaryColor) ? theme.secondaryColor : 'transparent' }}
              >
                {!PRESET_COLORS.find(c => c.value === theme.secondaryColor) && (
                  <Palette size={16} className="text-white mix-blend-difference" />
                )}
              </div>
            </div>
          </div>
          
          {/* Install Widget Settings */}
          <div className="space-y-4 pt-6 border-t border-border">
            <h3 className="font-bold flex items-center gap-2">
              <Smartphone size={18} className="text-primary" /> ودجت تثبيت التطبيق
            </h3>
            <label className="flex items-center justify-between cursor-pointer bg-surface p-4 rounded-xl border border-border hover:border-primary transition-all">
              <span className="text-xs font-bold text-gray-300">تفعيل الودجت</span>
              <input 
                  type="checkbox" 
                  checked={settings.installWidgetEnabled ?? true}
                  onChange={(e) => updateSettings({ installWidgetEnabled: e.target.checked })}
                  className="toggle"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
