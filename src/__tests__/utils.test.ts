import { describe, it, expect } from 'vitest';
import { getLocalDateString } from '../utils/dateUtils';
import { createSlugPath } from '../utils/slugify';

describe('Utility Functions', () => {
  it('creates slug paths out of strings', () => {
    expect(createSlugPath('Hello !World', 123)).toBe('hello-world-123');
  });

  it('gets local date string correctly', () => {
    const today = new Date();
    const str = getLocalDateString(today);
    expect(str).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
