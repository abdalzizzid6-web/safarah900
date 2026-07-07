import React from 'react';
import { Eye, EyeOff, Edit2, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { renderMiniPlaceholderContent } from './HomepageManagerConstants';

interface HomepageSimulatorProps {
  blocks: any[];
  selectedBlockId: string | null;
  openQuickInspector: (block: any) => void;
  setEditingBlock: (block: any) => void;
  setShowForm: (show: boolean) => void;
  toggleBlockEnabled: (block: any) => void;
  moveBlock: (index: number, direction: 'up' | 'down') => void;
  deleteBlock: (id: string, title: string) => void;
}

export const HomepageSimulator: React.FC<HomepageSimulatorProps> = ({
  blocks,
  selectedBlockId,
  openQuickInspector,
  setEditingBlock,
  setShowForm,
  toggleBlockEnabled,
  moveBlock,
  deleteBlock
}) => {
  return (
    <div className="xl:col-span-5 flex flex-col items-center text-right">
      <div className="sticky top-6 w-full max-w-[340px]">
        <div className="text-center mb-4">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-black">
            📱 محاكي بث مباشر تفاعلي للهواتف
          </span>
        </div>
        
        {/* CSS Phone Frame */}
        <div className="relative mx-auto border-[#1a2536] bg-[#0c1421] border-[12px] rounded-[3rem] h-[640px] w-full max-w-[320px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
          {/* Speaker & Sensor Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-5 w-32 bg-[#0c1421] rounded-b-2xl z-40 flex items-center justify-center gap-1.5">
            <div className="w-10 h-1 bg-white/10 rounded-full"></div>
            <div className="w-2 h-2 bg-camera/30 rounded-full border border-white/5"></div>
          </div>

          {/* Simulated Screen Body */}
          <div className="flex-1 bg-[#080808] flex flex-col pt-5 text-white select-none relative">
            
            {/* Status Bar */}
            <div className="h-6 px-5 flex justify-between items-center text-[9px] text-gray-400 font-bold font-mono">
              <span>09:41</span>
              <div className="flex items-center gap-1.5">
                <span>📶</span>
                <span>5G</span>
                <span>🔋 100%</span>
              </div>
            </div>

            {/* Safara 90 header mockup */}
            <div className="h-10 border-b border-white/5 px-4 flex items-center justify-between bg-[#0e1622]/60 backdrop-blur-md">
              <span className="text-xs font-black text-primary tracking-wider">SAFARA 90</span>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[8px]">🔍</span>
                <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[8px]">🔔</span>
              </div>
            </div>

            {/* Simulator Screen Dynamic Blocks Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 pb-16">
              {blocks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500 space-y-2">
                  <span className="text-2xl">📭</span>
                  <p className="text-[10px] font-bold">لا توجد أقسام لتصميمها بعد، استخدم لوحة التوليد السريع على اليسار لبناء صفحتك في ثوانٍ!</p>
                </div>
              ) : (
                blocks.map((block, idx) => {
                  const style = block.styleConfig || {};
                  const isSelected = selectedBlockId === block.id;

                  // Calculate dynamic block wrapper styles for simulator
                  const isGradient = style.bgGradient === true;
                  const blockBg = isGradient
                    ? `linear-gradient(135deg, ${style.bgGradientStart || '#0e1622'}, ${style.bgGradientEnd || '#070b11'})`
                    : style.backgroundColor || '#0e1622';

                  const blockTextColor = style.textColor || '#cbd5e1';
                  const blockTitleColor = style.titleColor || '#ffffff';
                  const titleIcon = style.titleIcon && style.titleIcon !== 'None' ? style.titleIcon : null;
                  const subtitle = style.subtitle || null;

                  const borderStyleString = style.borderStyle && style.borderStyle !== 'none'
                    ? `solid ${style.borderWidth || '1px'} ${style.accentColor || 'rgba(255,255,255,0.08)'}`
                    : '1px solid rgba(255,255,255,0.05)';

                  const blockStyle: React.CSSProperties = {
                    background: blockBg,
                    color: blockTextColor,
                    borderRadius: style.borderRadius || '1rem',
                    border: borderStyleString,
                    boxShadow: style.shadowIntensity === 'subtle' ? '0 2px 8px rgba(0,0,0,0.4)' : style.shadowIntensity === 'medium' ? '0 4px 15px rgba(0,0,0,0.5)' : undefined,
                  };

                  return (
                    <div
                      key={block.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openQuickInspector(block);
                      }}
                      className={`relative group rounded-2xl p-3 text-right cursor-pointer transition-all duration-300 ${
                        !block.enabled ? 'opacity-40 border border-dashed border-red-500/30' : ''
                      } ${
                        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-black scale-[1.02] shadow-2xl' : 'hover:scale-[1.01]'
                      }`}
                      style={blockStyle}
                    >
                      {/* Selected highlight badge */}
                      {isSelected && (
                        <span className="absolute -top-2 -left-2 bg-primary text-black font-extrabold text-[8px] px-2 py-0.5 rounded-full z-20 shadow-md">
                          تعديل نشط
                        </span>
                      )}

                      {/* Section Header */}
                      <div className={`mb-2.5 flex flex-col gap-0.5 ${style.titleAlign || 'text-right'}`}>
                        <div className="flex items-center gap-1 justify-end">
                          <h4 className="text-[10px] font-black tracking-tight" style={{ color: blockTitleColor }}>
                            {block.title}
                          </h4>
                          {titleIcon && (
                            <span className="text-xs">
                              {titleIcon === 'Trophy' ? '🏆' : titleIcon === 'Flame' ? '🔥' : titleIcon === 'Sparkles' ? '✨' : titleIcon === 'Activity' ? '📈' : titleIcon === 'Tv' ? '📺' : titleIcon === 'TrendingUp' ? '⚡' : titleIcon === 'Newspaper' ? '📰' : ''}
                            </span>
                          )}
                        </div>
                        {subtitle && (
                          <p className="text-[7px] text-gray-400 font-medium leading-relaxed truncate max-w-[200px]">{subtitle}</p>
                        )}
                      </div>

                      {/* RENDER MINI PLACEHOLDER CONTENT ACCORDING TO BLOCK TYPE */}
                      {renderMiniPlaceholderContent(block.type)}

                      {/* HOVER TOOLBAR ACTIONS FOR SIMULATOR */}
                      <div className="absolute inset-0 bg-black/80 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 px-2 pointer-events-none group-hover:pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBlock(block);
                            setShowForm(true);
                          }}
                          className="p-1.5 bg-primary hover:bg-primary-hover text-black rounded-lg transition"
                          title="معدل متقدم"
                        >
                          <Edit2 size={10} />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBlockEnabled(block);
                          }}
                          className={`p-1.5 rounded-lg transition ${block.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
                          title={block.enabled ? 'تعطيل من النشر' : 'تفعيل ونشر'}
                        >
                          {block.enabled ? <Eye size={10} /> : <EyeOff size={10} />}
                        </button>

                        <button
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(idx, 'up');
                          }}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition disabled:opacity-20"
                        >
                          <ChevronUp size={10} />
                        </button>

                        <button
                          disabled={idx === blocks.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(idx, 'down');
                          }}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition disabled:opacity-20"
                        >
                          <ChevronDown size={10} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBlock(block.id, block.title);
                          }}
                          className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Smartphone home tab button placeholder */}
            <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
