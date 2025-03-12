interface ElectronAPI {
  connectDatabase: (
    config: DatabaseConfig,
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  executeQuery: (
    query: string,
    params: any[],
  ) => Promise<{ success: boolean; rows?: any[]; error?: string }>;
  backupDatabase: (
    path: string,
  ) => Promise<{ success: boolean; path?: string; error?: string }>;
  restoreDatabase: (
    path: string,
  ) => Promise<{ success: boolean; error?: string }>;
  getAppVersion: () => string;
  getPlatform: () => string;
}

interface DatabaseConfig {
  host: string;
  port: string | number;
  username: string;
  password: string;
  dbName: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
