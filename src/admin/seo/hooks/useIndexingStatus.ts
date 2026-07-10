import { useState, useCallback } from 'react';
import { seoDiagnosticsService } from '../services/seoDiagnosticsService';
import { createSlugPath } from '@/utils/slugify';

interface UseIndexingStatusProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  showError: (msg: string) => void;
  setAuditProgress: (progress: string) => void;
}

export function useIndexingStatus({
  showToast,
  showError,
  setAuditProgress
}: UseIndexingStatusProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportMatchUrlsToCsv = useCallback(async () => {
    setIsExporting(true);
    setAuditProgress('جاري جلب جميع روابط المباريات لتصديرها...');
    try {
      const matches = await seoDiagnosticsService.fetchMatches();

      const headers = ["Title", "URL", "Status"];
      const rows = matches.map((match: any) => {
        const homeTeamObj = match.homeTeam; const homeName = (typeof match.homeName === 'string' && match.homeName) ? match.homeName : (homeTeamObj && typeof homeTeamObj === 'object' ? (homeTeamObj.name || homeTeamObj.englishName || homeTeamObj.arabicName || 'Unknown') : (typeof homeTeamObj === 'string' ? homeTeamObj : 'Unknown'));
        const awayTeamObj = match.awayTeam; const awayName = (typeof match.awayName === 'string' && match.awayName) ? match.awayName : (awayTeamObj && typeof awayTeamObj === 'object' ? (awayTeamObj.name || awayTeamObj.englishName || awayTeamObj.arabicName || 'Unknown') : (typeof awayTeamObj === 'string' ? awayTeamObj : 'Unknown'));
        const title = match.title || `${homeName} vs ${awayName}`;
        const slug = createSlugPath(homeName, match.id);
        const url = `https://korea90.xyz/match/${slug}`;
        
        return [`"${title}"`, `"${url}"`, "To Be Indexed"];
      });

      const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
      const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "matches_indexing_status.csv");
      link.click();
      
      showToast('تم تصدير روابط المباريات بنجاح!', 'success');
    } catch (err: any) {
      showError('فشل تصدير روابط المباريات: ' + err.message);
    } finally {
      setAuditProgress('');
      setIsExporting(false);
    }
  }, [setAuditProgress, showToast, showError]);

  return {
    isExporting,
    exportMatchUrlsToCsv
  };
}
