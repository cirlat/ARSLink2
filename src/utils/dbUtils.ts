/**
 * Utility per la gestione del database
 */

import Database from "@/models/database";
import { electronAPI, isRunningInElectron } from "@/lib/electronBridge";

/**
 * Verifica la connessione al database
 * @returns Promise<boolean> true se la connessione è riuscita, false altrimenti
 */
export async function testDatabaseConnection(config: {
  host: string;
  port: string;
  username: string;
  password: string;
  dbName: string;
}): Promise<boolean> {
  try {
    // Verifica se siamo in Electron
    if (isRunningInElectron()) {
      const result = await electronAPI.connectDatabase(config);
      if (!result.success) {
        throw new Error(result.error || "Errore di connessione al database");
      }
      return true;
    }

    // In un'implementazione reale, qui testeremmo la connessione al database
    // Per ora, simuliamo un test di connessione

    // Verifica che tutti i campi siano compilati
    if (
      !config.host ||
      !config.port ||
      !config.username ||
      !config.password ||
      !config.dbName
    ) {
      throw new Error("Tutti i campi sono obbligatori");
    }

    // Verifica che la porta sia un numero valido
    const port = parseInt(config.port);
    if (isNaN(port) || port <= 0 || port > 65535) {
      throw new Error("La porta deve essere un numero valido tra 1 e 65535");
    }

    // Verifica che l'host sia in un formato valido
    const hostRegex = /^[a-zA-Z0-9.-]+$/;
    if (!hostRegex.test(config.host)) {
      throw new Error("Formato host non valido");
    }

    // Verifica che la password sia abbastanza lunga
    if (config.password.length < 3) {
      throw new Error("La password è troppo corta");
    }

    // Tenta di connettersi al database
    const db = Database.getInstance();
    await db.connect();

    // Esegui una query di test
    await db.query("SELECT 1");

    return true;
  } catch (error) {
    console.error("Errore durante il test di connessione al database:", error);
    throw error;
  }
}

/**
 * Inizializza il database con le tabelle necessarie
 * @returns Promise<boolean> true se l'inizializzazione è riuscita, false altrimenti
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    const db = Database.getInstance();
    await db.initializeDatabase();
    return true;
  } catch (error) {
    console.error("Errore durante l'inizializzazione del database:", error);
    return false;
  }
}

/**
 * Esegue un backup del database
 * @param path Percorso dove salvare il backup
 * @returns Promise<boolean> true se il backup è riuscito, false altrimenti
 */
export async function backupDatabase(path: string): Promise<boolean> {
  try {
    // Verifica se siamo in Electron
    if (isRunningInElectron()) {
      const result = await electronAPI.backupDatabase(path);
      if (!result.success) {
        throw new Error(result.error || "Errore durante il backup");
      }

      // Salva l'informazione del backup in localStorage
      const now = new Date();
      localStorage.setItem("lastBackup", now.toISOString());
      localStorage.setItem("lastBackupPath", path);
      localStorage.setItem("lastBackupStatus", "success");

      return true;
    }

    // Ottieni la configurazione del database
    const dbConfigStr = localStorage.getItem("dbConfig");
    if (!dbConfigStr) {
      throw new Error("Configurazione del database non trovata");
    }

    const dbConfig = JSON.parse(dbConfigStr);
    const { host, port, username, password, dbName } = dbConfig;

    // Crea il nome del file di backup con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `${dbName}_backup_${timestamp}.sql`;
    const fullBackupPath = `${path}/${backupFileName}`;

    console.log(`Esecuzione backup del database in ${fullBackupPath}`);

    // Siamo in un browser, simuliamo l'esecuzione di pg_dump
    // Raccogliamo tutti i dati dal localStorage
    const patients = localStorage.getItem("patients") || "[]";
    const appointments = localStorage.getItem("appointments") || "[]";
    const users = localStorage.getItem("users") || "[]";
    const license = localStorage.getItem("license") || "{}";
    const configurations = localStorage.getItem("configurations") || "{}";

    // Creiamo un oggetto con tutti i dati
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        dbName,
        version: "1.0",
      },
      tables: {
        patients: JSON.parse(patients),
        appointments: JSON.parse(appointments),
        users: JSON.parse(users),
        license: JSON.parse(license),
        configurations: JSON.parse(configurations),
      },
    };

    // Convertiamo in JSON e salviamo come file
    const backupJson = JSON.stringify(backupData, null, 2);

    // Salviamo in localStorage
    localStorage.setItem("lastBackupData", backupJson);

    // Creiamo un link per scaricare il backup
    const blob = new Blob([backupJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backupFileName.replace(".sql", ".json");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Salva l'informazione del backup in localStorage
    const now = new Date();
    localStorage.setItem("lastBackup", now.toISOString());
    localStorage.setItem("lastBackupPath", path);
    localStorage.setItem("lastBackupStatus", "success");

    return true;
  } catch (error) {
    console.error("Errore durante il backup del database:", error);

    // Salva l'informazione del backup fallito in localStorage
    const now = new Date();
    localStorage.setItem("lastBackup", now.toISOString());
    localStorage.setItem("lastBackupStatus", "failed");

    return false;
  }
}

