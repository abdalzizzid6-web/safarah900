import React, { useState, useEffect } from 'react';
import { Key, Shield, Plus, Lock, CheckCircle2, AlertCircle, RefreshCw, X, Eye, EyeOff } from 'lucide-react';

interface PlatformStatus {
  configured: boolean;
  fields: Record<string, string>;
}

const ApiKeyManager: React.FC = () => {
  const [platformStatus, setPlatformStatus] = useState<Record<string, PlatformStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const platforms = [
    { id: 'facebook', name: 'Facebook Pages', requiredKeys: ['clientId', 'clientSecret'] },
    { id: 'instagram', name: 'Instagram Business', requiredKeys: ['clientId', 'clientSecret'] },
    { id: 'twitter', name: 'X (Twitter)', requiredKeys: ['clientId', 'clientSecret'] },
    { id: 'telegram', name: 'Telegram Bot', requiredKeys: ['botToken', 'chatId'] },
    { id: 'youtube', name: 'YouTube API', requiredKeys: ['clientId', 'clientSecret', 'apiKey'] },
    { id: 'tiktok', name: 'TikTok API', requiredKeys: ['clientId', 'clientSecret'] },
    { id: 'threads', name: 'Threads API', requiredKeys: ['clientId', 'clientSecret'] },
    { id: 'linkedin', name: 'LinkedIn API', requiredKeys: ['clientId', 'clientSecret'] },
    { id: 'discord', name: 'Discord Webhook', requiredKeys: ['webhookUrl'] },
    { id: 'wordpress', name: 'WordPress REST', requiredKeys: ['siteUrl', 'username', 'applicationPassword'] },
    { id: 'google', name: 'Google Business Profile', requiredKeys: ['clientId', 'clientSecret'] }
  ];

  const fetchKeyStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social/apikeys');
      if (response.ok) {
        const data = await response.json();
        setPlatformStatus(data.status || {});
      }
    } catch (err) {
      console.error('Failed to fetch API key statuses', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeyStatus();
  }, []);

  const handleOpenKeysModal = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return;
    
    setSelectedPlatform(platformId);
    
    // Pre-populate empty fields
    const initialFields: Record<string, string> = {};
    platform.requiredKeys.forEach(k => {
      initialFields[k] = '';
    });
    setFormFields(initialFields);
    setShowModal(true);
  };

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setToast(null);
    
    try {
      const response = await fetch('/api/social/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          keys: formFields
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setToast({ message: `تم حفظ مفاتيح منصة ${selectedPlatform.toUpperCase()} وتشفيرها بنجاح`, type: 'success' });
        setShowModal(false);
        fetchKeyStatus();
      } else {
        setToast({ message: data.error || 'فشل حفظ المفاتيح', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'حدث خطأ غير متوقع', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFriendlyKeyLabel = (key: string): string => {
    const labels: Record<string, string> = {
      clientId: 'معرف العميل (Client ID)',
      clientSecret: 'الرمز السري للعميل (Client Secret)',
      botToken: 'رمز توثيق البوت (Bot Token)',
      chatId: 'معرف القناة أو الدردشة (Chat ID / Handle)',
      apiKey: 'مفتاح الـ API (API Key)',
      webhookUrl: 'عنوان ويبهوك ديسكورد (Discord Webhook URL)',
      siteUrl: 'رابط موقع ووردبريس (WordPress Site URL)',
      username: 'اسم مستخدم المسؤول (Username)',
      applicationPassword: 'كلمة مرور التطبيق المشفرة (Application Password)'
    };
    return labels[key] || key;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Key className="w-6 h-6 text-primary" />
          إدارة مفاتيح API والاعتمادات
        </h2>
        <button 
          onClick={fetchKeyStatus}
          disabled={isLoading}
          className="p-2 rounded-lg bg-surface-elevated text-gray-400 hover:text-white border border-white/5 disabled:opacity-50"
          title="تحديث الحالة"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {toast && (
        <div className={`p-4 rounded-xl flex gap-3 text-sm border ${
          toast.type === 'success' 
            ? 'bg-green-900/20 border-green-500/30 text-green-200' 
            : 'bg-red-900/20 border-red-500/30 text-red-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          )}
          <p>{toast.message}</p>
        </div>
      )}

      <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-xl p-4 flex gap-3 text-yellow-200">
        <Shield className="w-5 h-5 shrink-0 text-yellow-500" />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold text-yellow-400 mb-1">تشفير وحماية المؤسسة (Enterprise Security)</p>
          <p>
            تعتمد المنصة على معيار التشفير العسكري <strong>AES-256-GCM</strong> لتشفير جميع الاعتمادات والمفاتيح محلياً قبل حفظها بصفة دائمة في قاعدة بيانات Firestore. لا يتم فك تشفيرها مطلقاً إلا داخل بيئة الخادم الآمنة (Server-Side) لحظة التواصل المباشر مع المنصات.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-surface rounded-xl border border-white/5 p-6 animate-pulse h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map(platform => {
            const status = platformStatus[platform.id] || { configured: false, fields: {} };
            return (
              <div key={platform.id} className="bg-surface rounded-xl border border-white/5 p-6 flex flex-col justify-between hover:border-primary/20 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-white">{platform.name}</h3>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                      status.configured 
                        ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {status.configured ? 'مُعد وآمن' : 'غير مُعد'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    مفاتيح الربط والاعتمادات اللازمة لتفعيل النشر والتكامل التلقائي مع حسابات {platform.name}.
                  </p>
                </div>
                
                <button 
                  onClick={() => handleOpenKeysModal(platform.id)}
                  className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                    status.configured 
                      ? 'bg-surface-elevated hover:bg-surface-elevated/80 text-white border border-white/10' 
                      : 'bg-primary text-black hover:bg-primary-hover'
                  }`}
                >
                  {status.configured ? (
                    <>
                      <Lock className="w-4 h-4 text-green-400" />
                      تحديث المفاتيح الآمنة
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      إعداد المفاتيح الآمنة
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* API Key Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface rounded-2xl border border-white/10 w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-elevated">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                إعداد مفاتيح {platforms.find(p => p.id === selectedPlatform)?.name}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveKeys}>
              <div className="p-6 space-y-4">
                <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3 text-blue-200 text-xs flex gap-2">
                  <Shield className="w-4 h-4 shrink-0 text-blue-400" />
                  <p>تخضع جميع المدخلات للتشفير الثنائي بالخادم ولن تظهر بشكل مقروء في واجهة المستخدم مجدداً.</p>
                </div>
                
                {Object.keys(formFields).map(fieldName => (
                  <div key={fieldName} className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">
                      {getFriendlyKeyLabel(fieldName)}
                    </label>
                    <div className="relative">
                      <input 
                        type={showValues[fieldName] ? 'text' : 'password'}
                        required
                        value={formFields[fieldName]}
                        onChange={e => setFormFields({...formFields, [fieldName]: e.target.value})}
                        placeholder={`أدخل ${getFriendlyKeyLabel(fieldName)}...`}
                        className="w-full bg-surface-elevated text-white border border-white/10 rounded-lg py-2 pl-10 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowValues({...showValues, [fieldName]: !showValues[fieldName]})}
                        className="absolute left-3 top-2.5 text-gray-400 hover:text-white"
                      >
                        {showValues[fieldName] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-surface-elevated">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface hover:bg-surface/80 border border-white/5 text-gray-400 hover:text-white text-sm font-semibold"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-primary text-black hover:bg-primary-hover text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري الحفظ والتشفيير...
                    </>
                  ) : (
                    'تشفير وحفظ المفاتيح'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManager;
