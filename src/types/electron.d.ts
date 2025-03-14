interface ElectronAPI {
  connectDatabase: (
    config: DatabaseConfig,
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  executeQuery: (
    query: string,
    params: any[],
  ) => Promise<{
    success: boolean;
    rows?: any[];
    rowCount?: number;
    error?: string;
  }>;
  backupDatabase: (
    path: string,
  ) => Promise<{ success: boolean; path?: string; error?: string }>;
  restoreDatabase: (
    path: string,
  ) => Promise<{ success: boolean; error?: string }>;
  saveDbConfig: (
    config: DatabaseConfig,
  ) => Promise<{ success: boolean; error?: string }>;
  getAppVersion: () => string;
  getPlatform: () => string;

  // File system operations
  createDirectory: (
    dirPath: string,
  ) => Promise<{ success: boolean; error?: string }>;
  writeFile: (params: {
    filePath: string;
    data: any;
  }) => Promise<{ success: boolean; error?: string }>;
  readFile: (
    filePath: string,
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteFile: (
    filePath: string,
  ) => Promise<{ success: boolean; error?: string }>;
  getFileInfo: (
    filePath: string,
  ) => Promise<{ success: boolean; info?: any; error?: string }>;
  openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  getUserDataPath: () => Promise<{
    success: boolean;
    path?: string;
    error?: string;
  }>;
  joinPaths: (
    paths: string[],
  ) => Promise<{ success: boolean; path?: string; error?: string }>;

  // Table creation
  ensureMedicalRecordsTable: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  ensureNotificationsTable: () => Promise<{ success: boolean; error?: string }>;
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
    dbConfigTemp?: DatabaseConfig;
  }
}
