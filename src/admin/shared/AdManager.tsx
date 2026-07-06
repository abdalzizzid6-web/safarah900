import React, { useState } from 'react';
import { useAds } from '../../features/ads/hooks/useAds';
import { useAdActions } from '../../features/ads/hooks/useAdActions';
import { Ad } from '../../features/ads/types/ad.types';
import { AdForm } from '../../features/ads/components/AdForm';
import { AdsTable } from '../../features/ads/components/AdsTable';

export default function AdManager() {
  const { data: ads = [], isLoading } = useAds();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-8 p-2 md:p-6 text-right" dir="rtl">
       <div className="bg-slate-950/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6">
        <h1 className="text-2xl font-black text-white">إدارة الحملات الإعلانية</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-black p-4 rounded-2xl">
          {showForm ? 'إلغاء' : 'إعلان جديد'}
        </button>
       </div>
       
       {showForm && <AdForm />}
       
       <AdsTable ads={ads} />
    </div>
  );
}
