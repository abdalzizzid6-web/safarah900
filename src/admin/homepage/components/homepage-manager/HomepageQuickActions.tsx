import React from 'react';
import { Sliders, Tv, Activity, Trophy, Newspaper, Sparkles, Video } from 'lucide-react';
import { BlockType } from '../../../../types';

interface HomepageQuickActionsProps {
  handleQuickSpawnBlock: (type: BlockType, label: string) => void;
}

export const HomepageQuickActions: React.FC<HomepageQuickActionsProps> = ({
  handleQuickSpawnBlock
}) => {
  return (
    <div className="bg-[#0e1622] border border-white/5 rounded-3xl p-6 space-y-4 text-right">
      <div className="flex items-center gap-2 justify-end">
        <h2 className="text-sm font-black text-white">توليد الأقسام السريع (1-Click Widget Spawn Board)</h2>
        <Sliders className="text-primary animate-pulse" size={18} />
      </div>
      <p className="text-xs text-gray-400">
        أسرع لوحة لبناء مكونات الصفحة الرئيسية بضغطة زر واحدة. انقر على أي قسم بالأسفل لتوليده مع إعداداته الرياضية المعتمدة فوراً دون الحاجة لتعبئة استمارات مكررة:
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button
          onClick={() => handleQuickSpawnBlock(BlockType.LIVE_MATCHES, 'البث المباشر للمباريات الحية')}
          className="p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 hover:border-red-500/30 text-red-400 rounded-2xl text-xs font-black text-right transition flex flex-col justify-between h-20 active:scale-95 cursor-pointer"
        >
          <div className="flex justify-between items-center w-full">
            <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-mono">LIVE</span>
            <Tv size={16} />
          </div>
          <span>بث مباشر فوري 📺</span>
        </button>

        <button
          onClick={() => handleQuickSpawnBlock(BlockType.TODAY_MATCHES, 'جدول مباريات اليوم بالكامل')}
          className="p-3 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 hover:border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-black text-right transition flex flex-col justify-between h-20 active:scale-95 cursor-pointer"
        >
          <div className="flex justify-between items-center w-full">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-mono">TODAY</span>
            <Activity size={16} />
          </div>
          <span>مباريات اليوم ⚽</span>
        </button>

        <button
          onClick={() => handleQuickSpawnBlock(BlockType.LEAGUE_STANDINGS, 'جدول ترتيب دوري المحترفين')}
          className="p-3 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 hover:border-amber-500/30 text-amber-400 rounded-2xl text-xs font-black text-right transition flex flex-col justify-between h-20 active:scale-95 cursor-pointer"
        >
          <div className="flex justify-between items-center w-full">
            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-mono">STANDINGS</span>
            <Trophy size={16} />
          </div>
          <span>ترتيب البطولة 🏆</span>
        </button>

        <button
          onClick={() => handleQuickSpawnBlock(BlockType.LATEST_NEWS, 'تغطية إخبارية وعاجل')}
          className="p-3 bg-sky-500/5 hover:bg-sky-500/10 border border-sky-500/15 hover:border-sky-500/30 text-sky-400 rounded-2xl text-xs font-black text-right transition flex flex-col justify-between h-20 active:scale-95 cursor-pointer"
        >
          <div className="flex justify-between items-center w-full">
            <span className="text-[10px] bg-sky-500/10 text-sky-500 px-1.5 py-0.5 rounded font-mono">NEWS</span>
            <Newspaper size={16} />
          </div>
          <span>أخبار حصرية 📰</span>
        </button>

        <button
          onClick={() => handleQuickSpawnBlock(BlockType.BENTO_ACTIONS, 'قصص وصندوق وصول بينتو سريع')}
          className="p-3 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/15 hover:border-purple-500/30 text-purple-400 rounded-2xl text-xs font-black text-right transition flex flex-col justify-between h-20 active:scale-95 cursor-pointer"
        >
          <div className="flex justify-between items-center w-full">
            <span className="text-[10px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded font-mono">BENTO</span>
            <Sparkles size={16} />
          </div>
          <span>أزرار بينتو الذكية ✨</span>
        </button>

        <button
          onClick={() => handleQuickSpawnBlock(BlockType.VIDEOS, 'أهداف اللقاءات وملخصات مرئية')}
          className="p-3 bg-pink-500/5 hover:bg-pink-500/10 border border-pink-500/15 hover:border-pink-500/30 text-pink-400 rounded-2xl text-xs font-black text-right transition flex flex-col justify-between h-20 active:scale-95 cursor-pointer"
        >
          <div className="flex justify-between items-center w-full">
            <span className="text-[10px] bg-pink-500/10 text-pink-500 px-1.5 py-0.5 rounded font-mono">MEDIA</span>
            <Video size={16} />
          </div>
          <span>ملخصات مرئية 🎥</span>
        </button>
      </div>
    </div>
  );
};
