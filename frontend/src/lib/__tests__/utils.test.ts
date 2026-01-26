import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatNumber } from '../utils';

describe('formatCurrency', () => {
  it('should format positive numbers correctly', () => {
    expect(formatCurrency(1000)).toBe('Rs 1,000.00');
    expect(formatCurrency(1234.56)).toBe('Rs 1,234.56');
  });

  it('should format negative numbers correctly', () => {
    expect(formatCurrency(-1000)).toBe('-Rs 1,000.00');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('Rs 0.00');
  });

  it('should handle different currencies', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
    expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
  });

  it('should handle large numbers', () => {
    expect(formatCurrency(1000000)).toBe('Rs 1,000,000.00');
  });
});

describe('formatDate', () => {
  it('should format ISO date strings correctly', () => {
    const date = '2024-01-15T10:30:00Z';
    const formatted = formatDate(date);
    expect(formatted).toMatch(/Jan 15, 2024/);
  });

  it('should handle Date objects', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date);
    expect(formatted).toContain('2024');
  });

  it('should handle invalid dates gracefully', () => {
    expect(formatDate('invalid')).toBe('Invalid Date');
  });
});

describe('formatNumber', () => {
  it('should format numbers with commas', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('should handle decimals', () => {
    expect(formatNumber(1234.56, 2)).toBe('1,234.56');
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});
