import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Flame, Volume2, Trophy, Eye } from 'lucide-react';

interface StorySlide {
  title: string;
  description: string;
  image: string;
  category: string;
}

interface Story {
  id: number;
  title: string;
  category: string;
  coverImage: string;
  views: string;
  slides: StorySlide[];
}

const STORIES_DATA: Story[] = [
  {
    id: 1,
    title: 'تغطية خاصة',
    category: 'كأس العالم 2026',
    coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80',
    views: '12.5k',
    slides: [
      {
        category: 'كأس العالم 2026',
        title: 'مونديال 2026 يقترب 🏆',
        description: 'بدأ العد التنازلي رسمياً للنسخة الأكبر في التاريخ! 48 منتخباً سيتنافسون على المجد العالمي في ثلاث دول مستضيفة لأول مرة: الولايات المتحدة، كندا، والمكسيك.',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'
      },
      {
        category: 'الملاعب المستضيفة',
        title: 'صروح تكنولوجية مذهلة 🏟️',
        description: 'تم تجهيز 16 ملعباً بأحدث تقنيات التبريد الصديقة للبيئة والإنترنت فائق السرعة لتوفير تجربة جماهيرية استثنائية وغير مسبوقة في تاريخ كرة القدم.',
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 2,
    title: 'كواليس الملاعب',
    category: 'خلف الكواليس',
    coverImage: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80',
    views: '8.2k',
    slides: [
      {
        category: 'غرفة الملابس',
        title: 'لحظات التركيز الأخير 🤐',
        description: 'هنا يصنع المجد! لقطات حصرية ترصد اللحظات الصامتة المليئة بالتوتر الإيجابي والتركيز العالي للاعبين قبيل انطلاق صافرة البداية.',
        image: 'https://images.unsplash.com/photo-1504016798967-59a258e9386d?auto=format&fit=crop&w=800&q=80'
      },
      {
        category: 'روح الفريق',
        title: 'الكلمة التحفيزية الحاسمة 🗣️',
        description: 'خطاب القائد في الممر المؤدي للملعب يلهب حماس اللاعبين ويشحن طاقاتهم لتقديم كل ما لديهم طوال الـ 90 دقيقة من أجل الشعار والجماهير.',
        image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 3,
    title: 'حوار النجوم',
    category: 'مقابلات حصرية',
    coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
    views: '15.1k',
    slides: [
      {
        category: 'طموح الشباب',
        title: 'كتابة التاريخ بالذهب ✨',
        description: 'أبرز المواهب الصاعدة تؤكد في مقابلات خاصة: "طموحنا لا حدود له، وسنبذل قصارى جهدنا لكتابة أسمائنا بحروف من ذهب والتتويج بأغلى الألقاب القارية."',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80'
      },
      {
        category: 'صراع الهدافين',
        title: 'الحذاء الذهبي لمن؟ 👟',
        description: 'المنافسة تشتعل بين كبار مهاجمي أوروبا! صراع تكتيكي ورقمي مثير على لقب الهداف يضيف متعة إضافية للموسم الكروي الاستثنائي.',
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80'
      }
    ]
  },
  {
    id: 4,
    title: 'سبورة التكتيك',
    category: 'تحليل تكتيكي',
    coverImage: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=400&q=80',
    views: '9.4k',
    slides: [
      {
        category: 'أسرار المدربين',
        title: 'الضغط العالي المتكامل 📐',
        description: 'تحليل دقيق لكيفية تطبيق استراتيجية الضغط العكسي السريع في نصف ملعب الخصم لاستعادة الكرة بأقل من 5 ثوانٍ وحرمان المنافس من بناء الهجمات.',
        image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=800&q=80'
      },
      {
        category: 'التحول السريع',
        title: 'المرتدات الخاطفة ⚡',
        description: 'الدقة والسرعة هما المفتاح! التحول من الحالة الدفاعية إلى الهجومية بأقل عدد من التمريرات يربك دفاعات الخصم ويسهل الوصول للمرمى بفعالية تامة.',
        image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=80'
      }
    ]
  }
];

export default function PremiumStories() {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [viewedStories, setViewedStories] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('viewed_stories_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const SLIDE_DURATION = 6000; // 6 seconds per slide

  // Persist viewed stories
  const markAsViewed = (storyId: number) => {
    if (!viewedStories.includes(storyId)) {
      const updated = [...viewedStories, storyId];
      setViewedStories(updated);
      try {
        localStorage.setItem('viewed_stories_ids', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save viewed stories to localStorage', err);
      }
    }
  };

  const handleOpenStory = (index: number) => {
    setActiveStoryIndex(index);
    setActiveSlideIndex(0);
    setProgress(0);
    setIsPaused(false);
    markAsViewed(STORIES_DATA[index].id);
  };

  const handleCloseStory = () => {
    setActiveStoryIndex(null);
    setActiveSlideIndex(0);
    setProgress(0);
  };

  const handleNextSlide = () => {
    if (activeStoryIndex === null) return;
    const currentStory = STORIES_DATA[activeStoryIndex];
    
    if (activeSlideIndex < currentStory.slides.length - 1) {
      setActiveSlideIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // Go to next story if available
      if (activeStoryIndex < STORIES_DATA.length - 1) {
        setActiveStoryIndex(prev => prev + 1);
        setActiveSlideIndex(0);
        setProgress(0);
        markAsViewed(STORIES_DATA[activeStoryIndex + 1].id);
      } else {
        handleCloseStory();
      }
    }
  };

  const handlePrevSlide = () => {
    if (activeStoryIndex === null) return;
    
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // Go to previous story if available
      if (activeStoryIndex > 0) {
        setActiveStoryIndex(prev => prev - 1);
        const prevStory = STORIES_DATA[activeStoryIndex - 1];
        setActiveSlideIndex(prevStory.slides.length - 1);
        setProgress(0);
        markAsViewed(STORIES_DATA[activeStoryIndex - 1].id);
      } else {
        // Just reset the current slide if it is the absolute first
        setProgress(0);
      }
    }
  };

  // Autoplay effect
  useEffect(() => {
    if (activeStoryIndex === null || isPaused) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      return;
    }

    const intervalStep = 100; // Update every 100ms
    const increment = (intervalStep / SLIDE_DURATION) * 100;

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval.current!);
          handleNextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, intervalStep);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [activeStoryIndex, activeSlideIndex, isPaused]);

  return (
    <div className="space-y-3.5" id="premium-stories-wrapper">
      {/* Stories list */}
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none py-1.5" dir="rtl">
        {STORIES_DATA.map((story, index) => {
          const isViewed = viewedStories.includes(story.id);
          return (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              key={story.id}
              onClick={() => handleOpenStory(index)}
              className="flex flex-col items-center gap-2.5 shrink-0 focus:outline-none cursor-pointer group"
            >
              {/* Profile-like story circle with live neon ring */}
              <div className="relative">
                <div className={`w-[74px] h-[74px] rounded-full p-[3px] transition-all duration-300 ${
                  isViewed 
                    ? 'bg-white/10' 
                    : 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                }`}>
                  <div className="w-full h-full rounded-full border-[3px] border-[#080808] overflow-hidden bg-zinc-900">
                    <img 
                      src={story.coverImage} 
                      alt={story.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                
                {/* Visual live banner or views badge */}
                {!isViewed && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full scale-90 border border-[#080808]">
                    جديد
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-[11px] font-black text-white group-hover:text-amber-400 transition-colors">
                  {story.title}
                </span>
                <span className="text-[9px] text-gray-500 font-bold flex items-center gap-0.5">
                  <Eye size={10} />
                  {story.views}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Fullscreen Story Viewer Modal */}
      <AnimatePresence>
        {activeStoryIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col justify-center items-center backdrop-blur-xl"
            dir="rtl"
            id="fullscreen-story-viewer"
          >
            {/* Background Image Blurred for Immersive Vibe */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-110 pointer-events-none z-0"
              style={{ backgroundImage: `url(${STORIES_DATA[activeStoryIndex].slides[activeSlideIndex].image})` }}
            />

            {/* Story Card Container */}
            <motion.div 
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-[460px] h-[100dvh] sm:h-[820px] sm:max-h-[92dvh] sm:rounded-[2.5rem] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col justify-between bg-black z-10"
            >
              {/* Media Container */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={STORIES_DATA[activeStoryIndex].slides[activeSlideIndex].image} 
                  alt="Story content" 
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
                {/* Ambient dark bottom-up and top-down gradients */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/90" />
              </div>

              {/* TOP NAVIGATION BAR & PROGRESS CONTROLS */}
              <div className="relative z-10 p-4 space-y-3.5">
                {/* Multi-story Segmented Progress Bars */}
                <div className="flex gap-1.5 px-1">
                  {STORIES_DATA[activeStoryIndex].slides.map((_, idx) => (
                    <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-100 ease-linear rounded-full"
                        style={{
                          width: 
                            idx < activeSlideIndex 
                              ? '100%' 
                              : idx === activeSlideIndex 
                                ? `${progress}%` 
                                : '0%'
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Header Profile / Metadata */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 to-yellow-400">
                      <img 
                        src={STORIES_DATA[activeStoryIndex].coverImage} 
                        alt="Story Category Cover" 
                        className="w-full h-full rounded-full object-cover border border-black"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        {STORIES_DATA[activeStoryIndex].slides[activeSlideIndex].category}
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">{STORIES_DATA[activeStoryIndex].title}</span>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center gap-2">
                    {/* Pause/Play Button */}
                    <button 
                      onClick={() => setIsPaused(!isPaused)}
                      className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/90 hover:text-white transition-all cursor-pointer"
                      title={isPaused ? "Play" : "Pause"}
                    >
                      {isPaused ? <Play size={15} className="fill-white/80" /> : <Pause size={15} />}
                    </button>
                    {/* Close Button */}
                    <button 
                      onClick={handleCloseStory}
                      className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/90 hover:text-white transition-all cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* SIDES NAVIGATION TARGETS FOR TAP-TO-NEXT / TAP-TO-PREV */}
              <div className="absolute inset-y-24 inset-x-0 z-10 flex">
                {/* Left Side (Goes to PREV slide) */}
                <div 
                  className="w-1/3 h-full cursor-w-resize"
                  onClick={handlePrevSlide}
                />
                {/* Middle Passive Pause triggers on hold */}
                <div 
                  className="w-1/3 h-full"
                  onTouchStart={() => setIsPaused(true)}
                  onTouchEnd={() => setIsPaused(false)}
                  onMouseDown={() => setIsPaused(true)}
                  onMouseUp={() => setIsPaused(false)}
                />
                {/* Right Side (Goes to NEXT slide) */}
                <div 
                  className="w-1/3 h-full cursor-e-resize"
                  onClick={handleNextSlide}
                />
              </div>

              {/* STORIES NAVIGATION SIDE ARROWS (DESKTOP) */}
              <div className="absolute inset-y-0 -left-16 hidden lg:flex items-center justify-center z-20">
                <button
                  onClick={handlePrevSlide}
                  className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90 cursor-pointer border border-white/5"
                >
                  <ChevronRight size={22} />
                </button>
              </div>
              <div className="absolute inset-y-0 -right-16 hidden lg:flex items-center justify-center z-20">
                <button
                  onClick={handleNextSlide}
                  className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90 cursor-pointer border border-white/5"
                >
                  <ChevronLeft size={22} />
                </button>
              </div>

              {/* BOTTOM CAPTION & DISMISS INFO */}
              <div className="relative z-10 p-6 md:p-8 space-y-4">
                <motion.div
                  key={activeSlideIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2.5 text-right"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
                    <Flame size={12} className="animate-bounce" />
                    {STORIES_DATA[activeStoryIndex].slides[activeSlideIndex].category}
                  </span>
                  
                  <h2 className="text-xl md:text-2xl font-black text-white leading-tight drop-shadow-md">
                    {STORIES_DATA[activeStoryIndex].slides[activeSlideIndex].title}
                  </h2>
                  
                  <p className="text-xs md:text-sm text-gray-200 font-medium leading-relaxed drop-shadow">
                    {STORIES_DATA[activeStoryIndex].slides[activeSlideIndex].description}
                  </p>
                </motion.div>

                {/* Subtitle / Footer Interactive info */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1.5 font-bold text-[10px]">
                    <Trophy size={13} className="text-yellow-400" />
                    صافرة 90 • تغطية حية وحصرية
                  </span>
                  <span className="text-[10px] font-bold">
                    {activeSlideIndex + 1} / {STORIES_DATA[activeStoryIndex].slides.length}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
