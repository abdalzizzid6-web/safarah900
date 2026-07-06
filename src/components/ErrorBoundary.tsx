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
        <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center p-6 text-center">
          <div className="bg-[#1A1A1A] p-8 rounded-3xl border border-red-500/20 max-w-md w-full">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-black text-white mb-4">Oops! Something went wrong.</h1>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto">
              {this.state.error?.message || "An unexpected error has occurred."}
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-xl flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <RefreshCw size={18} />
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-white/20 transition-opacity"
              >
                <Home size={18} />
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
