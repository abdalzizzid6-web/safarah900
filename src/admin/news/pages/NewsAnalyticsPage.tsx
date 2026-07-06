import React from 'react';
import { NewsStatistics } from '../components/NewsStatistics';

export function NewsAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="text-right mb-6">
        <h3 className="text-xl font-black text-white">إحصائيات وقراءات الأخبار الكاملة</h3>
        <p className="text-xs text-gray-500 mt-1">تتبع مؤشرات القراءة، المشاهدات، النقرات، ونسب ظهور المقالات</p>
      </div>
      <NewsStatistics />
    </div>
  );
}
export default NewsAnalyticsPage;
