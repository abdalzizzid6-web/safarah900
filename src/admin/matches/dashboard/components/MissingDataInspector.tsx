import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  match: any;
}

export const MissingDataInspector = ({ match }: Props) => {
  const missing = [];
  if (!match?.stadium) missing.push('الاستاد');
  if (!match?.referee) missing.push('الحكم');

  return (
    <div className="bg-[#18181C] p-4 rounded-xl border border-white/5 space-y-2">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        {missing.length === 0 ? <CheckCircle className="text-emerald-500" size={16}/> : <AlertTriangle className="text-red-500" size={16}/>}
        مفتش البيانات
      </h3>
      {missing.length > 0 ? (
        <p className="text-[10px] text-red-400">بيانات مفقودة: {missing.join('، ')}</p>
      ) : (
        <p className="text-[10px] text-emerald-400">جميع البيانات مكتملة</p>
      )}
    </div>
  );
};
