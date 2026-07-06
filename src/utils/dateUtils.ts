/**
 * Safely gets local date in YYYY-MM-DD format based on local/system timezone
 */
export function getLocalDateString(dateInput?: Date | string | number): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
