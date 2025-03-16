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

  // File system operations
  createDirectory: (dirPath) => ipcRenderer.invoke("create-directory", dirPath),
  writeFile: (options) => ipcRenderer.invoke("write-file", options),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  deleteFile: (filePath) => ipcRenderer.invoke("delete-file", filePath),
  getFileInfo: (filePath) => ipcRenderer.invoke("get-file-info", filePath),
  openFile: (filePath) => ipcRenderer.invoke("open-file", filePath),
  getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),

  // WhatsApp integration
  openWhatsAppWeb: (config) => ipcRenderer.invoke("open-whatsapp-web", config),
  sendWhatsAppMessage: (params) =>
    ipcRenderer.invoke("send-whatsapp-message", params),

  // Reset setup
  resetSetup: () => ipcRenderer.invoke("reset-setup"),

  // Other native APIs that might be needed
  getAppVersion: () => process.env.npm_package_version || "1.0.0",
  getPlatform: () => process.platform || "browser",
});
