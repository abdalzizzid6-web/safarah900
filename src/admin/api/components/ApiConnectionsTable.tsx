import React from 'react';
import { Play, Edit2, Trash2, AlertTriangle, Check } from 'lucide-react';
import { ApiProvider } from '../types/api';

// Individual Row / Card Component, completely memoized for peak rendering performance
const ApiConnectionRow: React.FC<{
  prov: ApiProvider;
  actionLoading: string | null;
  testResult: { id: string; success: boolean; latency?: number; message?: string } | null;
  onTestKey: (p: ApiProvider) => void;
  onToggleActive: (p: ApiProvider) => void;
  onEdit: (p: ApiProvider) => void;
  onDelete: (id: string) => void;
}> = React.memo(({
  prov,
  actionLoading,
  testResult,
  onTestKey,
  onToggleActive,
  onEdit,
  onDelete
}) => {
  const usagePercent = Math.min(Math.round((prov.usedToday / prov.quotaDaily) * 100), 100) || 0;
  const isTesting = actionLoading === `test-${prov.id}`;

  const arabicMap: Record<string, string> = {
    matches: 'مباريات',
    leagues: 'بطولات',
    teams: 'فرق',
    players: 'لاعبين',
    news: 'أخبار',
    predictions: 'توقعات',
    live_stream: 'بث مباشر',
    ai_analysis: 'تحليل AI'
  };

  return (
    <div 
      className={`bg-gray-900/40 border p-5 rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        prov.active 
          ? prov.status === 'healthy' 
            ? 'border-gray-800/80 hover:border-gray-700' 
            : prov.status === 'degraded'
              ? 'border-amber-900/40 bg-amber-950/5'
              : 'border-red-900/40 bg-red-950/5'
          : 'border-gray-800/30 opacity-60'
      }`}
    >
      {/* Info Column */}
      <div className="space-y-2 max-w-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            !prov.active 
              ? 'bg-gray-600' 
              : prov.status === 'healthy' 
                ? 'bg-green-500 animate-pulse' 
                : prov.status === 'degraded'
                  ? 'bg-amber-500'
                  : 'bg-red-500'
          }`}></span>
          <h4 className="font-bold text-sm text-gray-100">{prov.name}</h4>
          
          <span className="text-[10px] bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-gray-300 font-mono">
            {prov.provider}
          </span>
          
          <span className="text-xs bg-[#FF003C]/10 text-[#FF003C] px-1.5 py-0.5 rounded font-mono font-bold">
            أولوية: {prov.priority}
          </span>
          
          {prov.priorityType && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
              prov.priorityType === 'primary' 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                : prov.priorityType === 'secondary'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {prov.priorityType === 'primary' ? 'Primary' : prov.priorityType === 'secondary' ? 'Secondary' : 'Fallback'}
            </span>
          )}
        </div>

        {/* List of active categories for this key */}
        <div className="flex flex-wrap gap-1 mt-1">
          {(!prov.categories || prov.categories.length === 0) ? (
            <span className="text-[10px] bg-gray-800/40 text-gray-400 px-1.5 py-0.5 rounded">كافة الأقسام (All Sections)</span>
          ) : (
            prov.categories.map((c: string) => (
              <span key={c} className="text-[10px] bg-gray-900 border border-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-medium">
                {arabicMap[c] || c}
              </span>
            ))
          )}
          {prov.allowedLeagues && prov.allowedLeagues.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
               <span className="text-[10px] bg-blue-900/20 border border-blue-800 text-blue-300 px-1.5 py-0.5 rounded font-medium">الدوريات: {prov.allowedLeagues.join(', ')}</span>
            </div>
          )}
        </div>

        <div className="text-xs space-y-1 text-gray-400">
          <div className="flex items-center gap-1 font-mono">
            <span className="font-sans">المفتاح:</span>
            <span className="text-gray-300">
              {prov.key.length > 15 ? `${prov.key.substring(0, 6)}...${prov.key.substring(prov.key.length - 6)}` : prov.key}
            </span>
          </div>
          {prov.statusMessage && (
            <p className="text-amber-400 text-[10px] font-sans flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {prov.statusMessage}
            </p>
          )}
        </div>
      </div>

      {/* Quota Progress Bar */}
      <div className="flex-1 max-w-xs space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span>الاستهلاك اليومي</span>
          <span className="font-mono">{prov.usedToday} / {prov.quotaDaily} ({usagePercent}%)</span>
        </div>
        <div className="bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-800/80">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              usagePercent > 90 
                ? 'bg-red-500' 
                : usagePercent > 70 
                  ? 'bg-amber-500' 
                  : 'bg-[#FF003C]'
            }`}
            style={{ width: `${usagePercent}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>الاستهلاك الشهري: {prov.usedMonth} / {prov.quotaMonthly}</span>
          <span>الكلفة: ${prov.costPerCall}/طلب</span>
        </div>
      </div>

      {/* Latency & Last Check */}
      <div className="text-right text-xs space-y-1 font-mono text-gray-400">
        <div className="flex items-center justify-end gap-1.5">
          <span>زمن الاستجابة:</span>
          <span className={`font-bold ${
            !prov.latency 
              ? 'text-gray-500' 
              : prov.latency < 200 
                ? 'text-green-400' 
                : prov.latency < 500 
                  ? 'text-amber-400' 
                  : 'text-red-400'
          }`}>
            {prov.latency ? `${prov.latency}ms` : 'N/A'}
          </span>
        </div>
        <div className="text-[10px] text-gray-500 font-sans">
          تحديث: {new Date(prov.updatedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Action Column */}
      <div className="flex items-center gap-2 self-end md:self-auto">
        <button
          onClick={() => onTestKey(prov)}
          disabled={isTesting}
          title="فحص الاتصال"
          className="p-2 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-gray-300 hover:text-white transition cursor-pointer disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isTesting ? 'animate-spin text-[#FF003C]' : ''}`} />
        </button>

        <button
          onClick={() => onToggleActive(prov)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
            prov.active 
              ? 'bg-green-950/20 text-green-400 border-green-800/50 hover:bg-green-950/40' 
              : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
          }`}
        >
          {prov.active ? 'نشط' : 'معطل'}
        </button>

        <button
          onClick={() => onEdit(prov)}
          className="p-2 bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg text-gray-300 hover:text-white transition cursor-pointer"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(prov.id)}
          className="p-2 bg-red-950/20 border border-red-900/40 hover:border-red-600 rounded-lg text-red-400 hover:text-red-300 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

ApiConnectionRow.displayName = 'ApiConnectionRow';

interface ApiConnectionsTableProps {
  providers: ApiProvider[];
  actionLoading: string | null;
  testResult: { id: string; success: boolean; latency?: number; message?: string } | null;
  onTestKey: (p: ApiProvider) => void;
  onToggleActive: (p: ApiProvider) => void;
  onEdit: (p: ApiProvider) => void;
  onDelete: (id: string) => void;
}

export const ApiConnectionsTable: React.FC<ApiConnectionsTableProps> = React.memo(({
  providers,
  actionLoading,
  testResult,
  onTestKey,
  onToggleActive,
  onEdit,
  onDelete
}) => {
  return (
    <div className="space-y-3">
      {providers.map((prov) => (
        <ApiConnectionRow
          key={prov.id}
          prov={prov}
          actionLoading={actionLoading}
          testResult={testResult}
          onTestKey={onTestKey}
          onToggleActive={onToggleActive}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});

ApiConnectionsTable.displayName = 'ApiConnectionsTable';
export default ApiConnectionsTable;
