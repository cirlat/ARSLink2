const { contextBridge, ipcRenderer } = require("electron");

// Expose secure APIs to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Database
  connectDatabase: (config) => ipcRenderer.invoke("connect-database", config),
  executeQuery: (query, params) =>
    ipcRenderer.invoke("execute-query", { query, params }),
  saveDbConfig: (config) => ipcRenderer.invoke("save-db-config", config),

  // Backup and restore
  backupDatabase: (path) => ipcRenderer.invoke("backup-database", path),
  restoreDatabase: (path) => ipcRenderer.invoke("restore-database", path),

  // Other native APIs that might be needed
  getAppVersion: () => process.env.npm_package_version || "1.0.0",
  getPlatform: () => process.platform || "browser",
});
