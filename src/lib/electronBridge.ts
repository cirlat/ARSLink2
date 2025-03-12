// Importa le interfacce dal file di definizione dei tipi
import type { ElectronAPI, DatabaseConfig } from "@/types/electron";

// Verifica se l'API Electron è disponibile
const isElectron = (): boolean => {
  return typeof window !== "undefined" && window.electronAPI !== undefined;
};

// Ottieni l'API Electron se disponibile, altrimenti fornisci implementazioni mock
export const electronAPI: ElectronAPI = isElectron()
  ? (window as any).electronAPI
  : {
      // Implementazioni mock per l'ambiente browser
      connectDatabase: async (config: DatabaseConfig) => {
        console.log("Mock: connectDatabase", config);
        return { success: true, message: "Connessione simulata al database" };
      },
      executeQuery: async (query: string, params: any[]) => {
        console.log("Mock: executeQuery", query, params);
        return { success: true, rows: [] };
      },
      backupDatabase: async (path: string) => {
        console.log("Mock: backupDatabase", path);
        return { success: true, path };
      },
      restoreDatabase: async (path: string) => {
        console.log("Mock: restoreDatabase", path);
        return { success: true };
      },
      getAppVersion: () => "1.0.0",
      getPlatform: () => "browser",
    };

// Funzione per verificare se l'app è in esecuzione in Electron
export const isRunningInElectron = (): boolean => {
  return isElectron();
};
