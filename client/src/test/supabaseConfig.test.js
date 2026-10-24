import { describe, it, expect } from 'vitest';
import { isValidSupabaseUrl, isValidSupabaseKey } from '../lib/supabase.js';

describe('Supabase Configuration & Validation Helpers', () => {
  it('detects placeholder, missing, or malformed Supabase URLs', () => {
    expect(isValidSupabaseUrl('')).toBe(false);
    expect(isValidSupabaseUrl(null)).toBe(false);
    expect(isValidSupabaseUrl(undefined)).toBe(false);
    expect(isValidSupabaseUrl('https://your-project.supabase.co')).toBe(false);
    expect(isValidSupabaseUrl('https://placeholder-teamflow.supabase.co')).toBe(false);
    expect(isValidSupabaseUrl('https://<your-project-id>.supabase.co')).toBe(false);
    expect(isValidSupabaseUrl('not-a-url')).toBe(false);
    expect(isValidSupabaseUrl('ftp://example.com')).toBe(false);
  });

  it('accepts genuine Supabase URLs', () => {
    expect(isValidSupabaseUrl('https://abcdefghijklmnop.supabase.co')).toBe(true);
    expect(isValidSupabaseUrl('https://myproject.supabase.co/')).toBe(true);
    expect(isValidSupabaseUrl('http://localhost:54321')).toBe(true);
  });

  it('detects placeholder, short, or invalid Supabase publishable keys', () => {
    expect(isValidSupabaseKey('')).toBe(false);
    expect(isValidSupabaseKey(null)).toBe(false);
    expect(isValidSupabaseKey(undefined)).toBe(false);
    expect(isValidSupabaseKey('your-anon-key')).toBe(false);
    expect(isValidSupabaseKey('placeholder-anon-key')).toBe(false);
    expect(isValidSupabaseKey('short-key')).toBe(false);
  });

  it('accepts valid publishable/anon keys of adequate length', () => {
    expect(isValidSupabaseKey('sb_publishable_valid_production_key_1234567890')).toBe(true);
    expect(isValidSupabaseKey('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abcdefghijklmnopqrstuvwxyz1234567890')).toBe(true);
  });
});
