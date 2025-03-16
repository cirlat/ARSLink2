const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");

const execPromise = util.promisify(exec);

let setupWindow;

function createSetupWindow() {
  setupWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "setup-preload.js"),
    },
    title: "Setup Wizard - Sistema Gestione Appuntamenti",
  });

  // Carica il file HTML del setup wizard
  setupWindow.loadFile(path.join(__dirname, "../setup-wizard/index.html"));

  // Apri DevTools in modalità sviluppo
  if (process.env.NODE_ENV === "development") {
    setupWindow.webContents.openDevTools();
  }

  setupWindow.on("closed", () => {
    setupWindow = null;
  });
}

// Funzione per verificare se il setup è già stato completato
function isSetupCompleted() {
  const userDataPath = app.getPath("userData");
  const setupCompletedPath = path.join(userDataPath, "setup-completed");
  return fs.existsSync(setupCompletedPath);
}

// Funzione per segnare il setup come completato
function markSetupAsCompleted() {
  const userDataPath = app.getPath("userData");
  const setupCompletedPath = path.join(userDataPath, "setup-completed");
  fs.writeFileSync(setupCompletedPath, new Date().toISOString());
}

// Funzione per salvare le credenziali dell'utente
function saveUserCredentials(user) {
  try {
    const userDataPath = app.getPath("userData");
    const userCredentialsPath = path.join(userDataPath, "user.json");
    fs.writeFileSync(userCredentialsPath, JSON.stringify(user, null, 2));
    console.log("Credenziali utente salvate con successo");
    return true;
  } catch (error) {
    console.error("Errore nel salvataggio delle credenziali utente:", error);
    return false;
  }
}

// Funzione per salvare i dati della licenza
function saveLicenseData(license) {
  try {
    const userDataPath = app.getPath("userData");
    const licensePath = path.join(userDataPath, "license.json");
    fs.writeFileSync(licensePath, JSON.stringify(license, null, 2));
    console.log("Dati licenza salvati con successo");
    return true;
  } catch (error) {
    console.error("Errore nel salvataggio dei dati della licenza:", error);
    return false;
  }
}

// Funzione per ottenere la configurazione del database
function getDbConfig() {
  try {
    const userDataPath = app.getPath("userData");
    const dbConfigPath = path.join(userDataPath, "dbConfig.json");
    
    if (fs.existsSync(dbConfigPath)) {
      const configData = fs.readFileSync(dbConfigPath, "utf8");
      return JSON.parse(configData);
    }
    
    return null;
  } catch (error) {
    console.error("Errore nella lettura della configurazione del database:", error);
    return null;
  }
}

// Funzione per resettare lo stato del setup (per i test)
function resetSetup() {
  const userDataPath = app.getPath("userData");
  const setupCompletedPath = path.join(userDataPath, "setup-completed");
  if (fs.existsSync(setupCompletedPath)) {
    fs.unlinkSync(setupCompletedPath);
  }
  console.log("Setup reset completato");
}

