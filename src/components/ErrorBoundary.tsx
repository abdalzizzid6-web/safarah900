import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { logEvent } from '../services/analyticsService';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  componentDidMount() {
    console.log('[ErrorBoundary] componentDidMount');
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    console.log('[ErrorBoundary] componentDidUpdate', { prevState, hasError: this.state.hasError });
  }

  public static getDerivedStateFromError(error: Error): State {
    console.error('[ErrorBoundary] getDerivedStateFromError', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] componentDidCatch', error, errorInfo);
    
    // Auto-reload on chunk load failures to synchronize assets with the server
    const message = error.message || '';
    const isChunkError = message.includes('Failed to fetch dynamically imported module') || 
                        message.includes('Importing a module script failed');
    
    if (isChunkError) {
      const lastReload = sessionStorage.getItem('session_repair_reload');
      const now = Date.now();
      // Rate limit reloads to once every 30 seconds to avoid 429 and infinity loops
      if (!lastReload || now - parseInt(lastReload) > 30000) {
        sessionStorage.setItem('session_repair_reload', now.toString());
        console.warn('[Critical Repair] Chunk load failure detected in ErrorBoundary. Forcing refresh...');
        window.location.reload();
        return;
      }
    }

    try {
      logEvent('error_boundary_catch', { message: error.message });
    } catch(e) {}
  }

  public render() {
    if (this.state.hasError) {
      console.log('[ErrorBoundary] Rendering fallback');
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-[#0F0F10] text-white flex items-center justify-center p-6 text-center" dir="rtl">
          <div className="bg-[#1A1A1A] p-8 rounded-3xl border border-red-500/20 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">عفواً، حدث خطأ غير متوقع</h1>
            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              تعذر تحميل بعض عناصر الصفحة. تم تفعيل نظام الاستعادة الآلي لمتابعة التصفح.
            </p>
            {this.state.error?.message && (
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-[11px] text-gray-400 font-mono mb-6 overflow-x-auto text-left dir-ltr">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-5 py-2.5 bg-[#D4AF37] text-black font-black rounded-xl flex items-center gap-2 hover:opacity-90 transition-all text-xs active:scale-95"
              >
                <RefreshCw size={16} />
                تحديث الصفحة
              </button>
              <button 
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-white/20 transition-all text-xs active:scale-95 border border-white/10"
              >
                <Home size={16} />
                الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
