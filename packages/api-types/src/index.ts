// API Types - to be migrated from apps/web/src/lib/supabase/database.types.ts
// and API route types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Placeholder for database types migration
// export * from './database';
