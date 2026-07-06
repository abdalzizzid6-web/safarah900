// Localized Arabic text and date formatting utilities for RSS Feed Aggregator

export function formatArabicDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'غير متوفر';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'غير متوفر';
  try {
    const time = new Date(dateStr).getTime();
    const diff = Date.now() - time;
    const mins = Math.floor(diff / (60 * 1000));
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  } catch (e) {
    return dateStr;
  }
}
