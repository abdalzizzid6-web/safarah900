import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { 
  Maximize2, Minimize2, Play, Pause, Volume2, VolumeX, Settings2, Sliders, ExternalLink, 
  RefreshCw, ChevronLeft, Wifi, Tv, Sparkles, Activity, ShieldAlert, Check, HelpCircle, 
  Monitor, ZoomIn, ZoomOut, RotateCw, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Hls from 'hls.js';
import { VideoPlayerSettings } from './video-player/VideoPlayerSettings';

interface QualityLink {
  label: string;
  quality: string;
  url: string;
}

interface VideoPlayerProps {
  url: string;
  poster?: string;
  title?: string;
  blockAds?: boolean;
  qualities?: QualityLink[];
  activeQualityIndex?: number;
  onQualityChange?: (index: number) => void;
  onQualityToggle?: () => void;
  currentQuality?: string;
  nextQualityLabel?: string;
  onStreamError?: (errMessage: string) => void;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
}

export default function VideoPlayer({ 
  url, 
  poster, 
  title, 
  blockAds = true,
  qualities = [],
  activeQualityIndex = 0,
  onQualityChange,
  onQualityToggle,
  currentQuality,
  nextQualityLabel,
  onStreamError,
  isTheaterMode = false,
  onToggleTheater
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'main' | 'speed' | 'quality' | 'aspect' | 'stats' | 'zoom'>('main');
  
  // Aspect ratio & zooming states
  const [aspectRatio, setAspectRatio] = useState<'16:9' | 'stretch' | '4:3' | 'cover'>('16:9');
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoomMode, setZoomMode] = useState<'fit' | 'fill' | 'custom'>('fit');
  
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hlsError, setHlsError] = useState<string | null>(null);
  const [showAmbientGLow, setShowAmbientGlow] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [useNativeControls, setUseNativeControls] = useState(false);

  const [stats, setStats] = useState({
    bitrate: 'جاري التحليل...',
    fps: 60,
    dropped: 0,
    bufferLength: 0,
    latency: 'اتصال مباشر فائق السرعة ⚡'
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to handle pinch touch states
  const touchStartRef = useRef<{ dist: number; scale: number; x: number; y: number } | null>(null);
  const lastTouchTimeRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Detect url type
  const isM3U8 = url && (url.trim().endsWith('.m3u8') || url.includes('.m3u8?'));
  const isEmbedCode = url && (url.trim().startsWith('<') || url.includes('<iframe') || url.includes('<script') || url.includes('<embed') || url.includes('</iframe'));
  const isYouTubeUrl = url && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('/embed/'));

  // Controls auto-hide functionality
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettings && !isBuffering) {
        setShowControls(false);
      }
    }, 3500);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showSettings, isBuffering]);

  // Mobile Landscape Rotation Detection
  useEffect(() => {
    const handleMobileLandscapeDetection = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isSmallScreen = window.innerWidth <= 960; // Mobile or tablet
      const active = isSmallScreen && isLandscape;
      setIsMobileLandscape(active);

      if (active) {
        document.body.classList.add('mobile-landscape-active');
      } else {
        document.body.classList.remove('mobile-landscape-active');
      }
    };

    window.addEventListener('resize', handleMobileLandscapeDetection);
    window.addEventListener('orientationchange', handleMobileLandscapeDetection);
    handleMobileLandscapeDetection();

    return () => {
      window.removeEventListener('resize', handleMobileLandscapeDetection);
      window.removeEventListener('orientationchange', handleMobileLandscapeDetection);
      document.body.classList.remove('mobile-landscape-active');
    };
  }, []);

  // Monitor Native Fullscreen State
  useEffect(() => {
    const onFullscreenChange = () => {
      const fsElement = 
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement || 
        (document as any).msFullscreenElement;
        
      setIsFullscreen(!!fsElement);
      if (!fsElement) {
        setUseNativeControls(false);
      }
    };
    
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
    };
  }, []);

  const [hlsQualities, setHlsQualities] = useState<QualityLink[]>([]);

  // HLS.js Lifecycle integration
  useEffect(() => {
    if (!isM3U8 || !isPlaying || !videoRef.current) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const videoElement = videoRef.current;
    
    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setHasError(false);
    setHlsError(null);
    setIsBuffering(true);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 15,
        maxBufferSize: 30 * 1000 * 1000, // 30MB
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsBuffering(false);
        
        // Auto-detect levels
        if (data.levels && data.levels.length > 0) {
          const detectedQualities = data.levels.map((level, idx) => ({
            label: `${level.height}p`,
            quality: `${level.height}p`,
            url: '' // Internally managed by hls.js
          })).reverse();
          setHlsQualities(detectedQualities);
        }

        videoElement.play().catch((err) => {
          console.warn("Autoplay auto-blocked or failed: ", err);
        });
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        setIsBuffering(false);
      });

      // Periodically update statistics
      const interval = setInterval(() => {
        if (hls.levels && hls.currentLevel !== -1) {
          const level = hls.levels[hls.currentLevel];
          if (level) {
            const currentBitrateKb = Math.round(level.bitrate / 1000);
            setStats(prev => ({
              ...prev,
              bitrate: `${currentBitrateKb} Kbps`,
              bufferLength: Math.round(videoElement.buffered.length > 0 ? (videoElement.buffered.end(0) - videoElement.currentTime) : 0),
              dropped: videoElement.getVideoPlaybackQuality ? videoElement.getVideoPlaybackQuality().droppedVideoFrames : prev.dropped
            }));
          }
        }
      }, 2000);

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Live streaming error: ", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setHlsError("خطأ في شبكة البث المباشر. جاري المحاولة...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setHlsError("خطأ في معالجة البث. جاري التخطي والتعديل...");
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              setHlsError("تعذر تشغيل المشغل. السيرفر متوقف حالياً.");
              onStreamError?.("HLS stream stopped working");
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        clearInterval(interval);
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // iOS Native compatibility
      videoElement.src = url;
      setIsBuffering(false);
      videoElement.addEventListener('loadedmetadata', () => {
        videoElement.play().catch(() => {});
      });
    } else {
      setHasError(true);
      setHlsError("متصفحك لا يدعم بروتوكول HLS أو تشغيل البث المباشر مدمجاً.");
      onStreamError?.("HLS not supported by engine");
    }
  }, [url, isPlaying]);

  // Handle Play/Pause for HLS
  const handlePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(true);
      });
    }
  };

  // Synchronize playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Synchronize volume & mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const handleQualitySelect = (index: number) => {
    if (qualities && qualities.length > 0) {
      onQualityChange?.(index);
    } else if (hlsRef.current && hlsQualities.length > 0) {
      // HLS Level switching
      // The qualities are reversed in display, so map back correctly
      const actualLevelIndex = hlsQualities.length - 1 - index;
      hlsRef.current.currentLevel = actualLevelIndex;
      onQualityChange?.(index); // Optional callback
    }
    setActiveMenu('main');
  };

  const toggleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSettings(!showSettings);
    setActiveMenu('main');
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setHlsError(null);
    setIsBuffering(true);
    if (isM3U8 && hlsRef.current) {
      hlsRef.current.loadSource(url);
      videoRef.current?.play().catch(() => {});
    } else {
      const iframe = playerRef.current?.querySelector('iframe');
      if (iframe) {
        const currentSrc = iframe.src;
        iframe.src = '';
        setTimeout(() => {
          iframe.src = currentSrc;
          setIsBuffering(false);
        }, 150);
      } else {
        setTimeout(() => setIsBuffering(false), 800);
      }
    }
  };

  const handleFullscreen = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const element = playerRef.current;
    const video = videoRef.current;

    if (!element) return;

    // Check if currently in fullscreen
    const isFS = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isFS) {
      // Enter Fullscreen
      const requestFullscreen = 
        element.requestFullscreen || 
        (element as any).webkitRequestFullscreen || 
        (element as any).mozRequestFullScreen || 
        (element as any).msRequestFullscreen;

      if (requestFullscreen) {
        requestFullscreen.call(element).then(() => {
          setIsFullscreen(true);
          // Auto-enable native controls on mobile in fullscreen for better UX
          if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            setUseNativeControls(true);
          }
        }).catch((err: any) => {
          console.warn("Fullscreen request failed, trying video fallback:", err);
          if (video && (video as any).webkitEnterFullscreen) {
            (video as any).webkitEnterFullscreen();
          }
        });
      } else if (video && (video as any).webkitEnterFullscreen) {
        // iOS Safari specific
        (video as any).webkitEnterFullscreen();
      }
    } else {
      // Exit Fullscreen
      const exitFullscreen = 
        document.exitFullscreen || 
        (document as any).webkitExitFullscreen || 
        (document as any).mozCancelFullScreen || 
        (document as any).msExitFullscreen;

      if (exitFullscreen) {
        exitFullscreen.call(document);
        setIsFullscreen(false);
        setUseNativeControls(false);
      }
    }
  };

  // ZOOM CONTROLS IMPLEMENTATION
  const applyPresetZoom = (mode: 'fit' | 'fill' | 'zoom15' | 'zoom20') => {
    setZoomMode(mode === 'fit' ? 'fit' : mode === 'fill' ? 'fill' : 'custom');
    if (mode === 'fit') {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
    } else if (mode === 'fill') {
      setZoomScale(1.35); // Expand to fill aspects nicely
      setPanOffset({ x: 0, y: 0 });
    } else if (mode === 'zoom15') {
      setZoomScale(1.5);
    } else if (mode === 'zoom20') {
      setZoomScale(2);
    }
  };

  // Handle touch events for gesture pinch and double-tap zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEmbedCode) return; // Ignore on iframe nodes to maintain outer interaction
    
    // Check Double Tap
    const now = Date.now();
    const timeDiff = now - lastTouchTimeRef.current;
    if (timeDiff < 300 && e.touches.length === 1) {
      e.preventDefault();
      // Cycle through zoom presets
      if (zoomScale === 1) {
        applyPresetZoom('zoom15');
      } else if (zoomScale === 1.5) {
        applyPresetZoom('zoom20');
      } else {
        applyPresetZoom('fit');
      }
      lastTouchTimeRef.current = now;
      return;
    }
    lastTouchTimeRef.current = now;

    // Pinch Zoom Start
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartRef.current = {
        dist,
        scale: zoomScale,
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
    } else if (e.touches.length === 1 && zoomScale > 1) {
      // Setup dragging / panning when zoomed in
      const t = e.touches[0];
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: t.clientX,
        y: t.clientY,
        panX: panOffset.x,
        panY: panOffset.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isEmbedCode) return;

    // Handle Pinch Zooming
    if (e.touches.length === 2 && touchStartRef.current) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = dist / touchStartRef.current.dist;
      const newScale = Math.min(Math.max(touchStartRef.current.scale * factor, 1), 4);
      setZoomScale(newScale);
      setZoomMode('custom');
    } else if (e.touches.length === 1 && isDraggingRef.current && zoomScale > 1) {
      // Handle Panning drag
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - dragStartRef.current.x;
      const dy = t.clientY - dragStartRef.current.y;
      
      // Limit panning bounds
      const limit = (zoomScale - 1) * 160;
      setPanOffset({
        x: Math.min(Math.max(dragStartRef.current.panX + dx, -limit), limit),
        y: Math.min(Math.max(dragStartRef.current.panY + dy, -limit), limit)
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    isDraggingRef.current = false;
  };

  // Keyboard Event Handlers for stream interaction & exit full screen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFS);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === 'm') {
        e.preventDefault();
        setIsMuted(!isMuted);
      } else if (e.key === 'f') {
        e.preventDefault();
        handleFullscreen();
      } else if (e.key === 't') {
        e.preventDefault();
        onToggleTheater?.();
      } else if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setVolume(v => Math.min(100, v + 5));
        setIsMuted(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setVolume(v => Math.max(0, v - 5));
      } else if (e.key === '+') {
        setZoomScale(z => Math.min(z + 0.1, 3.5));
      } else if (e.key === '-') {
        setZoomScale(z => Math.max(z - 0.1, 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isPlaying, isMuted, volume, isFullscreen]);

  // Direct scale zooming logic style object
  const transformStyle = {
    transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
    transition: isDraggingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.1, 0.76, 0.55, 0.94)'
  };

  return (
    <div 
      id="player-section"
      ref={playerRef}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
      className={`relative w-full bg-black overflow-hidden shadow-2xl transition-all duration-500 ring-1 ring-white/10 group select-none ${
        isMobileLandscape 
          ? 'fixed inset-0 z-[9999] rounded-none w-full h-screen' 
          : isFullscreen 
            ? 'rounded-none w-full h-screen' 
            : 'rounded-[1.5rem] md:rounded-[2rem]'
      } ${
        isTheaterMode && !isFullscreen && !isMobileLandscape 
          ? 'aspect-[21/9] w-full' 
          : 'aspect-video w-full'
      }`}
    >
      {/* Decorative ambient stadium arena lighting glow */}
      {showAmbientGLow && isPlaying && (
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-amber-500/5 to-blue-500/5 blur-3xl opacity-60 pointer-events-none -z-10 animate-pulse" />
      )}

      {/* Start Playing Hero Banner */}
      {!isPlaying ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-500 h-full">
          {!!poster && (
            <img 
              src={poster || undefined} 
              alt="Stadium Cover" 
              className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay transition-transform duration-1000 scale-105 group-hover:scale-110" 
              referrerPolicy="no-referrer"
            />
          )}

          {/* Golden Stadium Glow effect */}
          <div className="absolute w-[450px] h-[450px] bg-gradient-to-br from-amber-500/10 to-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

          {/* Premium Play Button */}
          <motion.button
            whileHover={{ scale: 1.08, boxShadow: "0 0 50px rgba(245, 158, 11, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPlaying(true)}
            className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-tr from-amber-500 to-amber-400 text-black rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.4)] transition-all cursor-pointer relative z-30"
          >
            <Play fill="black" size={42} className="translate-x-1" />
            <span className="absolute inset-x-0 -bottom-1 w-[130%] h-[130%] -m-[15%] rounded-full border border-amber-500/20 animate-ping -z-10" />
          </motion.button>
          
          <div className="mt-8 text-center relative z-30 max-w-md px-6">
            <span className="text-[10px] sm:text-xs font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 rounded-full mb-3 inline-flex items-center gap-1.5 tracking-widest leading-none">
              <Sparkles size={12} className="text-amber-500 animate-pulse" />
              <span>جودة بث فائقة السرعة 4K UHD</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md mb-2">{title || 'بث مباشر للمباراة'}</h3>
            <p className="text-gray-400 text-xs sm:text-sm font-semibold">استمتع بتغطية سينمائية وصوت محيطي مباشر من قلب الملعب</p>
          </div>
        </div>
      ) : (
        /* Video/Iframe Content Node */
        <div 
          onClick={() => !isEmbedCode && handlePlayPause()}
          className="absolute inset-0 w-full h-full z-10 flex items-center justify-center cursor-pointer overflow-hidden bg-black"
        >
          {isEmbedCode ? (
            <div 
              className="w-full h-full relative border-0 [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0 [&_iframe]:absolute [&_iframe]:inset-0 [&_video]:w-full [&_video]:h-full [&_video]:absolute [&_video]:inset-0 pointer-events-auto"
              style={transformStyle}
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(url || '', {
                  ALLOWED_TAGS: ['iframe', 'video', 'source', 'embed', 'object', 'div', 'p', 'span'],
                  ALLOWED_ATTR: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'allow', 'style', 'class', 'id', 'controls', 'autoplay', 'muted', 'playsinline', 'preload', 'type', 'referrerpolicy']
                }) 
              }}
            />
          ) : isM3U8 ? (
            <video
              ref={videoRef}
              poster={poster}
              style={transformStyle}
              className={`w-full h-full bg-black transition-all duration-300 ${
                aspectRatio === 'stretch' ? 'object-fill' : 
                aspectRatio === 'cover' ? 'object-cover' :
                aspectRatio === '4:3' ? 'object-contain max-w-[75%]' : 
                'object-contain'
              }`}
              playsInline
              crossOrigin="anonymous"
              controls={useNativeControls}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <iframe
              src={url || undefined}
              style={transformStyle}
              className="w-full h-full border-0 absolute inset-0 pointer-events-auto"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              sandbox={blockAds 
                ? "allow-scripts allow-same-origin allow-presentation allow-forms" 
                : "allow-scripts allow-same-origin allow-presentation allow-forms allow-popups-to-escape-sandbox"}
              title="Match Stream"
              referrerPolicy="no-referrer"
            />
          )}

          {/* Fullscreen Helper Button */}
          {isPlaying && !isFullscreen && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: showControls ? 1 : 0, scale: showControls ? 1 : 0.8 }}
              onClick={handleFullscreen}
              className="absolute top-1/2 right-4 -translate-y-1/2 z-30 p-4 bg-amber-500 text-black rounded-2xl shadow-2xl flex flex-col items-center gap-1 hover:scale-110 active:scale-95 transition-all"
            >
              <Maximize2 size={24} />
              <span className="text-[10px] font-black leading-none">شاشة كاملة</span>
            </motion.button>
          )}

          {/* Pulsing LIVE Badge */}
          {isPlaying && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-6 left-6 z-40"
            >
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl shadow-2xl ring-1 ring-red-500/30">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </div>
                <span className="text-[10px] font-black text-white tracking-widest uppercase">مباشر</span>
              </div>
            </motion.div>
          )}

          {isBuffering && !hasError && (
            <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                <Tv className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" size={20} />
              </div>
              <p className="mt-4 text-xs font-black text-amber-500 tracking-wider">جاري تحميل البث وتأمين الاتصال بالملعب...</p>
            </div>
          )}

          {/* Streaming error warning modal */}
          {hasError && (
            <div className="absolute inset-0 z-30 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center" onClick={(e) => e.stopPropagation()}>
              <ShieldAlert size={50} className="text-amber-500 mb-4 animate-bounce" />
              <h4 className="text-xl font-black text-white mb-2">رابط البث غير مستقر حالياً</h4>
              <p className="text-gray-400 text-xs sm:text-sm max-w-md mb-6">{hlsError || 'يجري الآن تشغيل نظام الكشف التلقائي عن الأعطال والتبديل إلى سيرفرات بديلة.'}</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleRefresh}
                  className="flex items-center gap-2 bg-amber-500 text-black font-black text-xs px-5 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  <RefreshCw size={14} />
                  <span>إعادة تحميل المشغل</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Overlay HUD & Full Controls Menu */}
      <AnimatePresence>
        {isPlaying && showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 z-20 bg-gradient-to-t from-black/90 via-black/10 to-black/80"
          >
            {/* Top HUD Row Bar */}
            <div className="flex justify-between items-start pointer-events-auto">
              <div className="flex items-center gap-2">
                <div className="bg-amber-500 text-black px-3 py-1.5 rounded-full flex items-center gap-2 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                  <span className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase">HD 1080P المباشر</span>
                </div>
                
                {title && (
                  <span className="text-white text-xs font-black backdrop-blur-md bg-black/50 px-4 py-1.5 rounded-xl border border-white/5 truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                    {title}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Information notification tag */}
                {zoomScale > 1 && (
                  <span className="bg-black/60 text-amber-500 border border-amber-500/20 text-[9px] font-black px-3 py-1.5 rounded-xl animate-pulse flex items-center gap-1">
                    <ZoomIn size={11} />
                    <span>تكبير {zoomScale.toFixed(1)}x (اسحب للتحريك)</span>
                  </span>
                )}

                {/* Ambient glow Toggle */}
                <button
                  onClick={() => setShowAmbientGlow(!showAmbientGLow)}
                  className={`p-2.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                    showAmbientGLow ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-black/50 text-gray-400 border-white/5 hover:text-white'
                  }`}
                  title="وهج الضوء المحيط"
                >
                  <Sparkles size={15} />
                </button>

                {/* Redundant Force rotation suggestion info for custom rotation */}
                <div className="block md:hidden">
                  <button
                    onClick={() => {
                      // Attempt lock orientation if browser allows
                      try {
                        if (document.fullscreenElement && (window.screen as any).orientation) {
                          (window.screen as any).orientation.lock('landscape').catch(() => {});
                        }
                      } catch (_) {}
                    }}
                    className="bg-black/50 backdrop-blur-md border border-white/5 text-gray-300 p-2.5 rounded-xl hover:text-white transition-all cursor-pointer"
                    title="تحوير تدوير الهاتف"
                  >
                    <RotateCw size={14} className="animate-pulse" />
                  </button>
                </div>

                <button 
                  onClick={handleRefresh}
                  className="bg-black/50 backdrop-blur-md border border-white/5 text-gray-300 hover:text-white p-2.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                  title="تحديث السيرفر"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            {/* Embedded Iframe Source overlay feedback */}
            {isEmbedCode && (
              <div className="self-center bg-black/75 border border-amber-500/10 backdrop-blur-md rounded-2xl px-5 py-3 text-center max-w-sm pointer-events-auto shadow-xl">
                <div className="flex items-center gap-2 justify-center mb-0.5">
                  <Activity size={12} className="text-amber-500" />
                  <p className="text-[10px] text-amber-400 font-black">جاهزية الخادم الخارجي مدمجة ✅</p>
                </div>
                <p className="text-[9px] text-gray-400 font-bold leading-normal">للتحكم بالصوت أو الدقة، انقر مباشرة داخل نافذة الفاصل بمشغل المصدر.</p>
              </div>
            )}

            {/* Bottom Controls Area Panel */}
            <div className="pointer-events-auto w-full transition-all duration-350">
              <div className="bg-[#0b0c10]/90 backdrop-blur-2xl rounded-[1.5rem] p-3 md:p-4 flex items-center justify-between gap-4 border border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.7)]">
                 <div className="flex items-center gap-3">
                    {/* Play/Pause control */}
                    {!isEmbedCode && (
                      <button 
                        onClick={() => handlePlayPause()}
                        className="w-11 h-11 rounded-full bg-amber-500 text-black hover:scale-105 active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                      >
                        {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" className="translate-x-0.5" />}
                      </button>
                    )}

                    {/* Audio controller */}
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl hover:text-amber-500 transition-colors text-white/90 cursor-pointer"
                        title={isMuted ? "إلغاء كتم الصوت" : "كتم الصوت"}
                      >
                        {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                      
                      <div className="hidden sm:flex items-center gap-2 group/volume w-20">
                         <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden relative group-hover/volume:h-2 transition-all">
                            <div 
                              className="h-full bg-amber-500" 
                              style={{ width: `${isMuted ? 0 : volume}%` }} 
                            />
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={isMuted ? 0 : volume}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setVolume(val);
                                if (val > 0) setIsMuted(false);
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer h-full"
                            />
                         </div>
                      </div>
                    </div>

                    {/* Quality badge indicator */}
                    {isM3U8 && (
                      <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-black uppercase">
                        <Wifi size={11} className="animate-pulse text-emerald-400" />
                        <span>مستقر جداً • 60FPS</span>
                      </div>
                    )}
                 </div>

                 {/* Custom Controls Hub buttons split */}
                 <VideoPlayerSettings
                   showSettings={showSettings}
                   setShowSettings={setShowSettings}
                   activeMenu={activeMenu}
                   setActiveMenu={setActiveMenu}
                   isM3U8={isM3U8}
                   qualities={qualities}
                   activeQualityIndex={activeQualityIndex}
                   currentQuality={currentQuality}
                   nextQualityLabel={nextQualityLabel}
                   speed={speed}
                   setSpeed={setSpeed}
                   aspectRatio={aspectRatio}
                   setAspectRatio={setAspectRatio}
                   useNativeControls={useNativeControls}
                   setUseNativeControls={setUseNativeControls}
                   zoomScale={zoomScale}
                   setZoomScale={setZoomScale}
                   zoomMode={zoomMode}
                   applyPresetZoom={applyPresetZoom}
                   hlsQualities={hlsQualities}
                   handleQualitySelect={handleQualitySelect}
                   stats={stats}
                   onToggleTheater={onToggleTheater}
                   isTheaterMode={isTheaterMode}
                   isFullscreen={isFullscreen}
                   handleFullscreen={handleFullscreen}
                   toggleSettings={toggleSettings}
                   onQualityToggle={onQualityToggle}
                 />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Universal settings dismissal click-shield */}
      {showSettings && (
        <div 
          className="absolute inset-0 z-20 cursor-default"
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
