import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Check, RefreshCw, Layers, Eye, Sparkles, ShieldCheck } from 'lucide-react';
import { MediaAsset } from '../types';
import { mediaService } from '../services/mediaService';

interface DuplicateGroup {
  id: string; // hash key
  hash: string;
  type: 'sha256' | 'phash';
  assets: MediaAsset[];
}

interface MediaDuplicatesViewProps {
  assets: MediaAsset[];
  onRefreshAssets: () => void;
}

export default function MediaDuplicatesView({ assets, onRefreshAssets }: MediaDuplicatesViewProps) {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [mergingId, setMergingId] = useState<string | null>(null);

  useEffect(() => {
    scanForDuplicates();
  }, [assets]);

  const scanForDuplicates = () => {
    setIsScanning(true);
    const shaGroups: Record<string, MediaAsset[]> = {};
    const phashGroups: Record<string, MediaAsset[]> = {};

    assets.forEach(asset => {
      // 1. Group exact duplicates by SHA256
      if (asset.sha256) {
        if (!shaGroups[asset.sha256]) shaGroups[asset.sha256] = [];
        shaGroups[asset.sha256].push(asset);
      }

      // 2. Group visually similar by pHash if we have it
      if (asset.pHash) {
        if (!phashGroups[asset.pHash]) phashGroups[asset.pHash] = [];
        phashGroups[asset.pHash].push(asset);
      }
    });

    const detectedGroups: DuplicateGroup[] = [];

    // Add exact matches
    Object.entries(shaGroups).forEach(([hash, items]) => {
      if (items.length > 1) {
        detectedGroups.push({
          id: `sha-${hash}`,
          hash,
          type: 'sha256',
          assets: items
        });
      }
    });

    // Add perceptual matches if not already captured in exact matches
    Object.entries(phashGroups).forEach(([hash, items]) => {
      if (items.length > 1) {
        // Only add if we haven't already marked these items in exact matches
        const someId = items[0].id;
        const alreadyInExact = detectedGroups.some(g => g.assets.some(a => a.id === someId));
        if (!alreadyInExact) {
          detectedGroups.push({
            id: `phash-${hash}`,
            hash,
            type: 'phash',
            assets: items
          });
        }
      }
    });

    setGroups(detectedGroups);
    setIsScanning(false);
  };

  const handleMergeGroup = async (group: DuplicateGroup) => {
    if (group.assets.length < 2) return;
    setMergingId(group.id);

    try {
      // Keep first one (usually oldest/original), delete the rest
      const [primary, ...duplicatesToDelete] = group.assets;
      
      for (const dup of duplicatesToDelete) {
        // Merge smartLinks if any exist
        const mergedLinks = {
          players: [...(primary.smartLinks?.players || []), ...(dup.smartLinks?.players || [])],
          teams: [...(primary.smartLinks?.teams || []), ...(dup.smartLinks?.teams || [])],
          competitions: [...(primary.smartLinks?.competitions || []), ...(dup.smartLinks?.competitions || [])],
          matches: [...(primary.smartLinks?.matches || []), ...(dup.smartLinks?.matches || [])],
          news: [...(primary.smartLinks?.news || []), ...(dup.smartLinks?.news || [])]
        };

        // Deduplicate arrays
        mergedLinks.players = Array.from(new Set(mergedLinks.players.map(p => JSON.stringify(p)))).map(p => JSON.parse(p));
        mergedLinks.teams = Array.from(new Set(mergedLinks.teams.map(t => JSON.stringify(t)))).map(t => JSON.parse(t));

        // Save merged data
        await mediaService.updateAsset(primary.id, { smartLinks: mergedLinks });
        
        // Delete redundant duplicate
        await mediaService.deleteAsset(dup.id);
      }

      alert('تم دمج الأصول المتطابقة والروابط الذكية بنجاح، وتحرير مساحة التخزين.');
      onRefreshAssets();
    } catch (err: any) {
      alert(`حدث خطأ أثناء الدمج: ${err.message}`);
    } finally {
      setMergingId(null);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black text-white">كاشف وتكرار الملفات (Duplicates)</h3>
          <p className="text-xs text-gray-400 mt-1">فحص التكرار التلقائي للملفات المرفوعة باستخدام البصمة التشفيرية والتشابه البصري.</p>
        </div>

        <button
          onClick={scanForDuplicates}
          disabled={isScanning}
          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-30"
        >
          <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
          <span>إعادة الفحص المتقدم</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-[#111112] border border-white/5 p-16 rounded-3xl text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">المنصة خالية من تكرار الأصول</h4>
            <p className="text-xs text-gray-400 mt-1">رائع! جميع الملفات الملقمة تتمتع ببصمات فريدة ولم يتم رصد أي تكرار للملفات المرفوعة.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div>
              <h5 className="text-xs font-black text-amber-500">تم اكتشاف تكرار محتمل لـ ({groups.length}) مجموعة من الأصول</h5>
              <p className="text-[10px] text-amber-300 mt-0.5 leading-relaxed font-bold">
                يقدم النظام ميزة الدمج الذكي التي تجمع التسميات والارتباطات بلا فقدان للبيانات، ثم تقوم بحذف النسخة الإضافية لتوفير المساحة والحفاظ على سلامة محركات البحث.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {groups.map(group => (
              <div key={group.id} className="bg-[#111112] border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${group.type === 'sha256' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {group.type === 'sha256' ? 'تطابق رقمي مطلق (SHA256)' : 'تطابق مرئي مرتفع (pHash)'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">البصمة: {group.hash.substring(0, 24)}...</span>
                  </div>

                  <button
                    onClick={() => handleMergeGroup(group)}
                    disabled={mergingId === group.id}
                    className="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-30"
                  >
                    <Layers size={12} />
                    <span>{mergingId === group.id ? 'جاري دمج الملفات والروابط...' : 'دمج وتبسيط المجموعة'}</span>
                  </button>
                </div>

                {/* Side-by-side matches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {group.assets.map((asset, idx) => (
                    <div key={asset.id} className="bg-black/40 border border-white/[0.03] rounded-xl overflow-hidden p-3 flex flex-col justify-between space-y-3">
                      <div className="aspect-video bg-[#09090a] rounded-lg overflow-hidden relative">
                        <img src={asset.urls.thumbnail || asset.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-[8px] px-1.5 py-0.5 rounded border border-white/10 text-white font-mono">
                          {idx === 0 ? 'الملف الأساسي (سيبقى)' : 'نسخة مكررة (ستُحذف)'}
                        </span>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-black text-white truncate">{asset.name}</h5>
                        <p className="text-[9px] text-gray-400 mt-1 font-bold">
                          المقاس: {asset.width}x{asset.height} px • {(asset.fileSize / 1024).toFixed(1)} KB
                        </p>
                        <p className="text-[9px] text-gray-500 mt-0.5">النوع: {asset.mediaType}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
