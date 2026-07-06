import React, { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2, Search, Bug } from 'lucide-react';
import { matchService } from '../../../services/matchService';
import { worldCupService } from '../../../services/worldCupService';
import { inspectFirestoreMatch } from '../utils/inspectFirestoreMatch';
import { Match } from '../../../types';

export default function MatchDiagnosticTool() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ firestoreCount: number; apiCount: number; discrepancies: string[] } | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      // 1. Fetch Firestore matches
      const firestoreMatches = await matchService.getAllMatches();
      
      // 2. Fetch API matches (using World Cup for now as it's the current context)
      const apiMatches = await worldCupService.getWorldCupMatches(2026);

      const discrepancies: string[] = [];

      // Simple comparison based on ID presence
      const firestoreIds = new Set(firestoreMatches.map(m => m.id.replace('wc-', '')));
      
      apiMatches.forEach(apiMatch => {
        if (!firestoreIds.has(String(apiMatch.id))) {
          discrepancies.push(`Missing in Firestore: API Match ${apiMatch.id} - ${apiMatch.homeTeam.name} vs ${apiMatch.awayTeam.name}`);
        }
      });

      setResults({
        firestoreCount: firestoreMatches.length,
        apiCount: apiMatches.length,
        discrepancies
      });
    } catch (e) {
      console.error(e);
      alert("Error running diagnostics");
    } finally {
      setLoading(false);
    }
  };

  const handleInspectRaw = async () => {
    setLoading(true);
    try {
      await inspectFirestoreMatch();
      alert("تمت عملية الفحص بنجاح. يرجى التحقق من وحدة تحكم المتصفح (Browser Console) لمراجعة النتائج التفصيلية.");
    } catch (e) {
      console.error(e);
      alert("Error inspecting raw match data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="slate-glass p-6 rounded-3xl border border-white/5 space-y-4">
      <h3 className="font-black text-lg text-white">أداة فحص المزامنة (Diagnostics)</h3>
      
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={runDiagnostics} 
          disabled={loading}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-black"
        >
          <RefreshCw size={14} className={cn(loading && "animate-spin")} />
          بدء فحص ومقارنة البيانات
        </button>

        <button 
          onClick={handleInspectRaw} 
          disabled={loading}
          className="p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-black"
        >
          <Bug size={14} />
          فحص بنية البيانات (Console)
        </button>
      </div>

      {results && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-black/40 rounded-xl">
              <span className="text-[10px] text-gray-400">في Firestore</span>
              <p className="text-xl font-mono font-bold text-white">{results.firestoreCount}</p>
            </div>
            <div className="p-4 bg-black/40 rounded-xl">
              <span className="text-[10px] text-gray-400">من API</span>
              <p className="text-xl font-mono font-bold text-white">{results.apiCount}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {results.discrepancies.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle2 size={16} /> المزامنة متطابقة
              </div>
            ) : (
              results.discrepancies.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-red-400 text-[10px]">
                  <AlertCircle size={14} /> {d}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
