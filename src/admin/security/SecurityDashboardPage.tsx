import React, { useEffect, useCallback } from 'react';
import SecurityHeader from './SecurityHeader';
import SecurityOverviewWidget from './SecurityOverviewWidget';
import ApiSecurityWidget from './ApiSecurityWidget';
import AuthenticationWidget from './AuthenticationWidget';
import AuthorizationWidget from './AuthorizationWidget';
import ActivityLogWidget from './ActivityLogWidget';
import FirestoreSecurityWidget from './FirestoreSecurityWidget';
import RateLimitWidget from './RateLimitWidget';
import AlertsWidget from './AlertsWidget';
import RecommendationsWidget from './RecommendationsWidget';
import { useSecurityOverview } from './hooks/useSecurityOverview';
import { useSecurityLogs } from './hooks/useSecurityLogs';
import { useSecurityStatus } from './hooks/useSecurityStatus';

export default function SecurityDashboardPage() {
  const { stats, fetchOverviewStats } = useSecurityOverview();
  const { audits, loading, errorString, fetchLogs } = useSecurityLogs();
  
  const fetchAllData = useCallback(() => {
    fetchOverviewStats();
    fetchLogs();
  }, [fetchOverviewStats, fetchLogs]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const {
    simulatingType,
    simResult,
    handleSimulateSSRF,
    handleSimulateUnauthorized,
    handleSimulateValidation
  } = useSecurityStatus(fetchAllData);

  return (
    <div className="min-h-screen bg-[#070708] text-gray-100 p-4 sm:p-6 lg:p-8" dir="rtl">
      <SecurityHeader fetchSecurityAudits={fetchAllData} loading={loading} />

      <div className="max-w-7xl mx-auto space-y-6">
        <SecurityOverviewWidget stats={stats} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FirestoreSecurityWidget />
          <RateLimitWidget />
          <RecommendationsWidget />
        </div>

        <div className="bg-[#0A0A0B] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-amber-500/[0.02] rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-lg font-black text-white mb-2">محاكي الهجمات الأمني (Security Simulator)</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">اختبر قوة جدار الحماية ضد محاولات الوصول غير المصرح والطلبات المخالفة للمعايير.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ApiSecurityWidget handleSimulateSSRF={handleSimulateSSRF} simulatingType={simulatingType} />
            <AuthenticationWidget handleSimulateUnauthorized={handleSimulateUnauthorized} simulatingType={simulatingType} />
            <AuthorizationWidget handleSimulateValidation={handleSimulateValidation} simulatingType={simulatingType} />
          </div>
          <AlertsWidget simResult={simResult} />
        </div>

        <ActivityLogWidget 
          audits={audits}
          loading={loading}
          errorString={errorString}
          fetchSecurityAudits={fetchAllData}
        />
      </div>
    </div>
  );
}
