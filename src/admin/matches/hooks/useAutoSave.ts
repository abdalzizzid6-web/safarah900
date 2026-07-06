import { useState, useEffect, useRef } from 'react';

export function useAutoSave<T>(key: string, data: T, onSave?: (data: T) => void) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const dataRef = useRef<T>(data);

  // Update ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Initial recovery
  const recover = (): T | null => {
    const saved = localStorage.getItem(`autosave_${key}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const clear = () => {
    localStorage.removeItem(`autosave_${key}`);
  };

  // Auto-save effect
  useEffect(() => {
    if (!key) return;

    const interval = setInterval(() => {
      localStorage.setItem(`autosave_${key}`, JSON.stringify(dataRef.current));
      setLastSaved(new Date());
      if (onSave) onSave(dataRef.current);
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [key, onSave]);

  // Warn before closing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return { lastSaved, recover, clear };
}
