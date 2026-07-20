import React, { useState, useEffect } from 'react';
import { 
  Plus, AlertCircle, Trash2, 
  RefreshCw, CheckCircle2, ShieldAlert, ExternalLink, Globe, MessageSquare, Bot, AlertTriangle, Send 
} from 'lucide-react';

const Facebook = (props: React.SVGProps<SVGSVGElement> & { size?: number }) => {
  const size = props.size || 24;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
};

const Instagram = (props: React.SVGProps<SVGSVGElement> & { size?: number }) => {
  const size = props.size || 24;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
};

const Twitter = (props: React.SVGProps<SVGSVGElement> & { size?: number }) => {
  const size = props.size || 24;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
};

const Youtube = (props: React.SVGProps<SVGSVGElement> & { size?: number }) => {
  const size = props.size || 24;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  );
};

interface ConnectedAccount {
  id: string;
  platform: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  status: 'active' | 'expired' | 'disconnected' | 'error';
  permissions: string[];
  tokenExpiresAt?: string;
  pages?: Array<{ id: string; name: string; category?: string; avatarUrl?: string }>;
}

const ConnectedAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [manualFields, setManualFields] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'failed', msg: string }>>({});
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const platforms = [
    { id: 'facebook', name: 'Facebook Pages', icon: Facebook, isManual: false },
    { id: 'instagram', name: 'Instagram Business', icon: Instagram, isManual: false },
    { id: 'twitter', name: 'X (Twitter)', icon: Twitter, isManual: false },
    { id: 'linkedin', name: 'LinkedIn', icon: Globe, isManual: false },
    { id: 'youtube', name: 'YouTube Channel', icon: Youtube, isManual: false },
    { id: 'telegram', name: 'Telegram Bot/Channel', icon: Send, isManual: true, requiredFields: [
      { name: 'botToken', label: 'رمز توثيق البوت (Bot Token)', placeholder: '123456:ABC-DEF...' },
      { name: 'chatId', label: 'معرف القناة أو الدردشة (Chat ID/Handle)', placeholder: '@safara_90_channel أو -100123456' }
    ]},
    { id: 'discord', name: 'Discord Webhook', icon: MessageSquare, isManual: true, requiredFields: [
      { name: 'webhookUrl', label: 'رابط ويبهوك ديسكورد (Webhook URL)', placeholder: 'https://discord.com/api/webhooks/...' }
    ]},
    { id: 'wordpress', name: 'WordPress REST', icon: Globe, isManual: true, requiredFields: [
      { name: 'siteUrl', label: 'رابط الموقع الرئيسي (WordPress Site URL)', placeholder: 'https://korea90.xyz' },
      { name: 'username', label: 'اسم المستخدم المسؤول', placeholder: 'admin' },
      { name: 'token', label: 'كلمة مرور التطبيق (Application Password)', placeholder: 'xxxx xxxx xxxx xxxx' }
    ]}
  ];

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();

    // Listen for OAuth Success Messages from popup
    const handleOAuthSuccess = (event: MessageEvent) => {
      const origin = event.origin;
      if (origin !== window.location.origin && !origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setToast({ message: 'تم ربط الحساب وتوثيقه بنجاح عبر بروتوكول OAuth 2.0!', type: 'success' });
        fetchAccounts();
      }
    };

    window.addEventListener('message', handleOAuthSuccess);
    return () => window.removeEventListener('message', handleOAuthSuccess);
  }, []);

  const handleConnectOAuth = async (platformId: string) => {
    setIsConnecting(true);
    setToast(null);
    try {
      const response = await fetch(`/api/social/connect/${platformId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: window.location.origin })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل إعداد رابط الاتصال');
      }

      if (data.url) {
        // Open authorization pop-up directly
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          data.url,
          `connect_${platformId}`,
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
        
        if (!popup) {
          alert('يرجى السماح بالنوافذ المنبثقة لإتمام عملية تسجيل الدخول والاتصال.');
        } else {
          setShowAddModal(false);
        }
      }
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
      setShowAddModal(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setToast(null);
    
    try {
      const customName = manualFields.siteUrl ? 'موقع ووردبريس' : manualFields.chatId ? 'قناة تلغرام' : 'ديسكورد ويبهوك';
      const customHandle = manualFields.siteUrl || manualFields.chatId || 'Webhook';
      
      const response = await fetch(`/api/social/connect/${selectedPlatform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customName,
          customHandle,
          fields: manualFields
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setToast({ message: `تم الاتصال وحفظ تكامل ${selectedPlatform.toUpperCase()} بنجاح!`, type: 'success' });
        setShowAddModal(false);
        fetchAccounts();
      } else {
        setToast({ message: data.error || 'فشل الاتصال الآمن', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في إلغاء ربط وفصل حساب "${name}"؟`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/social/accounts/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setToast({ message: `تم إلغاء ربط حساب "${name}" بنجاح`, type: 'success' });
        fetchAccounts();
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'فشل إلغاء ربط الحساب', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleTestConnection = async (id: string) => {
    setIsTesting(id);
    setToast(null);
    try {
      const response = await fetch(`/api/social/test-connection/${id}`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTestResults(prev => ({ ...prev, [id]: { status: 'success', msg: data.details || 'الاتصال آمن وفعال!' } }));
      } else {
        setTestResults(prev => ({ ...prev, [id]: { status: 'failed', msg: data.error || data.details || 'فشلت مصادقة الرمز السري' } }));
      }
    } catch (err: any) {
      setTestResults(prev => ({ ...prev, [id]: { status: 'failed', msg: err.message } }));
    } finally {
      setIsTesting(null);
    }
  };

  const getPlatformIcon = (platformId: string) => {
    const plat = platforms.find(p => p.id === platformId);
    if (!plat) return Globe;
    return plat.icon;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" />
          إدارة الحسابات والقنوات المتصلة
        </h2>
        <button 
          onClick={() => {
            setSelectedPlatform('');
            setManualFields({});
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary-hover flex items-center gap-2 font-semibold text-sm transition-all shadow-lg shadow-primary/10"
        >
          <Plus className="w-4 h-4" />
          ربط حساب أو قناة جديدة
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
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
          )}
          <p>{toast.message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-xl border border-white/5 p-6 animate-pulse h-48" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-surface rounded-xl border border-white/5 p-12 text-center max-w-xl mx-auto">
          <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">لا توجد حسابات متصلة</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            قم بربط حسابات التواصل الاجتماعي أو قنوات التلغرام والديسكورد لبدء النشر والجدولة الآلية للمباريات، الأهداف، والأخبار العاجلة فوراً.
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-surface-elevated hover:bg-surface-elevated/80 border border-white/10 text-white font-semibold text-sm rounded-lg"
          >
            تكامل حساب جديد الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const Icon = getPlatformIcon(acc.platform);
            const testResult = testResults[acc.id];
            
            return (
              <div key={acc.id} className="bg-surface rounded-xl border border-white/5 p-6 flex flex-col justify-between hover:border-white/10 transition-all">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center border border-white/5 overflow-hidden shrink-0">
                      {acc.avatarUrl ? (
                        <img src={acc.avatarUrl} alt={acc.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Icon className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white font-semibold truncate leading-snug">{acc.name}</h4>
                      <p className="text-xs text-gray-500 truncate font-mono mt-0.5">@{acc.handle || acc.platform}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full ${acc.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[10px] text-gray-400">
                          {acc.status === 'active' ? 'متصل (Connected)' : 'غير متصل / منتهي'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {acc.tokenExpiresAt && (
                    <div className="mt-3 mb-4 text-[11px] text-gray-400 bg-white/5 p-2.5 rounded-lg border border-white/5 flex flex-col gap-0.5">
                      <span className="text-gray-500 text-[10px]">تاريخ انتهاء الصلاحية (Expires):</span>
                      <span className="font-mono">
                        {new Date(acc.tokenExpiresAt).toLocaleString('ar-EG', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}

                  {acc.platform === 'facebook' && acc.pages && acc.pages.length > 0 && (
                    <div className="mt-3 mb-4 space-y-1.5">
                      <span className="text-[10px] text-gray-500 block">الصفحات المتاحة ({acc.pages.length}):</span>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {acc.pages.map((page: any) => (
                          <div key={page.id} className="flex items-center gap-2 p-1.5 rounded bg-surface-elevated border border-white/5 text-[11px] text-white">
                            {page.avatarUrl ? (
                              <img src={page.avatarUrl} alt={page.name} className="w-4 h-4 rounded-full object-cover" />
                            ) : (
                              <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px]">P</span>
                            )}
                            <span className="truncate flex-1 font-medium">{page.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {testResult && (
                    <div className={`p-2.5 rounded-lg text-xs mb-4 border ${
                      testResult.status === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-300'
                        : 'bg-red-500/10 border-red-500/20 text-red-300'
                    }`}>
                      <p className="font-semibold mb-0.5">نتيجة فحص الاتصال:</p>
                      <p className="opacity-90">{testResult.msg}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button 
                    onClick={() => handleTestConnection(acc.id)}
                    disabled={isTesting === acc.id}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting === acc.id ? 'animate-spin' : ''}`} />
                    فحص الاتصال
                  </button>
                  <button 
                    onClick={() => handleDisconnect(acc.id, acc.name)}
                    className="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-1 border border-red-500/20"
                    title="فصل وإلغاء الربط"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    فصل
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-200">
        <AlertCircle className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" />
        <div className="text-sm">
          <p className="mb-1 font-semibold text-blue-400">إرشادات الربط والتوثيق المباشر</p>
          <p className="opacity-80 leading-relaxed">
            لربط حسابات جديدة تعتمد على بروتوكول OAuth 2.0 (مثل فيسبوك، إنستغرام، إكس)، يجب عليك أولاً تسجيل التطبيق في لوحات تحكم المطورين الخاصة بالمنصات وإدخال المفاتيح في قسم <strong>إدارة مفاتيح الـ API</strong>. لضمان نجاح الاتصال، يرجى إضافة عنوان Callback الخاص بالمشروع إلى إعدادات المنصة.
          </p>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface rounded-2xl border border-white/10 w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-elevated">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                ربط حساب أو قناة تواصل جديدة
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <Trash2 className="w-5 h-5 rotate-45" />
              </button>
            </div>

            {!selectedPlatform ? (
              <div className="p-6">
                <p className="text-sm text-gray-400 mb-4">اختر المنصة أو القناة التي تود دمجها:</p>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map(p => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (p.isManual) {
                            setSelectedPlatform(p.id);
                            setManualFields({});
                          } else {
                            handleConnectOAuth(p.id);
                          }
                        }}
                        className="bg-surface-elevated hover:bg-surface-elevated/80 border border-white/5 hover:border-primary/30 p-4 rounded-xl flex flex-col items-center gap-2 text-center group transition-all"
                      >
                        <Icon className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
                        <span className="text-sm font-semibold text-white">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <button 
                    onClick={() => setSelectedPlatform('')}
                    className="text-primary hover:underline"
                  >
                    الرجوع لقائمة المنصات
                  </button>
                  <span className="text-gray-600">/</span>
                  <span className="text-white font-medium">إعداد {platforms.find(p => p.id === selectedPlatform)?.name}</span>
                </div>

                {platforms.find(p => p.id === selectedPlatform)?.isManual ? (
                  // Manual API Integration
                  <form onSubmit={handleConnectManual} className="space-y-4">
                    {platforms.find(p => p.id === selectedPlatform)?.requiredFields?.map(field => (
                      <div key={field.name} className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-300">{field.label}</label>
                        <input
                          type="text"
                          required
                          placeholder={field.placeholder}
                          value={manualFields[field.name] || ''}
                          onChange={e => setManualFields({ ...manualFields, [field.name]: e.target.value })}
                          className="w-full bg-surface-elevated text-white border border-white/10 rounded-lg py-2 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                    ))}
                    
                    <button
                      type="submit"
                      disabled={isConnecting}
                      className="w-full mt-4 py-2 bg-primary text-black hover:bg-primary-hover rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isConnecting ? 'جاري تأسيس الاتصال الآمن...' : 'إتمام الربط والتكامل'}
                    </button>
                  </form>
                ) : (
                  // OAuth Integration
                  <div className="text-center py-6 space-y-4">
                    <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
                      سيتم فتح نافذة منبثقة آمنة لتسجيل الدخول إلى حسابك ومصادقة الاتصال مباشرة عبر خوادم {selectedPlatform.toUpperCase()}.
                    </p>
                    
                    <button
                      onClick={() => handleConnectOAuth(selectedPlatform)}
                      disabled={isConnecting}
                      className="px-6 py-2.5 bg-primary text-black hover:bg-primary-hover rounded-lg font-bold text-sm flex items-center gap-2 mx-auto disabled:opacity-50"
                    >
                      {isConnecting ? 'جاري تحضير رابط OAuth...' : 'توجيه لمصادقة OAuth 2.0'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectedAccounts;
