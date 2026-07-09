import React from 'react';
import { motion } from 'motion/react';
import { getSectionComponent } from './SectionRegistry';
import { HomepageBlock, Match } from '../../types';

interface HomePageRendererProps {
  blocks: HomepageBlock[];
  featuredMatch?: Match;
}

export const HomePageRenderer: React.FC<HomePageRendererProps> = ({ blocks, featuredMatch }) => {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        لا توجد أقسام معروضة حالياً. يرجى تهيئة الصفحة من لوحة الإدارة.
      </div>
    );
  }

  // Allow multiple instances for certain block types only
  const ALLOW_MULTIPLE = ['CUSTOM_WIDGETS', 'ADS', 'POLLS', 'VIDEOS', 'BENTO_ACTIONS'];
  
  const seenTypes = new Set<string>();
  const deduplicatedBlocks = blocks.filter(block => {
    if (ALLOW_MULTIPLE.includes(block.type)) return true;
    if (seenTypes.has(block.type)) return false;
    seenTypes.add(block.type);
    return true;
  });

  const hasLiveMatchesBlock = deduplicatedBlocks.some(b => b.type === 'LIVE_MATCHES');

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-12">
      {deduplicatedBlocks.map((block) => {
        const SectionComponent = getSectionComponent(block.type);
        if (!SectionComponent) {
          return (
            <div key={block.id} className="p-4 bg-red-900/10 border border-red-500/30 rounded-xl text-red-500 text-xs">
              كتلة غير معروفة: {block.type}
            </div>
          );
        }

        const style: any = block.styleConfig || {};
        const anim: any = (block as any).animation || {};
        
        // Define advanced padding sizes
        let paddingValue = undefined;
        if (style.backgroundColor) {
          if (style.paddingSize === 'compact') paddingValue = '0.75rem';
          else if (style.paddingSize === 'spacious') paddingValue = '2rem';
          else if (style.paddingSize === 'none') paddingValue = '0';
          else paddingValue = style.paddingSize || '1.5rem';
        }

        // Define advanced border styles
        let borderStyleString = undefined;
        if (style.borderStyle && style.borderStyle !== 'none') {
          const bColor = style.accentColor || 'rgba(255,255,255,0.08)';
          const bWidth = style.borderWidth || '1px';
          borderStyleString = `${bWidth} ${style.borderStyle} ${bColor}`;
        } else if (style.backgroundColor) {
          borderStyleString = '1px solid rgba(255,255,255,0.05)';
        }

        // Define box shadow styles
        let shadowStyleString = undefined;
        if (style.shadowIntensity === 'subtle') {
          shadowStyleString = '0 4px 12px rgba(0, 0, 0, 0.3)';
        } else if (style.shadowIntensity === 'medium') {
          shadowStyleString = '0 8px 24px rgba(0, 0, 0, 0.4)';
        } else if (style.shadowIntensity === 'glow' && style.accentColor) {
          shadowStyleString = `0 0 15px ${style.accentColor}33`;
        } else if (style.shadowIntensity === 'glow_intense' && style.accentColor) {
          shadowStyleString = `0 0 25px ${style.accentColor}55`;
        }

        const wrapperStyle: React.CSSProperties = {
          background: style.bgGradient 
            ? `linear-gradient(135deg, ${style.bgGradientStart || '#0a0f18'}, ${style.bgGradientEnd || '#070b11'})` 
            : style.backgroundColor,
          color: style.textColor,
          fontFamily: style.fontFamily,
          borderRadius: style.borderRadius || (style.backgroundColor || style.bgGradient ? '1.5rem' : undefined),
          padding: paddingValue,
          border: borderStyleString,
          boxShadow: shadowStyleString,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        };

        // Determine animation dynamics
        let initialAnim: any = { opacity: 0, y: 15 };
        let animateAnim: any = { opacity: 1, y: 0 };
        
        if (anim.type === 'fade') {
          initialAnim = { opacity: 0 };
          animateAnim = { opacity: 1 };
        } else if (anim.type === 'slide') {
          initialAnim = { opacity: 0, y: 30 };
          animateAnim = { opacity: 1, y: 0 };
        } else if (anim.type === 'slide_right') {
          initialAnim = { opacity: 0, x: -30 };
          animateAnim = { opacity: 1, x: 0 };
        } else if (anim.type === 'zoom') {
          initialAnim = { opacity: 0, scale: 0.94 };
          animateAnim = { opacity: 1, scale: 1 };
        } else if (anim.type === 'none') {
          initialAnim = {};
          animateAnim = {};
        }

        // Hover effect styles
        let hoverProps = {};
        if (style.hoverEffect === 'scale') {
          hoverProps = { y: -4, scale: 1.008, filter: 'brightness(1.03)' };
        } else if (style.hoverEffect === 'glow' && style.accentColor) {
          hoverProps = { y: -2, boxShadow: `0 0 25px ${style.accentColor}44` };
        } else if (style.hoverEffect === 'lift') {
          hoverProps = { y: -6, boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)' };
        }

        // Custom Title Properties
        const hasTitle = block.title && block.title.trim() !== '';
        const titleColor = style.titleColor || '#ffffff';
        const titleSize = style.titleSize || 'text-lg';
        const titleWeight = style.titleWeight || 'font-black';
        const titleAlign = style.titleAlign || 'text-right';
        const titleIcon = style.titleIcon && style.titleIcon !== 'None' ? style.titleIcon : null;
        const subtitle = style.subtitle || null;

        const showMoreButton = (block.dataConfig as any)?.showMoreButton;
        const moreButtonLabel = (block.dataConfig as any)?.moreButtonLabel || 'مشاهدة المزيد ↗';
        const moreButtonUrl = (block.dataConfig as any)?.moreButtonUrl || '#';

        // Clone block to clear internal header title and avoid duplicate titles
        const blockForSection = {
          ...block,
          title: '', // Prevents section components from rendering default duplicate headers
        };

        return (
          <motion.div
            key={block.id}
            initial={initialAnim}
            animate={animateAnim}
            whileHover={style.hoverEffect && style.hoverEffect !== 'none' ? hoverProps : undefined}
            transition={{ 
              duration: anim.duration ?? 0.4, 
              delay: anim.delay ?? 0,
              ease: anim.type === 'spring' ? [0.175, 0.885, 0.32, 1.275] : 'easeOut'
            }}
            style={wrapperStyle}
            className="w-full"
          >
            <div className="w-full flex flex-col h-full justify-between">
              <div>
                {hasTitle && (
                  <div className={`mb-5 flex flex-col gap-1 ${titleAlign}`}>
                    <div className="flex items-center gap-2">
                      {titleIcon && (
                        <span className="text-xl">
                          {titleIcon === 'Trophy' ? '🏆' : titleIcon === 'Flame' ? '🔥' : titleIcon === 'Sparkles' ? '✨' : titleIcon === 'Activity' ? '📈' : titleIcon === 'Tv' ? '📺' : titleIcon === 'TrendingUp' ? '⚡' : titleIcon === 'Newspaper' ? '📰' : ''}
                        </span>
                      )}
                      <h2 
                        className={`${titleSize} ${titleWeight} tracking-tight`}
                        style={{ color: titleColor }}
                      >
                        {(() => {
                          const isEn = localStorage.getItem('language') === 'en' || new URLSearchParams(window.location.search).get('lang') === 'en';
                          return isEn && block.titleEn ? block.titleEn : block.title;
                        })()}
                      </h2>
                    </div>
                    {subtitle && (
                      <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-2xl">{subtitle}</p>
                    )}
                  </div>
                )}
                
                <SectionComponent 
                  block={blockForSection} 
                  featuredMatch={featuredMatch} 
                  excludeLive={hasLiveMatchesBlock && block.type === 'TODAY_MATCHES'}
                />
              </div>

              {showMoreButton && (
                <div className="pt-5 flex justify-center mt-auto">
                  <a 
                    href={moreButtonUrl}
                    className="px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/10 hover:border-primary/20 rounded-xl text-xs font-black transition-all"
                  >
                    {moreButtonLabel}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