/**
 * Ripristina un backup del database
 * @param path Percorso del file di backup
 * @returns Promise<boolean> true se il ripristino è riuscito, false altrimenti
 */
export async function restoreDatabase(path: string): Promise<boolean> {
  try {
    // Verifica se siamo in Electron
    if (isRunningInElectron()) {
      const result = await electronAPI.restoreDatabase(path);
      if (!result.success) {
        throw new Error(result.error || "Errore durante il ripristino");
      }

      // Salva l'informazione del ripristino in localStorage
      const now = new Date();
      localStorage.setItem("lastRestore", now.toISOString());
      localStorage.setItem("lastRestorePath", path);
      localStorage.setItem("lastRestoreStatus", "success");

      return true;
    }

    // In un'applicazione desktop reale, qui eseguiremmo pg_restore
    // Ma poiché siamo in un browser, dobbiamo gestire il file caricato

    console.log(`Ripristino del database da ${path}`);

    // Leggi il file di backup
    // Nota: in un'applicazione web, il path sarà in realtà un File object
    if (path instanceof File) {
      const file = path;
      const reader = new FileReader();

      // Leggi il file come testo
      const backupData = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });

      // Parsa il JSON
      const backup = JSON.parse(backupData);

      // Verifica che il backup sia valido
      if (!backup.metadata || !backup.tables) {
        throw new Error("Il file di backup non è valido");
      }

      // Ripristina i dati nelle tabelle
      if (backup.tables.patients) {
        localStorage.setItem(
          "patients",
          JSON.stringify(backup.tables.patients),
        );
      }

      if (backup.tables.appointments) {
        localStorage.setItem(
          "appointments",
          JSON.stringify(backup.tables.appointments),
        );
      }

      if (backup.tables.users) {
        localStorage.setItem("users", JSON.stringify(backup.tables.users));
      }

      if (backup.tables.license) {
        localStorage.setItem("license", JSON.stringify(backup.tables.license));
      }

      if (backup.tables.configurations) {
        localStorage.setItem(
          "configurations",
          JSON.stringify(backup.tables.configurations),
        );
      }

      // In un'applicazione reale, qui eseguiremmo una query SQL per ripristinare i dati
      // Ma poiché siamo in un browser, abbiamo già ripristinato i dati in localStorage

      // Salva l'informazione del ripristino in localStorage
      const now = new Date();
      localStorage.setItem("lastRestore", now.toISOString());
      localStorage.setItem("lastRestorePath", file.name);
      localStorage.setItem("lastRestoreStatus", "success");

      return true;
    } else {
      // Se non è un File object, potrebbe essere un percorso o un backup precedentemente salvato
      // Proviamo a caricare dal localStorage
      const backupData = localStorage.getItem("lastBackupData");

      if (!backupData) {
        throw new Error("Nessun backup trovato in localStorage");
      }

      const backup = JSON.parse(backupData);

      // Verifica che il backup sia valido
      if (!backup.metadata || !backup.tables) {
        throw new Error("Il backup in localStorage non è valido");
      }

      // Ripristina i dati nelle tabelle
      if (backup.tables.patients) {
        localStorage.setItem(
          "patients",
          JSON.stringify(backup.tables.patients),
        );
      }

      if (backup.tables.appointments) {
        localStorage.setItem(
          "appointments",
          JSON.stringify(backup.tables.appointments),
        );
      }

      if (backup.tables.users) {
        localStorage.setItem("users", JSON.stringify(backup.tables.users));
      }

      if (backup.tables.license) {
        localStorage.setItem("license", JSON.stringify(backup.tables.license));
      }

      if (backup.tables.configurations) {
        localStorage.setItem(
          "configurations",
          JSON.stringify(backup.tables.configurations),
        );
      }

      // Salva l'informazione del ripristino in localStorage
      const now = new Date();
      localStorage.setItem("lastRestore", now.toISOString());
      localStorage.setItem("lastRestorePath", path);
      localStorage.setItem("lastRestoreStatus", "success");

      return true;
    }
  } catch (error) {
    console.error("Errore durante il ripristino del database:", error);

    // Salva l'informazione del ripristino fallito in localStorage
    const now = new Date();
    localStorage.setItem("lastRestore", now.toISOString());
    localStorage.setItem("lastRestoreStatus", "failed");

    return false;
  }
}
