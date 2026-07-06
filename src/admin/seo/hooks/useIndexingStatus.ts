import { useState, useCallback } from 'react';
import { seoDiagnosticsService } from '../services/seoDiagnosticsService';
import { createSlugPath } from '@/src/utils/slugify';

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
        const title = `${match.homeTeam || 'Match'} vs ${match.awayTeam || 'Match'}`;
        const slug = createSlugPath(typeof match.homeTeam === 'object' ? match.homeTeam.name : match.homeTeam, match.id);
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
