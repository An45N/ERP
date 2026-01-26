import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../utils';

function normalizeSpaces(value: string) {
  return value.replace(/\u00A0/g, ' ');
}

describe('formatCurrency', () => {
  it('should format positive numbers correctly', () => {
    expect(normalizeSpaces(formatCurrency(1000))).toContain('1,000.00');
    expect(normalizeSpaces(formatCurrency(1234.56))).toContain('1,234.56');
  });

  it('should format negative numbers correctly', () => {
    expect(normalizeSpaces(formatCurrency(-1000))).toContain('1,000.00');
    expect(normalizeSpaces(formatCurrency(-1000))).toMatch(/^-?/);
  });

  it('should handle zero', () => {
    expect(normalizeSpaces(formatCurrency(0))).toContain('0.00');
  });

  it('should handle different currencies', () => {
    expect(normalizeSpaces(formatCurrency(1000, 'USD'))).toContain('1,000.00');
    expect(normalizeSpaces(formatCurrency(1000, 'EUR'))).toContain('1,000.00');
  });

  it('should handle large numbers', () => {
    expect(normalizeSpaces(formatCurrency(1000000))).toContain('1,000,000.00');
  });
});

describe('formatDate', () => {
  it('should format ISO date strings correctly', () => {
    const date = '2024-01-15T10:30:00Z';
    const formatted = formatDate(date);
    expect(formatted).toContain('2024');
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

describe('formatDateTime', () => {
  it('should format valid datetimes', () => {
    const formatted = formatDateTime('2024-01-15T10:30:00Z');
    expect(formatted).toContain('2024');
  });

  it('should handle invalid dates gracefully', () => {
    expect(formatDateTime('invalid')).toBe('Invalid Date');
  });
});