// Gestori IPC per il setup wizard
ipcMain.handle("setup-complete-setup", async (event) => {
  try {
    markSetupAsCompleted();
    return { success: true, message: "Setup completato con successo" };
  } catch (error) {
    console.error("Errore nel completamento del setup:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("setup-test-connection", async (event, config) => {
  try {
    console.log("Tentativo di connessione al database con:", {
      host: config.host,
      port: config.port,
      user: config.username,
      database: config.dbName,
    });

    // Verifica se pg è disponibile
    let pg;
    try {
      pg = require("pg");
    } catch (error) {
      console.error("Errore nel caricamento del modulo pg:", error);
      return {
        success: false,
        error: "Modulo PostgreSQL non disponibile",
      };
    }

    // Prima verifichiamo se il database esiste
    try {
      // Connect to postgres system database
      const pgClient = new pg.Client({
        host: config.host,
        port: parseInt(config.port),
        user: config.username,
        password: config.password || "", // Ensure password is always a string
        database: "postgres",
        ssl: false,
        connectionTimeoutMillis: 5000,
      });

      await pgClient.connect();
      console.log("Connected to postgres database successfully");

      // Check if the database exists
      const checkResult = await pgClient.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [config.dbName],
      );

      // If the database doesn't exist, create it
      if (checkResult.rows.length === 0) {
        console.log(
          `Database ${config.dbName} does not exist, creating it now...`,
        );
        await pgClient.query(`CREATE DATABASE "${config.dbName}"`);
        console.log(`Database ${config.dbName} created successfully`);
      } else {
        console.log(`Database ${config.dbName} already exists`);
      }

      await pgClient.end();

      // Now connect to the specific database
      const dbClient = new pg.Client({
        host: config.host,
        port: parseInt(config.port),
        user: config.username,
        password: config.password || "", // Ensure password is always a string
        database: config.dbName,
        ssl: false,
        connectionTimeoutMillis: 5000,
      });

      await dbClient.connect();
      console.log(`Connected to ${config.dbName} database successfully`);
      await dbClient.end();

      return { success: true, message: "Database connection successful" };
    } catch (error) {
      console.error("Database connection error:", error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error("Error in setup-test-connection handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("setup-create-tables", async (event, config) => {
  try {
    console.log("Creazione tabelle nel database:", config.dbName);

    // Verifica se pg è disponibile
    let pg;
    try {
      pg = require("pg");
    } catch (error) {
      console.error("Errore nel caricamento del modulo pg:", error);
      return {
        success: false,
        error: "Modulo PostgreSQL non disponibile",
      };
    }

    const client = new pg.Client({
      host: config.host,
      port: parseInt(config.port),
      user: config.username,
      password: config.password || "",
      database: config.dbName,
      ssl: false,
    });

    await client.connect();

    try {
      await client.query("BEGIN");

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "users" (
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

      // Patients table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "patients" (
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

      // Appointments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "appointments" (
          id SERIAL PRIMARY KEY,
          patient_id INTEGER NOT NULL REFERENCES "patients"(id) ON DELETE CASCADE,
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

      // License table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "license" (
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

      // Configurations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "configurations" (
          id SERIAL PRIMARY KEY,
          key VARCHAR(50) UNIQUE NOT NULL,
          value TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Notifications table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "notifications" (
          id SERIAL PRIMARY KEY,
          patient_id INTEGER NOT NULL REFERENCES "patients"(id) ON DELETE CASCADE,
          patient_name VARCHAR(100) NOT NULL,
          appointment_id INTEGER REFERENCES "appointments"(id) ON DELETE SET NULL,
          appointment_date DATE,
          appointment_time TIME,
          message TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          type VARCHAR(20) NOT NULL,
          sent_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // medical_records table
      await client.query(`
        CREATE TABLE IF NOT EXISTS "medical_records" (
          id SERIAL PRIMARY KEY,
          patient_id INTEGER NOT NULL,
          title VARCHAR(255) NOT NULL,
          date DATE NOT NULL,
          doctor VARCHAR(100) NOT NULL,
          description TEXT,
          files TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      //notifications table
      await client.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          patient_id INTEGER NOT NULL,
          patient_name VARCHAR(100) NOT NULL,
          appointment_id INTEGER,
          appointment_date DATE,
          appointment_time TIME,
          message TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          type VARCHAR(20) NOT NULL,
          sent_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query("COMMIT");
      console.log("Database tables created successfully");

      await client.end();
      return { success: true, message: "Database tables created successfully" };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating database tables:", error);
      await client.end();
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error("Error in setup-create-tables handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("setup-create-admin", async (event, adminUser) => {
  try {
    console.log("Creazione utente amministratore:", adminUser.username);

    // Verifica se pg è disponibile
    let pg;
    try {
      pg = require("pg");
    } catch (error) {
      console.error("Errore nel caricamento del modulo pg:", error);
      return {
        success: false,
        error: "Modulo PostgreSQL non disponibile",
      };
    }

    // Ottieni la configurazione del database
    const dbConfig = getDbConfig();
    if (!dbConfig) {
      console.error("Configurazione database non trovata, salvando solo le credenziali locali");
      // Salva le credenziali per il login anche se non possiamo connetterci al database
      saveUserCredentials({
        username: adminUser.username,
        fullName: adminUser.fullName,
        role: "Medico",
      });
      
      return {
        success: true,
        message: "Utente amministratore salvato localmente (database non disponibile)",
      };
    }

    const client = new pg.Client({
      host: dbConfig.host,
      port: parseInt(dbConfig.port),
      user: dbConfig.username,
      password: dbConfig.password || "",
      database: dbConfig.dbName,
      ssl: false,
    });

    try {
      await client.connect();
      console.log("Connesso al database per creare l'utente amministratore");

      // In un'implementazione reale, qui dovremmo hashare la password
      // Per semplicità, la salviamo in chiaro
      const result = await client.query(
        `INSERT INTO users (username, password, full_name, email, role) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id`,
        [
          adminUser.username,
          adminUser.password,
          adminUser.fullName,
          adminUser.email,
          "Medico",
        ],
      );

      await client.end();
      console.log("Utente amministratore creato nel database con successo");

      // Salva anche le credenziali per il login
      saveUserCredentials({
        username: adminUser.username,
        fullName: adminUser.fullName,
        role: "Medico",
      });

      return {
        success: true,
        message: "Utente amministratore creato con successo",
        userId: result.rows[0].id,
      };
    } catch (error) {
      console.error("Error creating admin user in database:", error);
      try {
        await client.end();
      } catch (e) {
        console.error("Error closing client:", e);
      }
      
      // Salva comunque le credenziali localmente anche se il database fallisce
      saveUserCredentials({
        username: adminUser.username,
        fullName: adminUser.fullName,
        role: "Medico",
      });
      
      return { 
        success: true, 
        message: "Utente amministratore salvato localmente (errore database: " + error.message + ")"
      };
    }
  } catch (error) {
    console.error("Error in setup-create-admin handler:", error);
    // Salva comunque le credenziali localmente in caso di errore
    try {
      saveUserCredentials({
        username: adminUser.username,
        fullName: adminUser.fullName,
        role: "Medico",
      });
      return { 
        success: true, 
        message: "Utente amministratore salvato localmente (errore generale: " + error.message + ")"
      };
    } catch (e) {
      return { success: false, error: error.message };
    }
  }
});

ipcMain.handle("setup-save-license", async (event, licenseData) => {
  try {
    console.log("Salvataggio licenza:", licenseData);

    // Verifica se pg è disponibile
    let pg;
    try {
      pg = require("pg");
    } catch (error) {
      console.error("Errore nel caricamento del modulo pg:", error);
      return {
        success: false,
        error: "Modulo PostgreSQL non disponibile",
      };
    }

    // Ottieni la configurazione del database
    const dbConfig = getDbConfig();
    if (!dbConfig) {
      return {
        success: false,
        error: "Configurazione database non trovata",
      };
    }

    const client = new pg.Client({
      host: dbConfig.host,
      port: parseInt(dbConfig.port),
      user: dbConfig.username,
      password: dbConfig.password || "",
      database: dbConfig.dbName,
      ssl: false,
    });

    await client.connect();

    try {
      const result = await client.query(
        `INSERT INTO license (license_key, license_type, expiry_date, google_calendar_enabled, whatsapp_enabled) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id`,
        [
          licenseData.licenseKey,
          licenseData.licenseType,
          licenseData.expiryDate,
          licenseData.googleCalendarEnabled,
          licenseData.whatsappEnabled,
        ],
      );

      await client.end();

      // Salva anche in localStorage
      saveLicenseData(licenseData);

      return {
        success: true,
        message: "Licenza salvata con successo",
        licenseId: result.rows[0].id,
      };
    } catch (error) {
      console.error("Error saving license:", error);
      await client.end();
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error("Error in setup-save-license handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("setup-save-config", async (event, config) => {
  try {
    console.log("Salvataggio configurazione:", config.key);

    // Verifica se pg è disponibile
    let pg;
    try {
      pg = require("pg");
    } catch (error) {
      console.error("Errore nel caricamento del modulo pg:", error);
      return {
        success: false,
        error: "Modulo PostgreSQL non disponibile",
      };
    }

    // Ottieni la configurazione del database
    const dbConfig = getDbConfig();
    if (!dbConfig) {
      // Salva comunque la configurazione in un file locale
      try {
        const userDataPath = app.getPath("userData");
        const configDir = path.join(userDataPath, "config");
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        const configPath = path.join(configDir, `${config.key}.json`);
        fs.writeFileSync(configPath, JSON.stringify(config.value, null, 2));
        return {
          success: true,
          message: `Configurazione ${config.key} salvata localmente`,
        };
      } catch (fileError) {
        console.error("Errore nel salvataggio della configurazione in file:", fileError);
        return {
          success: false,
          error: "Errore nel salvataggio della configurazione: " + fileError.message,
        };
      }
    }

    const client = new pg.Client({
      host: dbConfig.host,
      port: parseInt(dbConfig.port),
      user: dbConfig.username,
      password: dbConfig.password || "",
      database: dbConfig.dbName,
      ssl: false,
    });

    await client.connect();

    try {
      const result = await client.query(
        `INSERT INTO configurations (key, value) 
         VALUES ($1, $2) 
         ON CONFLICT (key) DO UPDATE SET value = $2 
         RETURNING id`,
        [config.key, JSON.stringify(config.value)]