import React from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { BlockType } from '../../../../types';

interface BlockFormTabLogicProps {
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  publishTime: string;
  setPublishTime: (val: string) => void;
  expireTime: string;
  setExpireTime: (val: string) => void;
  hasConditionalRule: boolean;
  setHasConditionalRule: (val: boolean) => void;
  conditionType: 'live_matches_count' | 'always';
  setConditionType: (val: 'live_matches_count' | 'always') => void;
  conditionOperator: 'gt' | 'eq' | 'lt';
  setConditionOperator: (val: 'gt' | 'eq' | 'lt') => void;
  conditionValue: number;
  setConditionValue: (val: number) => void;
  fallbackWidgetType: string;
  setFallbackWidgetType: (val: string) => void;
  animationType: 'fade' | 'slide' | 'slide_right' | 'zoom' | 'spring' | 'none';
  setAnimationType: (val: 'fade' | 'slide' | 'slide_right' | 'zoom' | 'spring' | 'none') => void;
  animationDuration: number;
  setAnimationDuration: (val: number) => void;
  animationDelay: number;
  setAnimationDelay: (val: number) => void;
}

export const BlockFormTabLogic: React.FC<BlockFormTabLogicProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  publishTime,
  setPublishTime,
  expireTime,
  setExpireTime,
  hasConditionalRule,
  setHasConditionalRule,
  conditionType,
  setConditionType,
  conditionOperator,
  setConditionOperator,
  conditionValue,
  setConditionValue,
  fallbackWidgetType,
  setFallbackWidgetType,
  animationType,
  setAnimationType,
  animationDuration,
  setAnimationDuration,
  animationDelay,
  setAnimationDelay
}) => {
  return (
    <div className="space-y-6 animate-fadeIn text-right">
      {/* Temporal Scheduling */}
      <div className="bg-[#070b11]/50 p-4 border border-white/5 rounded-2xl space-y-4">
        <div className="text-right">
          <h3 className="text-xs font-black text-white flex items-center gap-2 justify-end">
            <span>الجدولة الزمنية التلقائية للبث والظهور (Temporal Scheduling Window)</span>
            <Calendar size={14} className="text-primary" />
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
            يمكنك تحديد تاريخ بدء وانتهاء محددين لظهور القسم، أو نافذة زمنية يومية تتكرر تلقائياً. مفيد للغاية لعرض أقسام المباريات المباشرة بشكل مبرمج أثناء أوقات الاستوديو التحليلي والبث المباشر فقط.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold block">تاريخ بدء النشر والظهور</label>
            <input
              type="datetime-local"
              className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold block">تاريخ انتهاء النشر والإخفاء</label>
            <input
              type="datetime-local"
              className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold block">بدء البث اليومي (توقيت)</label>
            <input
              type="time"
              className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right"
              value={publishTime}
              onChange={(e) => setPublishTime(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold block">انتهاء البث اليومي (توقيت)</label>
            <input
              type="time"
              className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right"
              value={expireTime}
              onChange={(e) => setExpireTime(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Conditional Logic Engine */}
      <div className="bg-[#070b11]/50 p-4 border border-white/5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setHasConditionalRule(!hasConditionalRule)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition border ${hasConditionalRule ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-gray-400 border-white/5'}`}
          >
            {hasConditionalRule ? 'تعطيل محرك الشروط' : 'تفعيل شرط العرض الذكي'}
          </button>
          <div className="text-right">
            <h3 className="text-xs font-black text-white flex items-center gap-2 justify-end">
              <span>محرك وقواعد العرض الشرطي (Conditional Layout Engine)</span>
              <Clock size={14} className="text-primary animate-pulse" />
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
              توليد شروط تراجع ذكية لإظهار أو إخفاء القسم تلقائياً بناءً على معطيات الخادم الحية.
            </p>
          </div>
        </div>

        {hasConditionalRule && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#070b11] rounded-xl border border-white/5 animate-slideUp text-right">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold block">الشرط يعتمد على</label>
              <select
                className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary text-right"
                value={conditionType}
                onChange={(e: any) => setConditionType(e.target.value)}
              >
                <option value="live_matches_count">عدد المباريات الحية والنشطة حالياً</option>
                <option value="always">عرض دائم دون شروط</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold block">المقارنة الرياضية</label>
              <select
                className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary text-right"
                value={conditionOperator}
                onChange={(e: any) => setConditionOperator(e.target.value)}
              >
                <option value="gt">أكبر من (&gt;)</option>
                <option value="eq">يساوي بدقة (==)</option>
                <option value="lt">أصغر من (&lt;)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold block">القيمة للمقارنة</label>
              <input
                type="number"
                min="0"
                className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary text-right"
                value={conditionValue}
                onChange={(e) => setConditionValue(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold block">مكون التراجع البديل في حال فشل الشرط</label>
              <select
                className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary text-right"
                value={fallbackWidgetType}
                onChange={(e) => setFallbackWidgetType(e.target.value)}
              >
                <option value="">لا يوجد مكون بديل (إخفاء الكتلة بالكامل)</option>
                <option value={BlockType.HERO}>المباراة المميزة (Hero Match)</option>
                <option value={BlockType.BENTO_ACTIONS}>صندوق الوصول السريع (Bento)</option>
                <option value={BlockType.LIVE_MATCHES}>المباريات الجارية حالياً بث مباشر</option>
                <option value={BlockType.TODAY_MATCHES}>مباريات اليوم بالكامل</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Animations Module */}
      <div className="bg-[#070b11]/50 p-4 border border-white/5 rounded-2xl space-y-4">
        <div className="text-right">
          <h3 className="text-xs font-black text-white flex items-center gap-2 justify-end">
            <span>تأثيرات الحركة ومحرك التلاشي والدخول (Transition Animations)</span>
            <Sparkles size={14} className="text-primary" />
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
            الحركات الرائعة تزيد من جاذبية التطبيق واحترافيته. يمكنك برمجة نوع الحركة الفورية عند تحميل زائر الموقع للصفحة الرئيسية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold block">نوع وتأثير الحركة</label>
            <select
              className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right"
              value={animationType}
              onChange={(e: any) => setAnimationType(e.target.value)}
            >
              <option value="fade">تلاشي ودخول متقاطع (Fade In)</option>
              <option value="slide">انزلاق مرن للأعلى (Slide Up)</option>
              <option value="slide_right">انزلاق وتدفق من اليمين لليسار (Slide Right)</option>
              <option value="zoom">تكبير ناعم وتمدد (Zoom In)</option>
              <option value="spring">حركة مطاطية تفاعلية (Elastic Spring)</option>
              <option value="none">بدون أي حركات (Static Instant)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold block">مدة الحركة الإجمالية (بالثواني)</label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="3"
              className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right font-mono"
              value={animationDuration}
              onChange={(e) => setAnimationDuration(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold block">مهلة التأخير الزمني (بالثواني)</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="2"
              className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none transition text-right font-mono"
              value={animationDelay}
              onChange={(e) => setAnimationDelay(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
