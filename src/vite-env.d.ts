/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHEETS_URL?:    string;
  readonly VITE_SHEETS_KEY?:    string;
  readonly VITE_GRIEVANCE_URL?: string;
  readonly VITE_DB_ADAPTER?:    string;
  readonly VITE_MYSQL_API_URL?: string;
  readonly VITE_MYSQL_API_KEY?: string;
}