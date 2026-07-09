import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Loader2, Activity } from 'lucide-react';
import { auth } from '../../firebase';
import { repositories } from '../../core/repository';

interface ProviderStatus {
  status: 'online' | 'offline' | 'checking' | 'error';
  lastChecked: Date | null;
  message?: string;
  latency?: number;
  statusCode?: number;
}

const PROVIDERS = ['API-Football', 'SportMonks', 'TheSportsDB'];

export default function ApiHealthDashboard() {
  const [statuses, setStatuses] = useState<Record<string, ProviderStatus>>({});
  const [logs, setLogs] = useState<{ provider: string; message: string; timestamp: Date }[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkConnectivity = useCallback(async (provider: string) => {
    setStatuses(prev => ({ ...prev, [provider]: { ...prev[provider], status: 'checking', lastChecked: new Date() } }));
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const keys = await repositories.apiManagement.apiKeyRepository.getKeys();
      const providerKey = keys.find(k => k.provider === provider);
      
      const key = providerKey?.key || '';

      // Using the same endpoint created before
      const response = await fetch('/api/test-api-key', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ provider, key })
      });
      const data = await response.json();
      
      if (data.success) {
        setStatuses(prev => ({ ...prev, [provider]: { status: 'online', lastChecked: new Date(), latency: data.latency, statusCode: data.status } }));
      } else {
        setStatuses(prev => ({ ...prev, [provider]: { status: 'offline', lastChecked: new Date(), message: data.message, latency: data.latency, statusCode: data.status } }));
        setLogs(prev => [{ provider, message: `${data.message} (${data.status} | ${data.latency}ms)`, timestamp: new Date() }, ...prev].slice(0, 5));
      }
    } catch (e: any) {
      setStatuses(prev => ({ ...prev, [provider]: { status: 'error', lastChecked: new Date(), message: e.message } }));
      setLogs(prev => [{ provider, message: e.message, timestamp: new Date() }, ...prev].slice(0, 5));
    }
  }, []);

  const checkAll = useCallback(async () => {
    setLoading(true);
    await Promise.all(PROVIDERS.map(checkConnectivity));
    setLoading(false);
  }, [checkConnectivity]);

  useEffect(() => {
    checkAll();
    if (isAutoRefresh) {
      const interval = setInterval(checkAll, 60000); // 1 minute
      return () => clearInterval(interval);
    }
  }, [isAutoRefresh, checkAll]);

  return (
    <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
          <Activity size={16} className="text-emerald-400" />
          لوحة صحة واجهات الـ API
        </h3>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsAutoRefresh(!isAutoRefresh)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${isAutoRefresh ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400'}`}>
            {isAutoRefresh ? 'تحديث تلقائي مفعل' : 'تحديث تلقائي معطل'}
          </button>
          <button onClick={checkAll} disabled={loading} className="p-2 bg-white/5 rounded-lg active:scale-95">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PROVIDERS.map(provider => {
          const s = statuses[provider] || { status: 'checking', lastChecked: null };
          return (
            <div key={provider} className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300">{provider}</span>
                {s.status === 'checking' ? <Loader2 size={12} className="animate-spin" /> : 
                 s.status === 'online' ? <CheckCircle2 size={12} className="text-emerald-400" /> : 
                 <AlertTriangle size={12} className="text-red-400" />
                }
              </div>
              <p className={`text-[10px] font-bold ${s.status === 'online' ? 'text-emerald-500' : 'text-red-500'}`}>
                {s.status === 'online' ? 'يعمل' : s.message || 'معطل'}
              </p>
              {s.latency !== undefined && (
                <div className="flex gap-2 text-[9px] text-gray-500">
                    <span>{s.latency}ms</span>
                    <span>HTTP: {s.statusCode}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {logs.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-black text-gray-500">سجل الإخفاقات الحديث</h4>
          {logs.map((log, i) => (
            <div key={i} className="text-[10px] bg-red-950/10 border border-red-500/10 p-2 rounded-lg text-red-300 font-mono">
              [{log.timestamp.toLocaleTimeString()}] {log.provider}: {log.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}