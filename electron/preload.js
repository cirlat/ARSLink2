const { contextBridge, ipcRenderer } = require("electron");

// Esponi le API sicure alla finestra del renderer
contextBridge.exposeInMainWorld("electronAPI", {
  // Database
  connectDatabase: (config) => ipcRenderer.invoke("connect-database", config),
  executeQuery: (query, params) =>
    ipcRenderer.invoke("execute-query", { query, params }),

  // Backup e ripristino
  backupDatabase: (path) => ipcRenderer.invoke("backup-database", path),
  restoreDatabase: (path) => ipcRenderer.invoke("restore-database", path),

  // Altre API native che potrebbero essere necessarie
  getAppVersion: () => process.env.npm_package_version,
  getPlatform: () => process.platform,
});
