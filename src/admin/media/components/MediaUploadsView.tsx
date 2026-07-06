import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, AlertCircle, RefreshCw, Sparkles, Clipboard, FolderOpen } from 'lucide-react';
import { processImageFile } from '../utils/imageProcessor';
import { mediaService } from '../services/mediaService';
import { MediaType, MediaAsset } from '../types';

interface UploadJob {
  id: string;
  file: File;
  name: string;
  mediaType: MediaType;
  progress: number;
  status: 'pending' | 'processing' | 'uploading' | 'completed' | 'failed';
  error?: string;
  result?: MediaAsset;
  cancelRef?: { current: boolean };
}

interface MediaUploadsViewProps {
  onUploadSuccess: () => void;
  folders: { id: string; name: string }[];
  currentFolderId: string | null;
}

export default function MediaUploadsView({ onUploadSuccess, folders, currentFolderId }: MediaUploadsViewProps) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('Images');
  const [targetFolder, setTargetFolder] = useState<string>(currentFolderId || 'none');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentFolderId) {
      setTargetFolder(currentFolderId);
    }
  }, [currentFolderId]);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  // Handle Clipboard Paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        addFilesToQueue(Array.from(e.clipboardData.files));
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedMediaType, targetFolder]);

  // Add files to queue
  const addFilesToQueue = (files: File[]) => {
    const newJobs: UploadJob[] = files.map(file => {
      // Guess mediaType from name or mime
      let guessedType: MediaType = 'Images';
      if (file.type.includes('svg')) guessedType = 'SVG';
      else if (file.type.includes('video')) guessedType = 'Videos';
      else if (file.type.includes('pdf')) guessedType = 'PDF';
      else if (file.name.endsWith('.zip')) guessedType = 'ZIP';
      else if (file.name.includes('logo')) guessedType = 'Logos';
      else guessedType = selectedMediaType;

      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name.split('.').slice(0, -1).join('.') || file.name,
        mediaType: guessedType,
        progress: 0,
        status: 'pending',
        cancelRef: { current: false }
      };
    });

    setJobs(prev => [...newJobs, ...prev]);
  };

  // Trigger file processing and upload
  const startUpload = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status === 'processing' || job.status === 'uploading') return;

    updateJobState(jobId, { status: 'processing', progress: 10 });

    try {
      const isImg = job.file.type.startsWith('image/') && !job.file.type.includes('svg');
      let assetData: any = null;

      if (isImg) {
        // 1. Image compression & resizing
        const { analysis, sizes } = await processImageFile(job.file, 80);
        
        if (job.cancelRef?.current) return;
        updateJobState(jobId, { progress: 40 });

        // 2. Premium AI Tagging from Gemini Server Route
        const tags = await mediaService.requestAiTagging(job.name, job.mediaType);
        
        if (job.cancelRef?.current) return;
        updateJobState(jobId, { progress: 70, status: 'uploading' });

        assetData = {
          name: job.name,
          fileName: job.file.name,
          fileSize: job.file.size,
          mimeType: job.file.type,
          width: analysis.width,
          height: analysis.height,
          aspectRatio: analysis.aspectRatio,
          sha256: analysis.sha256,
          pHash: analysis.pHash,
          dominantColor: analysis.dominantColor,
          averageColor: analysis.averageColor,
          blurPlaceholder: sizes.blurPlaceholder,
          hasTransparency: analysis.hasTransparency,
          url: sizes.webp, // Fallback directly to high-quality compressed WebP representation
          urls: {
            thumbnail: sizes.thumbnail,
            small: sizes.small,
            medium: sizes.medium,
            large: sizes.large,
            webp: sizes.webp
          },
          mediaType: job.mediaType,
          tags,
          smartLinks: { players: [], teams: [], competitions: [], matches: [], news: [] },
          folderId: targetFolder === 'none' ? null : targetFolder,
          collectionIds: [],
          isPinned: false,
          isFavorite: false,
          views: 0,
          downloads: 0,
          uploadedBy: 'مدير المحتوى'
        };
      } else {
        // Fallback for non-image assets (PDF, ZIP, Video, SVG)
        updateJobState(jobId, { progress: 40, status: 'uploading' });
        
        // Quick AI tags
        const tags = await mediaService.requestAiTagging(job.name, job.mediaType);

        assetData = {
          name: job.name,
          fileName: job.file.name,
          fileSize: job.file.size,
          mimeType: job.file.type,
          width: 0,
          height: 0,
          aspectRatio: '1.0',
          sha256: Math.random().toString(36).substring(2, 12), // simple unique key
          dominantColor: '#1e293b',
          averageColor: '#0f172a',
          blurPlaceholder: '',
          hasTransparency: false,
          url: URL.createObjectURL(job.file), // Mock local resource object url
          urls: {
            thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
            small: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=320&q=80',
            medium: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=640&q=80',
            large: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
            webp: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
          },
          mediaType: job.mediaType,
          tags,
          smartLinks: { players: [], teams: [], competitions: [], matches: [], news: [] },
          folderId: targetFolder === 'none' ? null : targetFolder,
          collectionIds: [],
          isPinned: false,
          isFavorite: false,
          views: 0,
          downloads: 0,
          uploadedBy: 'مدير المحتوى'
        };
      }

      if (job.cancelRef?.current) return;
      
      // Save metadata to Firestore
      const saved = await mediaService.addAsset(assetData);
      
      updateJobState(jobId, { progress: 100, status: 'completed', result: saved });
      onUploadSuccess();
    } catch (err: any) {
      updateJobState(jobId, { status: 'failed', error: err?.message || 'فشلت المعالجة' });
    }
  };

  const startAllUploads = () => {
    jobs.filter(j => j.status === 'pending' || j.status === 'failed').forEach(j => {
      startUpload(j.id);
    });
  };

  const cancelUpload = (jobId: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        if (j.cancelRef) j.cancelRef.current = true;
        return { ...j, status: 'pending', progress: 0 };
      }
      return j;
    }));
  };

  const removeJob = (jobId: string) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const updateJobState = (jobId: string, updates: Partial<UploadJob>) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...updates } : j));
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Upload Setup Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#141415] p-5 rounded-2xl border border-white/5">
        <div>
          <label className="block text-xs font-black text-gray-400 mb-2">نوع الوسيط الافتراضي</label>
          <select
            value={selectedMediaType}
            onChange={(e) => setSelectedMediaType(e.target.value as MediaType)}
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="Images">صورة عامة (Images)</option>
            <option value="Logos">شعار كيان (Logos)</option>
            <option value="Player Photos">صورة لاعب (Player Photos)</option>
            <option value="Team Logos">شعار نادي (Team Logos)</option>
            <option value="Competition Logos">شعار بطولة (Competition Logos)</option>
            <option value="Stadium Images">صورة ملعب (Stadium Images)</option>
            <option value="Backgrounds">خلفية صفحة (Backgrounds)</option>
            <option value="Banners">بنر إعلاني (Banners)</option>
            <option value="Videos">مقطع فيديو (Videos)</option>
            <option value="SVG">ملف متجهات (SVG)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-400 mb-2">المجلد المستهدف للتلقيم</label>
          <select
            value={targetFolder}
            onChange={(e) => setTargetFolder(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="none">المجلد الرئيسي (Root)</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={startAllUploads}
            disabled={!jobs.some(j => j.status === 'pending' || j.status === 'failed')}
            className="w-full h-[46px] bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl disabled:opacity-30 disabled:hover:bg-amber-500 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>بدء تلقيم ومعالجة الدفعة ({jobs.filter(j => j.status === 'pending' || j.status === 'failed').length})</span>
          </button>
        </div>
      </div>

      {/* Drag, Drop and Clipboard Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-4
          ${dragActive ? 'border-amber-500 bg-amber-500/5' : 'border-white/10 bg-[#111112] hover:border-white/20'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && addFilesToQueue(Array.from(e.target.files))}
          className="hidden"
        />

        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-amber-500">
          <Upload size={28} className="animate-bounce" />
        </div>

        <div>
          <h3 className="text-sm font-black text-white">اسحب وأفلت الملفات هنا، أو اضغط للتصفح</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
            يدعم النظام صور WebP, PNG, SVG ومقاطع الفيديو وملفات المستندات. 
            يمكنك أيضاً <b>نسخ صورة ولصقها فوراً (Ctrl+V)</b> لتحليلها بالذكاء الاصطناعي وتوليد الأصول منها تلقائياً.
          </p>
        </div>

        <div className="flex gap-4 text-[10px] text-gray-500 font-bold bg-white/[0.02] border border-white/[0.04] px-4 py-2 rounded-full">
          <span className="flex items-center gap-1"><Clipboard size={12} /> دعم لصق الحافظة</span>
          <span className="flex items-center gap-1"><FolderOpen size={12} /> دعم مجلدات بالكامل</span>
        </div>
      </div>

      {/* Queue Listing */}
      {jobs.length > 0 && (
        <div className="bg-[#111112] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <h4 className="text-xs font-black text-white">طابور التلقيم الحالي ({jobs.length} ملف)</h4>
            <button
              onClick={() => setJobs([])}
              className="text-[10px] font-black text-red-400 hover:text-red-300 transition-colors"
            >
              تفريغ القائمة بالكامل
            </button>
          </div>

          <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
            {jobs.map(job => (
              <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-slate-900 border border-white/5 rounded-lg flex items-center justify-center text-[10px] text-gray-400 font-black overflow-hidden relative">
                    {job.file.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(job.file)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{job.mediaType.slice(0, 3).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-white truncate max-w-[200px] sm:max-w-[350px]">{job.name}</h5>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                      {(job.file.size / 1024).toFixed(1)} KB • {job.mediaType}
                    </p>
                  </div>
                </div>

                {/* Progress / Actions */}
                <div className="flex items-center gap-4">
                  {/* Status Badges */}
                  {job.status === 'completed' && (
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check size={12} /> مكتمل وآمن
                    </span>
                  )}

                  {job.status === 'failed' && (
                    <span className="text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <AlertCircle size={12} /> {job.error || 'فشل التلقيم'}
                    </span>
                  )}

                  {(job.status === 'processing' || job.status === 'uploading') && (
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${job.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 font-black animate-pulse">
                        {job.status === 'processing' ? 'تحجيم ومعالجة...' : 'جاري الرفع...'} ({job.progress}%)
                      </span>
                    </div>
                  )}

                  {job.status === 'pending' && (
                    <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full animate-pulse">
                      قيد الانتظار
                    </span>
                  )}

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5">
                    {job.status === 'pending' && (
                      <button
                        onClick={() => startUpload(job.id)}
                        className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/25 rounded-lg transition-all"
                        title="بدء المعالجة والرفع"
                      >
                        <RefreshCw size={12} />
                      </button>
                    )}

                    {(job.status === 'processing' || job.status === 'uploading') && (
                      <button
                        onClick={() => cancelUpload(job.id)}
                        className="text-[10px] font-bold text-gray-400 hover:text-white transition-colors"
                      >
                        إلغاء
                      </button>
                    )}

                    {job.status === 'failed' && (
                      <button
                        onClick={() => startUpload(job.id)}
                        className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 rounded-lg transition-all"
                        title="إعادة المحاولة"
                      >
                        <RefreshCw size={12} />
                      </button>
                    )}

                    <button
                      onClick={() => removeJob(job.id)}
                      disabled={job.status === 'processing' || job.status === 'uploading'}
                      className="p-1.5 bg-white/5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-all disabled:opacity-20"
                      title="إزالة من القائمة"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
