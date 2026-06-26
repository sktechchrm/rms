export const SHEETS_CONFIG = {
  url: import.meta.env.VITE_SHEETS_URL || '',
  key: import.meta.env.VITE_SHEETS_KEY || '',
} as const;

export const isSheetsConfigured = (): boolean =>
  Boolean(SHEETS_CONFIG.url && SHEETS_CONFIG.key);
