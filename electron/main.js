const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");

// Set environment variable for development mode
process.env.NODE_ENV = process.env.ELECTRON_START_URL
  ? "development"
  : "production";

// Dynamically import pg to avoid module issues
let pg;
let Client;
try {
  pg = require("pg");
  Client = pg.Client;
} catch (error) {
  console.error("Failed to load pg module:", error);
}

const execPromise = util.promisify(exec);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // In development, load from Vite dev server
  // In production, load from built files
  const startUrl = process.env.ELECTRON_START_URL || "http://localhost:5173";

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Database connection handler
ipcMain.handle("connect-database", async (event, config) => {
  try {
    if (!Client) {
      throw new Error("PostgreSQL client not available");
    }

    // Prima verifica se il database esiste
    try {
      // Connessione al database postgres (database di sistema)
      const pgClient = new Client({
        host: config.host,
        port: parseInt(config.port),
        user: config.username,
        password: config.password,
        database: "postgres",
        ssl: false,
        connectionTimeoutMillis: 5000,
      });

      await pgClient.connect();

      // Verifica se il database esiste
      const checkResult = await pgClient.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [config.dbName],
      );

      // Se il database non esiste, crealo
      if (checkResult.rows.length === 0) {
        await pgClient.query(`CREATE DATABASE ${config.dbName}`);
        console.log(`Database ${config.dbName} creato con successo`);
      }

      await pgClient.end();
    } catch (pgError) {
      console.error("Error checking/creating database:", pgError);
      // Continuiamo comunque con il tentativo di connessione al database specificato
    }

    // Ora tenta la connessione al database specificato
    const client = new Client({
      host: config.host,
      port: parseInt(config.port),
      user: config.username,
      password: config.password,
      database: config.dbName,
      ssl: false,
      connectionTimeoutMillis: 5000,
    });

    await client.connect();
    await client.query("SELECT NOW()");
    await client.end();

    return { success: true, message: "Database connection successful" };
  } catch (error) {
    console.error("Database connection error:", error);
    return { success: false, error: error.message };
  }
});

// Query execution handler
ipcMain.handle("execute-query", async (event, { query, params }) => {
  try {
    if (!Client) {
      throw new Error("PostgreSQL client not available");
    }

    // Get DB config from app storage
    const dbConfig = getDbConfig();

    const client = new Client({
      host: dbConfig.host,
      port: parseInt(dbConfig.port),
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.dbName,
      ssl: false,
    });

    await client.connect();

    try {
      // Esegui la query
      const result = await client.query(query, params || []);

      // Log per debug
      console.log(`Query eseguita con successo: ${query.substring(0, 50)}...`);
      console.log(`Parametri: ${JSON.stringify(params || [])}`);
      console.log(`Risultato: ${result.rowCount} righe`);

      return { success: true, rows: result.rows, rowCount: result.rowCount };
    } catch (queryError) {
      console.error("Query execution error:", queryError);
      return { success: false, error: queryError.message };
    } finally {
      // Assicurati che il client venga sempre chiuso
      await client.end();
    }
  } catch (error) {
    console.error("Database connection error:", error);
    return { success: false, error: error.message };
  }
});

// Backup database handler
ipcMain.handle("backup-database", async (event, path) => {
  try {
    const dbConfig = getDbConfig();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `${dbConfig.dbName}_backup_${timestamp}.sql`;
    const fullBackupPath = `${path}/${backupFileName}`;

    // Ensure directory exists
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }

    const command = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -F c -b -v -f "${fullBackupPath}" ${dbConfig.dbName}`;
    const env = { ...process.env, PGPASSWORD: dbConfig.password };

    await execPromise(command, { env });

    return { success: true, path: fullBackupPath };
  } catch (error) {
    console.error("Backup error:", error);
    return { success: false, error: error.message };
  }
});

// Restore database handler
ipcMain.handle("restore-database", async (event, path) => {
  try {
    const dbConfig = getDbConfig();

    const command = `pg_restore -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.dbName} -c "${path}"`;
    const env = { ...process.env, PGPASSWORD: dbConfig.password };

    await execPromise(command, { env });

    return { success: true };
  } catch (error) {
    console.error("Restore error:", error);
    return { success: false, error: error.message };
  }
});

// Helper function to get DB config
function getDbConfig() {
  try {
    // Tenta di leggere la configurazione dal localStorage
    const storedConfig = mainWindow?.webContents.executeJavaScript(
      'localStorage.getItem("dbConfig")',
    );

    if (storedConfig) {
      const config = JSON.parse(storedConfig);
      console.log("Configurazione DB caricata da localStorage:", config);
      return config;
    }
  } catch (error) {
    console.error("Errore nel caricamento della configurazione DB:", error);
  }

  // Valori di default se non è possibile caricare dal localStorage
  return {
    host: "localhost",
    port: "5432",
    username: "postgres",
    password: "postgres",
    dbName: "patient_appointment_system",
  };
}
