import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Send, Plus, Trash2, RefreshCw, CheckCircle2, 
  AlertTriangle, Play, X, Eye, Image as ImageIcon, ChevronDown 
} from 'lucide-react';

interface QueuedPost {
  id: string;
  content: string;
  platforms: string[];
  media?: string[];
  status: 'scheduled' | 'publishing' | 'failed';
  scheduledFor?: string;
  error?: string;
  createdAt: string;
}

interface PublishedPost {
  id: string;
  content: string;
  platforms: string[];
  media?: string[];
  status: 'published' | 'failed';
  publishedAt: string;
  results?: Record<string, { success: boolean; error?: string; externalId?: string }>;
}

interface ConnectedAccount {
  id: string;
  platform: string;
  name: string;
}

const SocialScheduler: React.FC = () => {
  const [queuedPosts, setQueuedPosts] = useState<QueuedPost[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<PublishedPost[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  const fetchSchedulerData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch connected accounts
      const accRes = await fetch('/api/social/accounts');
      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData.accounts || []);
      }

      // 2. Fetch queue and published history
      const queueRes = await fetch('/api/social/queue');
      if (queueRes.ok) {
        const queueData = await queueRes.json();
        setQueuedPosts(queueData.queue || []);
        setPublishedPosts(queueData.posts || []);
      }
    } catch (err) {
      console.error('Failed to fetch scheduler data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedulerData();
  }, []);

  const handleAddMedia = () => {
    if (mediaUrl.trim() !== '') {
      setMediaList(prev => [...prev, mediaUrl.trim()]);
      setMediaUrl('');
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList(prev => prev.filter((_, i) => i !== index));
  };

  const handleTogglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId) 
        : [...prev, platformId]
    );
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlatforms.length === 0) {
      setToast({ message: 'يرجى اختيار منصة تواصل واحدة على الأقل للنشر!', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const response = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postContent,
          platforms: selectedPlatforms,
          media: mediaList,
          scheduledFor: isScheduled && scheduleTime ? scheduleTime : null
        })
      });

      const data = await response.json();
      if (response.ok) {
        setToast({ 
          message: isScheduled ? 'تمت جدولة المنشور بنجاح!' : 'تم إطلاق المنشور وبدء النشر المباشر!', 
          type: 'success' 
        });
        setShowCreateModal(false);
        // Reset form
        setPostContent('');
        setSelectedPlatforms([]);
        setMediaList([]);
        setScheduleTime('');
        setIsScheduled(false);
        fetchSchedulerData();
      } else {
        setToast({ message: data.error || 'فشل إتمام عملية النشر', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPost = async (id: string) => {
    if (!confirm('هل تود إلغاء جدولة هذا المنشور وحذفه من قائمة الانتظار؟')) return;
    try {
      const response = await fetch(`/api/social/queue/${id}/cancel`, { method: 'POST' });
      if (response.ok) {
        setToast({ message: 'تم إلغاء جدولة المنشور بنجاح', type: 'success' });
        fetchSchedulerData();
      }
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleRetryPost = async (id: string) => {
    try {
      const response = await fetch(`/api/social/queue/${id}/retry`, { method: 'POST' });
      if (response.ok) {
        setToast({ message: 'تم بدء إعادة محاولة نشر المنشور في الخلفية الآن!', type: 'success' });
        fetchSchedulerData();
      }
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-primary" />
          الجدولة والمحتوى
        </h2>
        <button 
          onClick={() => {
            if (accounts.length === 0) {
              setToast({ message: 'يرجى ربط حساب تواصل اجتماعي نشط واحد على الأقل أولاً!', type: 'error' });
              return;
            }
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary-hover flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-primary/10"
        >
          <Plus className="w-4 h-4" />
          إنشاء منشور جديد
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
        <div className="space-y-4">
          <div className="h-40 bg-surface rounded-xl animate-pulse" />
          <div className="h-40 bg-surface rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Queue Section */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white">منشورات قيد الانتظار</h3>
            
            {queuedPosts.length === 0 ? (
              <div className="bg-surface rounded-xl border border-white/5 p-12 text-center">
                <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">لا توجد منشورات مجدولة حالياً</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queuedPosts.map(post => (
                  <div key={post.id} className="bg-surface rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-1.5">
                          {post.platforms.map(p => (
                            <span key={p} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold uppercase">
                              {p}
                            </span>
                          ))}
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                          post.status === 'failed' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {post.status === 'failed' ? 'فشل النشر' : 'مجدول'}
                        </span>
                      </div>
                      <p className="text-gray-200 text-sm whitespace-pre-line leading-relaxed">{post.content}</p>
                      
                      {post.media && post.media.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                          {post.media.map((m, idx) => (
                            <img key={idx} src={m} alt="Attachment" className="w-16 h-16 object-cover rounded-lg border border-white/10 shrink-0" referrerPolicy="no-referrer" />
                          ))}
                        </div>
                      )}

                      {post.error && (
                        <p className="text-xs text-red-400 mt-2 font-mono bg-red-950/20 p-2 rounded-lg border border-red-500/10">
                          الخطأ: {post.error}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-white/5 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString('ar-SA') : 'جارِ المعالجة فوراً'}
                      </span>
                      
                      <div className="flex gap-2">
                        {post.status === 'failed' && (
                          <button 
                            onClick={() => handleRetryPost(post.id)}
                            className="px-2.5 py-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 flex items-center gap-1 font-bold"
                          >
                            <RefreshCw className="w-3 h-3" />
                            إعادة المحاولة
                          </button>
                        )}
                        <button 
                          onClick={() => handleCancelPost(post.id)}
                          className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 flex items-center gap-1 font-bold"
                        >
                          <Trash2 className="w-3 h-3" />
                          إلغاء
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Published History Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">سجل المنشورات السابقة</h3>
            
            {publishedPosts.length === 0 ? (
              <div className="bg-surface rounded-xl border border-white/5 p-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-xs">لا يوجد سجل تاريخي للنشر حتى الآن</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {publishedPosts.map(post => (
                  <div key={post.id} className="bg-surface rounded-xl border border-white/5 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        {post.platforms.map(p => (
                          <span key={p} className="px-1.5 py-0.5 rounded bg-surface-elevated text-gray-400 text-[10px] font-bold uppercase">
                            {p}
                          </span>
                        ))}
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        post.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                      }`}>
                        {post.status === 'failed' ? 'فشل جزئي' : 'تم النشر'}
                      </span>
                    </div>

                    <p className="text-gray-300 text-xs line-clamp-3 leading-relaxed">{post.content}</p>
                    
                    <span className="block text-[10px] text-gray-500 font-mono">
                      {new Date(post.publishedAt).toLocaleString('ar-SA')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface rounded-2xl border border-white/10 w-full max-w-xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-elevated">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                صياغة ونشر منشور جديد
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreatePost}>
              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                {/* Platform selection */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300 block">منصات الوجهة المستهدفة:</label>
                  <div className="flex flex-wrap gap-2">
                    {accounts.map(acc => {
                      const isSelected = selectedPlatforms.includes(acc.platform);
                      return (
                        <button
                          type="button"
                          key={acc.id}
                          onClick={() => handleTogglePlatform(acc.platform)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected 
                              ? 'bg-primary border-primary text-black' 
                              : 'bg-surface-elevated border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {acc.name} ({acc.platform.toUpperCase()})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content body */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-300 block">نص المنشور:</label>
                  <textarea
                    required
                    rows={4}
                    value={postContent}
                    onChange={e => setPostContent(e.target.value)}
                    placeholder="ماذا تود أن تنشر اليوم؟ أدخل النص أو صغ خبرك ووسومك هنا..."
                    className="w-full bg-surface-elevated text-white border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Media list */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300 block">مرفقات الصور أو الفيديو (URL):</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="أدخل رابط الميديا المباشر (مثل https://...)"
                      value={mediaUrl}
                      onChange={e => setMediaUrl(e.target.value)}
                      className="flex-1 bg-surface-elevated text-white border border-white/10 rounded-lg py-1.5 px-3 text-xs outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddMedia}
                      className="px-3 bg-surface-elevated text-white border border-white/10 hover:border-primary/40 rounded-lg text-xs font-bold"
                    >
                      إضافة
                    </button>
                  </div>
                  {mediaList.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {mediaList.map((url, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-white/10 w-16 h-16">
                          <img src={url} alt="Attachment Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(idx)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-red-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scheduler switch */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={() => setIsScheduled(!isScheduled)}
                      className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface"
                    />
                    <span className="text-sm font-semibold text-gray-300">جدولة وتأجيل موعد النشر التلقائي</span>
                  </label>

                  {isScheduled && (
                    <div className="space-y-1.5 pl-8">
                      <label className="text-xs font-semibold text-gray-400">تاريخ ووقت النشر الآلي:</label>
                      <input
                        type="datetime-local"
                        required={isScheduled}
                        value={scheduleTime}
                        onChange={e => setScheduleTime(e.target.value)}
                        className="bg-surface-elevated text-white border border-white/10 rounded-lg py-1.5 px-3 text-xs focus:border-primary outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-surface-elevated">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface hover:bg-surface/80 border border-white/5 text-gray-400 hover:text-white text-sm font-semibold"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-primary text-black hover:bg-primary-hover text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري التحضير والنشر...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {isScheduled ? 'جدولة المنشور' : 'نشر المحتوى الآن'}
                    </>
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

export default SocialScheduler;
