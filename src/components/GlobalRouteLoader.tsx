import React from 'react';

export default function GlobalRouteLoader() {
  return (
    <div className="min-h-screen bg-[#090A0F] flex flex-col items-center justify-center text-white p-6">
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <h2 className="text-xl font-bold tracking-wide mb-2 text-emerald-400">صفارة 90 | Safara 90</h2>
      <p className="text-sm text-gray-400 animate-pulse">جاري تحميل المحتوى وتجهيز البيانات...</p>
    </div>
  );
}
