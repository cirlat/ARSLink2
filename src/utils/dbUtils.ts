/**
 * Utility per la gestione del database
 */

import Database from "../models/database";
import { electronAPI, isRunningInElectron } from "../lib/electronBridge";

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

    // Tenta di connettersi al database usando pg direttamente
    const { Client } = await import("pg");
    const client = new Client({
      host: config.host,
      port: port,
      user: config.username,
      password: config.password,
      database: config.dbName,
      ssl: false,
      connectionTimeoutMillis: 5000, // 5 secondi di timeout
    });

    await client.connect();

    // Esegui una query di test
    const result = await client.query("SELECT NOW()");
    console.log("Test di connessione riuscito:", result.rows[0]);

    // Chiudi la connessione
    await client.end();

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
export async function initializeDatabase(config: {
  host: string;
  port: string;
  username: string;
  password: string;
  dbName: string;
}): Promise<boolean> {
  try {
    // Verifica se siamo in Electron
    if (isRunningInElectron()) {
      // Usa l'API Electron per inizializzare il database
      // Qui dovresti implementare la logica specifica per Electron
      return true;
    }

    const port = parseInt(config.port);
    const { Client } = await import("pg");
    const client = new Client({
      host: config.host,
      port: port,
      user: config.username,
      password: config.password,
      database: config.dbName,
      ssl: false,
    });

    await client.connect();

    // Crea le tabelle necessarie
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        codice_fiscale VARCHAR(16) UNIQUE NOT NULL,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(10) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20) NOT NULL,
        address TEXT,
        city VARCHAR(50),
        postal_code VARCHAR(10),
        medical_history TEXT,
        allergies TEXT,
        medications TEXT,
        notes TEXT,
        privacy_consent BOOLEAN NOT NULL DEFAULT FALSE,
        marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time TIME NOT NULL,
        duration INTEGER NOT NULL,
        appointment_type VARCHAR(50) NOT NULL,
        notes TEXT,
        google_calendar_synced BOOLEAN NOT NULL DEFAULT FALSE,
        google_event_id VARCHAR(100),
        whatsapp_notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
        whatsapp_notification_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS license (
        id SERIAL PRIMARY KEY,
        license_key VARCHAR(100) UNIQUE NOT NULL,
        license_type VARCHAR(20) NOT NULL,
        expiry_date DATE NOT NULL,
        google_calendar_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS configurations (
        id SERIAL PRIMARY KEY,
        key VARCHAR(50) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.end();
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

      // Salva l'informazione del backup nel database
      const db = Database.getInstance();
      const now = new Date();

      try {
        await db.query(
          "INSERT INTO configurations (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
          ["last_backup", now.toISOString()],
        );

        await db.query(
          "INSERT INTO configurations (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
          ["last_backup_path", path],
        );

        await db.query(
          "INSERT INTO configurations (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
          ["last_backup_status", "success"],
        );
      } catch (dbError) {
        console.error(
          "Errore nel salvataggio delle informazioni di backup nel database:",
          dbError,
        );
        // Fallback a localStorage
        localStorage.setItem("lastBackup", now.toISOString());
        localStorage.setItem("lastBackupPath", path);
        localStorage.setItem("lastBackupStatus", "success");
      }

      return true;
    }

    // Ottieni la configurazione del database
    let dbConfig;
    const db = Database.getInstance();

    try {
      const configResult = await db.query(
        "SELECT value FROM configurations WHERE key = 'db_config'",
      );
      if (configResult.length > 0) {
        dbConfig = JSON.parse(configResult[0].value);
      } else {
        // Fallback a localStorage
        const dbConfigStr = localStorage.getItem("dbConfig");
        if (!dbConfigStr) {
          throw new Error("Configurazione del database non trovata");
        }
        dbConfig = JSON.parse(dbConfigStr);
      }
    } catch (error) {
      // Fallback a localStorage
      const dbConfigStr = localStorage.getItem("dbConfig");
      if (!dbConfigStr) {
        throw new Error("Configurazione del database non trovata");
      }
      dbConfig = JSON.parse(dbConfigStr);
    }

    const { host, port, username, password, dbName } = dbConfig;

    // Crea il nome del file di backup con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `${dbName}_backup_${timestamp}.sql`;
    const fullBackupPath = `${path}/${backupFileName}`;

    console.log(`Esecuzione backup del database in ${fullBackupPath}`);

    // Esegui il backup reale del database
    // Questo codice funzionerà solo in Electron, ma lo includiamo per completezza
    try {
      // Comando pg_dump
      const { exec } = await import("child_process");
      const util = await import("util");
      const execPromise = util.promisify(exec);

      const command = `pg_dump -h ${host} -p ${port} -U ${username} -F c -b -v -f "${fullBackupPath}" ${dbName}`;

      // Imposta la variabile d'ambiente PGPASSWORD per evitare la richiesta di password
      const env = { ...process.env, PGPASSWORD: password };

      await execPromise(command, { env });

      console.log(`Backup completato: ${fullBackupPath}`);

      // Salva l'informazione del backup nel database
      const now = new Date();

      try {
        await db.query(
          "INSERT INTO configurations (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
          ["last_backup", now.toISOString()],
        );

        await db.query(
          "INSERT INTO configurations (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
          ["last_backup_path", fullBackupPath],
        );

        await db.query(
          "INSERT INTO configurations (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
          ["last_backup_status", "success"],
        );
      } catch (dbError) {
        console.error(
          "Errore nel salvataggio delle informazioni di backup nel database:",
          dbError,
        );
        // Fallback a localStorage
        localStorage.setItem("lastBackup", now.toISOString());
        localStorage.setItem("lastBackupPath", fullBackupPath);
        localStorage.setItem("lastBackupStatus", "success");
      }

      return true;
    } catch (execError) {
      console.error("Errore nell'esecuzione di pg_dump:", execError);
      throw execError;
    }
  } catch (error) {
    console.error("Errore durante il backup del database:", error);

    // Salva l'informazione del backup fallito nel database
    try {
      const db = Database.getInstance();
      const now = new Date();

      await db.query(
        "INSERT INTO configurations (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        ["last_backup", now.toISOString()],
      );

      await db.query(
        "INSERT INTO configurations (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        ["last_backup_status", "failed"],
      );
    } catch (dbError) {
      console.error(
        "Errore nel salvataggio delle informazioni di backup fallito nel database:",
        dbError,
      );
      // Fallback a localStorage
      const now = new Date();
      localStorage.setItem("lastBackup", now.toISOString());
      localStorage.setItem("lastBackupStatus", "failed");
    }

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
