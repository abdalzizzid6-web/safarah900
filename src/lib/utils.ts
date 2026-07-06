import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function getYoutubeEmbedUrl(url: string) {
  // Broaden regex to catch m.youtube.com and other formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=|m\.youtube\.com\/watch\?v=)([^#&?]*).*/;
  const match = url.match(regExp);
  // If match found and ID is valid length, return embed URL
  if (match && match[2] && match[2].length >= 11) {
    return `https://www.youtube.com/embed/${match[2].substring(0, 11)}`;
  }
  // Return a safe empty or default URL if it cannot be parsed, 
  // instead of the original raw URL which might be blocked
  return ''; 
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractIframeSrc(input: string) {
  if (!input) return '';
  if (input.startsWith('http')) return input;
  
  const match = input.match(/src="([^"]+)"/);
  return match ? match[1] : input;
}

export function stripUndefined(obj: any) {
  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
}

export function formatDate(date: string | Date | undefined | null) {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch (e) {
    return '';
  }
}

export function formatTime(date: string | Date | undefined | null) {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('ar-SA', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(d);
  } catch (e) {
    return '';
  }
}
