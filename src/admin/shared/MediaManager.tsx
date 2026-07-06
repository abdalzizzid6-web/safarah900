import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Copy, ImageIcon, Loader2, Check, RefreshCw, Activity } from 'lucide-react';

export default function MediaManager() {
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagResults, setDiagResults] = useState<any>(null);

  const [currentPath, setCurrentPath] = useState('/');

  const fetchFiles = async (path: string = '/') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/imagekit/files?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  const runDiagnostics = async () => {
    setDiagResults({ testing: true });
    try {
        const tests = {
            config: !!import.meta.env.VITE_IMAGEKIT_PUBLIC && !!import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
            endpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
            files: 0,
            upload: false
        };
        const filesRes = await fetch('/api/imagekit/files');
        tests.files = (await filesRes.json()).length;
        
        setDiagResults({
            ...tests,
            testing: false,
            success: true
        });
    } catch (e) {
        setDiagResults({ testing: false, success: false, error: (e as any).message });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      const response = await fetch('/api/imagekit/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64,
          fileName: file.name,
          folder: currentPath === '/' ? 'media' : currentPath.replace(/^\//, ''),
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل الرفع');
      }

      await fetchFiles(currentPath);
      setUploading(false);
    } catch (error) {
      setUploading(false);
      console.error('Upload Error:', error);
      alert('حدث خطأ أثناء إجراء عملية الرفع');
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    try {
      await fetch(`/api/imagekit/files/${fileId}`, { method: 'DELETE' });
      fetchFiles();
    } catch (err) {
      console.error(err);
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">مدير الوسائط</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowDiagnostics(!showDiagnostics)} className="text-gray-400 hover:text-white p-2">
            <Activity size={18} />
          </button>
          <button onClick={() => fetchFiles()} className="text-gray-400 hover:text-white p-2">
            <RefreshCw size={18} />
          </button>
          <label className="cursor-pointer bg-primary text-black px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-opacity-90">
            <Upload size={14} />
            <span>رفع صورة جديدة</span>
            <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
          </label>
        </div>
      </div>
      
      {showDiagnostics && (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl text-white text-xs">
            <h3 className="font-bold mb-2">تشخيص ImageKit:</h3>
            <button onClick={runDiagnostics} className="bg-slate-800 p-2 rounded mb-2">تشغيل الاختبار</button>
            {diagResults && (
                <pre className="text-xs">{JSON.stringify(diagResults, null, 2)}</pre>
            )}
        </div>
      )}
      
      {uploading && (
        <div className="flex items-center justify-center p-10 text-white/50">
          <Loader2 className="animate-spin" />
          <span className="mr-2">جاري الرفع...</span>
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center p-10 text-white/50">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <div key={file.fileId} className="group relative glass rounded-xl overflow-hidden">
              <img src={file.thumbnail || file.url} alt={file.name} className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                <button 
                    onClick={() => copyUrl(file.url, file.fileId)}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/40"
                    title="نسخ الرابط"
                >
                    {copiedId === file.fileId ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-white" />}
                </button>
                <button 
                    onClick={() => deleteFile(file.fileId)}
                    className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/40"
                    title="حذف"
                >
                    <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
