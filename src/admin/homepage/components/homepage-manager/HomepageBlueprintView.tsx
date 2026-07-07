import React from 'react';
import { Move, ArrowUp, ArrowDown, Database, Layout, Monitor, Tablet, Smartphone, Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';
import { getFriendlyTypeName } from './HomepageManagerConstants';

interface HomepageBlueprintViewProps {
  blocks: any[];
  draggedIndex: number | null;
  dragOverIndex: number | null;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDrop: (e: React.DragEvent, targetIndex: number) => void;
  handleDragEnd: () => void;
  moveBlock: (index: number, direction: 'up' | 'down') => void;
  toggleBlockEnabled: (block: any) => void;
  setEditingBlock: (block: any) => void;
  setShowForm: (show: boolean) => void;
  deleteBlock: (id: string, title: string) => void;
}

export const HomepageBlueprintView: React.FC<HomepageBlueprintViewProps> = ({
  blocks,
  draggedIndex,
  dragOverIndex,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  moveBlock,
  toggleBlockEnabled,
  setEditingBlock,
  setShowForm,
  deleteBlock
}) => {
  return (
    <div className="space-y-6 text-right">
      {/* Instructions on Drag & Drop */}
      {blocks.length > 1 && (
        <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3 justify-end">
          <span>اضغط مطولاً على أي قسم واسحبه لأعلى أو لأسفل لتغيير موقع ظهوره في الصفحة الرئيسية بدقة.</span>
          <span className="font-bold">:ميزة الترتيب المباشر مفعلة</span>
          <Move size={14} className="animate-bounce shrink-0" />
        </div>
      )}

      {blocks.length === 0 ? (
        <div className="text-center py-20 bg-[#0e1622]/50 border border-white/5 rounded-3xl p-8 max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <Layout size={28} />
          </div>
          <div>
            <h3 className="font-black text-white text-sm">لا توجد أقسام مضافة بعد</h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              قائمة المخطط خالية من أي كتل حالياً. اختر قوالب التخطيط من المحاكي التفاعلي أو أضف مكوناً يدوياً.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, index) => {
            const isDragged = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            const rowsCount = block.rows?.length || 1;
            const widgetsCount = block.rows?.reduce((acc: number, r: any) => acc + (r.columns?.reduce((acc2: number, c: any) => acc2 + (c.widgets?.length || 0), 0) || 0), 0) || 1;

            return (
              <div 
                key={block.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`bg-[#0e1622] border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 cursor-grab active:cursor-grabbing ${
                  block.enabled ? 'border-white/5' : 'border-white/5 opacity-55'
                } ${isDragged ? 'opacity-30 scale-95 border-primary' : ''} ${
                  isDragOver ? 'border-dashed border-primary bg-primary/5 py-8' : ''
                }`}
              >
                {/* Controls (Left on desktop, bottom on mobile) */}
                <div className="flex items-center justify-between sm:justify-start gap-3 border-t border-white/5 pt-3 sm:pt-0 sm:border-0 order-2 sm:order-1">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
                    <Monitor size={12} className={block.visibility?.desktop !== false ? 'text-primary' : 'text-gray-600'} />
                    <Tablet size={12} className={block.visibility?.tablet !== false ? 'text-primary' : 'text-gray-600'} />
                    <Smartphone size={12} className={block.visibility?.mobile !== false ? 'text-primary' : 'text-gray-600'} />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBlockEnabled(block)}
                      className={`p-2 rounded-xl transition cursor-pointer ${
                        block.enabled ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}
                    >
                      {block.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>

                    <button 
                      onClick={() => {
                        setEditingBlock(block);
                        setShowForm(true);
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 rounded-xl transition cursor-pointer"
                    >
                      <Edit2 size={15} />
                    </button>

                    <button 
                      onClick={() => deleteBlock(block.id, block.title)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Order & Metadata (Right on desktop) */}
                <div className="flex items-center gap-4 order-1 sm:order-2 flex-1 justify-end">
                  <div className="text-right">
                    <h3 className="font-black text-sm text-white flex items-center gap-2 justify-end">
                      {!block.enabled && (
                        <span className="text-[9px] bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full font-bold border border-red-500/20">معطل</span>
                      )}
                      <span>{block.title}</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-gray-400 justify-end">
                      <span className="font-mono">الترتيب: {block.displayOrder}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-purple-400">
                        المخطط: {rowsCount} صفوف ({widgetsCount} عناصر)
                        <Layout size={11} />
                      </span>
                      <span>•</span>
                      <span className="font-bold text-primary flex items-center gap-1">
                        {getFriendlyTypeName(block.type)}
                        <Database size={11} />
                      </span>
                    </div>
                  </div>

                  <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-mono text-xs font-black text-gray-400 border border-white/5">
                    {index + 1}
                  </span>

                  <div className="flex flex-col gap-1">
                    <button
                      disabled={index === 0}
                      onClick={() => moveBlock(index, 'up')}
                      className={`p-1 rounded bg-white/5 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer ${
                        index === 0 ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    >
                      <ArrowUp size={10} />
                    </button>
                    <button
                      disabled={index === blocks.length - 1}
                      onClick={() => moveBlock(index, 'down')}
                      className={`p-1 rounded bg-white/5 border border-white/10 text-gray-400 hover:text-white transition cursor-pointer ${
                        index === blocks.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    >
                      <ArrowDown size={10} />
                    </button>
                  </div>

                  <div className="text-gray-500 hover:text-white transition p-1 cursor-grab">
                    <Move size={16} />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
