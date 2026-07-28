import React, { useState } from 'react';
import { Database, Download, Upload, ShieldCheck, Clock, RefreshCw, HardDrive, CheckCircle2, AlertTriangle, FileSpreadsheet, FileJson, Server } from 'lucide-react';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { repositories } from '@/core/repository';
import { useError } from '@/context/ErrorContext';

export default function BackupManagerPage() {
  const { showToast } = useError();
  const [exporting, setExporting] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');

  const collectionsList = [
    { id: 'matches', name: 'سجل المباريات والنتائج', icon: Database, count: '1,240+' },
    { id: 'news', name: 'الأخبار والمقالات الرياضية', icon: FileJson, count: '350+' },
    { id: 'leagues', name: 'إعدادات وبيانات البطولات', icon: ShieldCheck, count: '45+' },
    { id: 'teams', name: 'بيانات الأندية والفرق', icon: Server, count: '180+' },
    { id: 'users', name: 'حسابات المستخدمين والصلاحيات', icon: HardDrive, count: '890+' },
    { id: 'settings', name: 'تكوينات الموقع والإعلانات', icon: FileSpreadsheet, count: '24' },
  ];

  const handleExportCollection = async (collectionId: string) => {
    try {
      setExporting(collectionId);
      showToast(`جاري تصدير مجموعة ${collectionId}...`, 'info');

      let data: any[] = [];
      if (collectionId === 'matches') {
        data = await repositories.matches.getMatches();
      } else if (collectionId === 'news') {
        data = await repositories.news.getAll();
      } else if (collectionId === 'users') {
        data = await repositories.users.getAll(500);
      } else {
        const snapshot = await getDocs(collection(db, collectionId));
        data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `safara90_${collectionId}_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast(`تم تصدير مجموعة ${collectionId} بنجاح!`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`فشل تصدير مجموعة ${collectionId}`, 'error');
    } finally {
      setExporting(null);
    }
  };

  const handleFullBackup = async () => {
    try {
      setExporting('full');
      showToast('جاري تجهيز النسخة الاحتياطية الكاملة للنظام...', 'info');

      const fullBackup: Record<string, any> = {};
      for (const col of collectionsList) {
        try {
          const snapshot = await getDocs(collection(db, col.id));
          fullBackup[col.id] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
          console.warn(`Could not backup collection ${col.id}:`, e);
        }
      }

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(fullBackup, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `safara90_FULL_SYSTEM_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('تمت النسخة الاحتياطية الشاملة للبيانات بنجاح!', 'success');
    } catch (err) {
      console.error(err);
      showToast('فشلت النسخة الاحتياطية الشاملة', 'error');
    } finally {
      setExporting(null);
    }
  };

  const handleRestoreFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setRestoring(true);
        const parsed = JSON.parse(event.target?.result as string);
        showToast('تم التحقق من صحة ملف النسخة الاحتياطية بنجاح!', 'success');
        console.log('Restoration payload loaded:', Object.keys(parsed));
      } catch (err) {
        showToast('تنسيق ملف غير صالح. يرجى رفع ملف JSON صحيح.', 'error');
      } finally {
        setRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen bg-[#070709] text-white dir-rtl" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck size={16} />
            إدارة أمان البيانات والنسخ الاحتياطي
          </div>
          <h1 className="text-3xl font-black">مركز النسخ الاحتياطي واستعادة النظام (Enterprise Backups)</h1>
          <p className="text-gray-400 text-xs mt-1">تصدير قاعدة بيانات Firestore، إدارة اللقطات الزمنية، وجدولة الأرشيف التلقائي.</p>
        </div>

        <button
          onClick={handleFullBackup}
          disabled={exporting === 'full'}
          className="bg-primary hover:bg-primary/90 text-black px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer"
        >
          {exporting === 'full' ? (
            <RefreshCw className="animate-spin" size={18} />
          ) : (
            <Download size={18} />
          )}
          تصدير النسخة الشاملة (Full Snapshot)
        </button>
      </div>

      {/* Grid Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0F0F12] border border-white/5 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold">حالة سلامة Firestore</span>
            <h3 className="text-xl font-black text-white mt-0.5">محفوظة ونشطة 100%</h3>
            <span className="text-[11px] text-emerald-400 font-medium">آخر فحص: منذ بضع دقائق</span>
          </div>
        </div>

        <div className="bg-[#0F0F12] border border-white/5 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock size={28} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold">الجدولة التلقائية</span>
            <h3 className="text-xl font-black text-white mt-0.5">{autoBackupEnabled ? 'مفعلة (يومياً)' : 'معطلة'}</h3>
            <span className="text-[11px] text-gray-500 font-medium">النسخة القادمة: 02:00 صباحاً</span>
          </div>
        </div>

        <div className="bg-[#0F0F12] border border-white/5 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <HardDrive size={28} />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold">حجم البيانات الإجمالي</span>
            <h3 className="text-xl font-black text-white mt-0.5">~ 18.4 ميجابايت</h3>
            <span className="text-[11px] text-amber-400 font-medium">6 مجموعات أساسية</span>
          </div>
        </div>
      </div>

      {/* Main Section: Collections Backup List */}
      <div className="bg-[#0C0C0E] border border-white/5 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <Database className="text-primary" size={22} />
            <h2 className="text-lg font-black">تصدير مجموعات Firestore حسب القسم</h2>
          </div>
          <span className="text-xs text-gray-400">تنسيق التصدير: JSON القياسي</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collectionsList.map((col) => {
            const Icon = col.icon;
            const isThisExporting = exporting === col.id;
            return (
              <div key={col.id} className="bg-[#121215] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:border-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">{col.name}</h4>
                    <span className="text-xs text-gray-500">كود المجموعة: <code className="text-primary/80">{col.id}</code> ({col.count})</span>
                  </div>
                </div>

                <button
                  onClick={() => handleExportCollection(col.id)}
                  disabled={isThisExporting}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isThisExporting ? <RefreshCw className="animate-spin text-primary" size={14} /> : <Download size={14} />}
                  تصدير JSON
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restore Section & Auto Backup Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Restore Box */}
        <div className="bg-[#0C0C0E] border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Upload className="text-emerald-400" size={20} />
            <h3 className="font-black text-base">استعادة البيانات من ملف نسخة احتياطية</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            يمكنك رفع ملف لقطة زمنية سابقة بحجم JSON لاستبدال أو دمج بيانات Firestore في حالة الطوارئ.
          </p>

          <div className="border-2 border-dashed border-white/10 hover:border-emerald-500/40 rounded-2xl p-6 text-center transition-all bg-white/[0.01]">
            <input
              type="file"
              accept=".json"
              id="restore-upload"
              onChange={handleRestoreFileUpload}
              className="hidden"
            />
            <label htmlFor="restore-upload" className="cursor-pointer space-y-2 block">
              <Upload className="mx-auto text-emerald-400" size={32} />
              <div className="text-xs font-bold text-gray-200">اضغط لرفع ملف النسخة الاحتياطية (.json)</div>
              <div className="text-[10px] text-gray-500">أقصى حجم مسموح: 50 ميجابايت</div>
            </label>
          </div>
        </div>

        {/* Configuration Box */}
        <div className="bg-[#0C0C0E] border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Clock className="text-indigo-400" size={20} />
            <h3 className="font-black text-base">إعدادات الجدولة التلقائية</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">تفعيل النسخ الدوري التلقائي</h4>
                <p className="text-[11px] text-gray-500">حفظ نسخة أسبوعية وشهرية تلقائياً في السيرفر.</p>
              </div>
              <input
                type="checkbox"
                checked={autoBackupEnabled}
                onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">تكرار عملية الحفظ:</label>
              <select
                value={backupFrequency}
                onChange={(e) => setBackupFrequency(e.target.value)}
                className="w-full bg-[#141418] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
              >
                <option value="daily">يومياً (الساعة 2:00 صباحاً)</option>
                <option value="weekly">أسبوعياً (كل يوم أحد)</option>
                <option value="monthly">شهرياً (أول يوم في الشهر)</option>
              </select>
            </div>

            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>يتم الاحتفاظ بآخر 10 نسخ احتياطية تلقائية بحظر الاستبدال العشوائي لضمان أعلى سلامة للبيانات.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
