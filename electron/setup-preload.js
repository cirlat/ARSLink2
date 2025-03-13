const { contextBridge, ipcRenderer } = require("electron");

// Esponi le API sicure al processo di rendering
contextBridge.exposeInMainWorld("setupAPI", {
  // Database
  testConnection: (config) => ipcRenderer.invoke("setup-test-connection", config),
  createTables: (config) => ipcRenderer.invoke("setup-create-tables", config),
  
  // Admin user
  createAdmin: (adminUser) => ipcRenderer.invoke("setup-create-admin", adminUser),
  
  // License
  saveLicense: (licenseData) => ipcRenderer.invoke("setup-save-license", licenseData),
  
  // Configuration
  saveConfig: (config)