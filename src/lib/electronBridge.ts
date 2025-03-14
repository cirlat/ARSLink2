// Importa le interfacce dal file di definizione dei tipi
import type { ElectronAPI, DatabaseConfig } from "../types/electron";

// Verifica se l'API Electron è disponibile
const isElectron = (): boolean => {
  return (
    (typeof window !== "undefined" &&
      typeof window.electronAPI !== "undefined" &&
      window.electronAPI !== null &&
      Object.keys(window.electronAPI || {}).length > 0) ||
    (typeof window !== "undefined" && typeof window.require === "function")
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
      // File system operations
      createDirectory: async (dirPath: string) => {
        console.log("Mock: createDirectory", dirPath);
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true };
      },
      writeFile: async ({
        filePath,
        data,
      }: {
        filePath: string;
        data: any;
      }) => {
        console.log("Mock: writeFile", filePath);
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true };
      },
      readFile: async (filePath: string) => {
        console.log("Mock: readFile", filePath);
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true, data: new Uint8Array() };
      },
      deleteFile: async (filePath: string) => {
        console.log("Mock: deleteFile", filePath);
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true };
      },
      getFileInfo: async (filePath: string) => {
        console.log("Mock: getFileInfo", filePath);
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
          success: true,
          info: {
            size: 1024,
            created: new Date(),
            modified: new Date(),
            isDirectory: false,
            isFile: true,
          },
        };
      },
      openFile: async (filePath: string) => {
        console.log("Mock: openFile", filePath);
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true };
      },
      getUserDataPath: async () => {
        console.log("Mock: getUserDataPath");
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
          success: true,
          path: "C:\\Users\\User\\AppData\\Roaming\\PatientAppointmentSystem",
        };
      },
      joinPaths: async (paths: string[]) => {
        console.log("Mock: joinPaths", paths);
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true, path: paths.join("\\") };
      },
      // Table creation
      ensureMedicalRecordsTable: async () => {
        console.log("Mock: ensureMedicalRecordsTable");
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true };
      },
      ensureNotificationsTable: async () => {
        console.log("Mock: ensureNotificationsTable");
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true };
      },
    };

// Funzione per verificare se l'app è in esecuzione in Electron
export const isRunningInElectron = (): boolean => {
  return isElectron();
};
