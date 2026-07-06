import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { cmsService, LeagueSettings } from '../../services/cmsService';
import { leagueService } from '../../services/leagueService';
import { dataSourceService, DataSourceSettings, FootballProvider, CustomApi } from '../../services/dataSourceService';
import { 
  Settings2, Activity, RefreshCw, Save,
  Trophy, Star, Eye, Sliders, Database, KeyRound, Plus, Trash2, Link
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useError } from '../../context/ErrorContext';
import ApiHealthDashboard from './ApiHealthDashboard';

export default function ApiSettings() {
  const { showToast } = useError();
  const [loading, setLoading] = useState(true);
  const [dsSettings, setDsSettings] = useState<DataSourceSettings>({
    matchProvider: 'API-Football', leagueProvider: 'API-Football', teamProvider: 'API-Football',
    playerProvider: 'API-Football', standingsProvider: 'API-Football', statisticsProvider: 'API-Football',
    streamProvider: 'API-Football', theSportsDBApiKey: '', apiFootballKey: '', sportMonksKey: '',
    cacheEnabled: true, cacheTtlMinutes: 10, fallbackProvider: 'None', worldCupModuleEnabled: false,
    customApis: []
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingConnection, setTestingConnection] = useState<Record<string, boolean>>({});

  const [newCustomApi, setNewCustomApi] = useState<Partial<CustomApi>>({ name: '', baseUrl: '', apiKey: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const ds = await dataSourceService.getSettings();
      setDsSettings({ ...ds, customApis: ds.customApis || [] });
    } catch (err) {
      console.error('Error loading API Settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveAllSettings = async () => {
    setSavingSettings(true);
    try {
      await dataSourceService.saveSettings(dsSettings);
      showToast('تم حفظ كافة إعدادات مصادر البث وتكوين الـ API.', 'success');
      loadData();
    } catch (err: any) {
      showToast(`فشل تخزين الإعدادات: ${err.message || err}`, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestConnection = async (provider: FootballProvider) => {
    setTestingConnection(prev => ({ ...prev, [provider]: true }));
    try {
      let key = provider === 'API-Football' ? dsSettings.apiFootballKey : 
                provider === 'TheSportsDB' ? dsSettings.theSportsDBApiKey : dsSettings.sportMonksKey;

      const token = await auth.currentUser?.getIdToken();
      const result = await dataSourceService.testProviderConnection(provider, key, token);
      
      if (result.success) showToast(`اتصال ناجح بـ ${provider}!`, 'success');
      else showToast(`فشل الاتصال بـ ${provider}`, 'error');
    } catch (err: any) {
      showToast(`خطأ اختبار الاتصال: ${err.message}`, 'error');
    } finally {
      setTestingConnection(prev => ({ ...prev, [provider]: false }));
    }
  };

  const addCustomApi = () => {
    if (!newCustomApi.name || !newCustomApi.baseUrl) {
      showToast('الرجاء إدخال اسم ورابط الـ API على الأقل', 'error');
      return;
    }
    
    const api: CustomApi = {
      id: Date.now().toString(),
      name: newCustomApi.name,
      baseUrl: newCustomApi.baseUrl,
      apiKey: newCustomApi.apiKey || '',
      headers: {}
    };

    setDsSettings(prev => ({
      ...prev,
      customApis: [...(prev.customApis || []), api]
    }));
    setNewCustomApi({ name: '', baseUrl: '', apiKey: '' });
  };

  const removeCustomApi = (id: string) => {
    setDsSettings(prev => ({
      ...prev,
      customApis: (prev.customApis || []).filter(api => api.id !== id)
    }));
  };

  return (
    <div className="space-y-8 text-right bg-background p-4 md:p-8 rounded-[2.5rem] border border-white/5" dir="rtl">
      
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
           <h1 className="text-2xl font-black text-white">مركز إدارة الـ API</h1>
           <p className="text-xs text-gray-500">تحكم شامل في واجهات برمجة التطبيقات: إضافة، حذف، وتخصيص مسارات البيانات.</p>
        </div>
        <button
          onClick={handleSaveAllSettings}
          disabled={savingSettings}
          className="bg-primary hover:bg-primary/90 text-black px-8 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 disabled:opacity-50"
        >
          {savingSettings ? <RefreshCw className="animate-spin w-4 h-4" /> : <Save size={16} />}
          حفظ التكوين الشامل
        </button>
      </div>
      
      {/* 1. HEALTH AND DIAGNOSTIC UNIT */}
      <ApiHealthDashboard />

      {/* 2. ROUTING CONFIGURATION (Which API serves what) */}
      <div className="glass p-6 md:p-8 rounded-[2.5rem] border border-white/5 space-y-8">
        <div className="flex items-center gap-2">
            <Sliders className="text-primary w-5 h-5" />
            <h2 className="text-lg font-bold text-white">تخصيص مسارات البيانات (Routing)</h2>
        </div>
        <p className="text-xs text-gray-400">حدد المصدر الذي يغذي كل قسم من أقسام التطبيق بشكل مستقل.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'المباريات', key: 'matchProvider' },
            { label: 'الدوريات', key: 'leagueProvider' },
            { label: 'الفرق', key: 'teamProvider' },
            { label: 'اللاعبين', key: 'playerProvider' },
            { label: 'الترتيب', key: 'standingsProvider' },
            { label: 'الإحصائيات', key: 'statisticsProvider' },
            { label: 'البثوث', key: 'streamProvider' },
            { label: 'المزود الاحتياطي', key: 'fallbackProvider' },
          ].map(field => (
            <div key={field.key} className="bg-black/40 p-4 rounded-2xl border border-white/5">
              <label className="block text-xs font-bold text-gray-400 mb-2">{field.label}</label>
              <select
                className="bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-primary/20"
                value={(dsSettings as any)[field.key]}
                onChange={(e) => setDsSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
              >
                <option value="API-Football">API-Football</option>
                <option value="SportMonks">SportMonks</option>
                <option value="TheSportsDB">TheSportsDB</option>
                <option value="Custom">Custom API (مخصص)</option>
                <option value="None">تعطيل (None)</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CUSTOM APIS MANAGER */}
      <div className="glass p-6 md:p-8 rounded-[2.5rem] border border-white/5 space-y-6">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Link className="text-primary w-5 h-5" />
                <h2 className="text-lg font-bold text-white">واجهات الـ API المخصصة (إضافة / حذف)</h2>
            </div>
        </div>
        <p className="text-xs text-gray-400">أضف واجهات برمجة تطبيقات خارجية خاصة بك لاستخدامها كمصدر بديل للبيانات.</p>

        <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-bold text-gray-400">اسم الـ API</label>
                <input 
                    type="text" placeholder="مثال: واجهة المباريات الخاصة بي" 
                    className="bg-black/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white w-full"
                    value={newCustomApi.name} onChange={e => setNewCustomApi(p => ({ ...p, name: e.target.value }))}
                />
            </div>
            <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-bold text-gray-400">الرابط الأساسي (Base URL)</label>
                <input 
                    type="text" placeholder="https://api.example.com/v1" dir="ltr"
                    className="bg-black/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white w-full"
                    value={newCustomApi.baseUrl} onChange={e => setNewCustomApi(p => ({ ...p, baseUrl: e.target.value }))}
                />
            </div>
            <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-bold text-gray-400">مفتاح الوصول (API Key)</label>
                <input 
                    type="password" placeholder="اختياري..." dir="ltr"
                    className="bg-black/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white w-full"
                    value={newCustomApi.apiKey} onChange={e => setNewCustomApi(p => ({ ...p, apiKey: e.target.value }))}
                />
            </div>
            <button onClick={addCustomApi} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap">
                <Plus size={16} /> إضافة API
            </button>
        </div>

        {dsSettings.customApis && dsSettings.customApis.length > 0 && (
            <div className="space-y-3 mt-4">
                {dsSettings.customApis.map(api => (
                    <div key={api.id} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-sm text-white">{api.name}</h4>
                            <p className="text-xs text-gray-500 font-mono mt-1" dir="ltr">{api.baseUrl}</p>
                        </div>
                        <button onClick={() => removeCustomApi(api.id)} className="text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 p-2 rounded-lg transition-all">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* 4. DEFAULT PROVIDERS KEY MANAGER */}
      <div className="glass p-6 md:p-8 rounded-[2.5rem] border border-white/5 space-y-8">
        <div className="flex items-center gap-2">
            <KeyRound className="text-primary w-5 h-5" />
            <h2 className="text-lg font-bold text-white">مفاتيح المزودين الافتراضيين</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(['API-Football', 'TheSportsDB', 'SportMonks'] as FootballProvider[]).map(p => (
                <div key={p} className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-4">
                    <h4 className="font-bold text-sm text-white">{p}</h4>
                    <input
                      type="password"
                      placeholder={`مفتاح ${p}...`}
                      className="bg-black/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white w-full focus:outline-none focus:border-primary/20"
                      value={p === 'API-Football' ? dsSettings.apiFootballKey : p === 'TheSportsDB' ? dsSettings.theSportsDBApiKey : dsSettings.sportMonksKey}
                      onChange={(e) => {
                          const val = e.target.value;
                          setDsSettings(prev => ({ ...prev, [p === 'API-Football' ? 'apiFootballKey' : p === 'TheSportsDB' ? 'theSportsDBApiKey' : 'sportMonksKey']: val }));
                      }}
                    />
                    <button
                        onClick={() => handleTestConnection(p)}
                        disabled={testingConnection[p]}
                        className="w-full bg-white/5 hover:bg-white/10 active:scale-95 text-white py-2 rounded-xl text-xs font-bold transition-all border border-white/5"
                    >
                      {testingConnection[p] ? 'جاري الفحص...' : 'اختبار الاتصال'}
                    </button>
                </div>
            ))}
        </div>
      </div>

    </div>
  );
}
