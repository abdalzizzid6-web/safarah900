import React, { useState } from 'react';
import { Plus, Facebook, Instagram, Twitter, Youtube, AlertCircle } from 'lucide-react';

const ConnectedAccounts: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">الحسابات المتصلة</h2>
        <button className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary-hover flex items-center gap-2">
          <Plus className="w-4 h-4" />
          ربط حساب جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder for accounts */}
        <div className="bg-surface rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-primary/50 transition-colors cursor-pointer group">
           <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center group-hover:scale-110 transition-transform">
             <Plus className="w-8 h-8 text-gray-400 group-hover:text-primary" />
           </div>
           <div>
             <p className="text-white font-medium">إضافة منصة جديدة</p>
             <p className="text-sm text-gray-500 mt-1">يدعم فيسبوك، إكس، إنستغرام والمزيد</p>
           </div>
        </div>
      </div>
      
      <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex gap-3 text-blue-200">
        <AlertCircle className="w-5 h-5 shrink-0 text-blue-400" />
        <p className="text-sm">
          لربط حسابات جديدة، يجب أولاً إعداد مفاتيح API الخاصة بكل منصة في قسم <strong>إدارة مفاتيح الـ API</strong>.
        </p>
      </div>
    </div>
  );
};

export default ConnectedAccounts;
