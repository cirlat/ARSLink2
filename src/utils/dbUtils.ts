/**
 * Utility per la gestione del database
 */

import Database from "@/models/database";

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
    // In un'implementazione reale, qui eseguiremmo un dump del database
    // Per ora, simuliamo un backup

    console.log(`Simulazione backup del database in ${path}`);

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
    // In un'implementazione reale, qui ripristineremmo il database dal backup
    // Per ora, simuliamo un ripristino

    console.log(`Simulazione ripristino del database da ${path}`);

    // Salva l'informazione del ripristino in localStorage
    const now = new Date();
    localStorage.setItem("lastRestore", now.toISOString());
    localStorage.setItem("lastRestorePath", path);
    localStorage.setItem("lastRestoreStatus", "success");

    return true;
  } catch (error) {
    console.error("Errore durante il ripristino del database:", error);

    // Salva l'informazione del ripristino fallito in localStorage
    const now = new Date();
    localStorage.setItem("lastRestore", now.toISOString());
    localStorage.setItem("lastRestoreStatus", "failed");

    return false;
  }
}
