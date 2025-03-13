// Importa le interfacce dal file di definizione dei tipi
import type { ElectronAPI, DatabaseConfig } from "../types/electron";

// Verifica se l'API Electron è disponibile
const isElectron = (): boolean => {
  return (
    typeof window !== "undefined" &&
    typeof window.electronAPI !== "undefined" &&
    Object.keys(window.electronAPI).length > 0
  );
};

// Ottieni l'API Electron se disponibile, altrimenti fornisci implementazioni mock
export const electronAPI: ElectronAPI = isElectron()
  ? window.electronAPI
  : {
      // Implementazioni mock per l'ambiente browser
      connectDatabase: async (config: DatabaseConfig) => {
        console.log("Mock: connectDatabase", config);
        // Simula un ritardo per rendere più realistico
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Salva la configurazione in localStorage per il mock
        localStorage.setItem("mockDbConfig", JSON.stringify(config));

        // Verifica le credenziali di test
        if (config.username === "postgres") {
          return { success: true, message: "Connessione simulata al database" };
        } else {
          return {
            success: false,
            error:
              "autenticazione con password fallita per l'utente \"" +
              config.username +
              '"',
          };
        }
      },
      executeQuery: async (query: string, params: any[]) => {
        console.log("Mock: executeQuery", query, params);
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true, rows: [] };
      },
      backupDatabase: async (path: string) => {
        console.log("Mock: backupDatabase", path);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { success: true, path };
      },
      restoreDatabase: async (path: string) => {
        console.log("Mock: restoreDatabase", path);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { success: true };
      },
      saveDbConfig: async (config: DatabaseConfig) => {
        console.log("Mock: saveDbConfig", config);
        localStorage.setItem("mockDbConfig", JSON.stringify(config));
        return { success: true };
      },
      getAppVersion: () => "1.0.0",
      getPlatform: () => "browser",
    };

// Funzione per verificare se l'app è in esecuzione in Electron
export const isRunningInElectron = (): boolean => {
  return isElectron();
};
