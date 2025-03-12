const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const pg = require("pg");
const { Client } = pg;
const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");

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
  const startUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:5173"
      : `file://${path.join(__dirname, "../dist/index.html")}`;

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (process.env.NODE_ENV === "development") {
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
    const result = await client.query(query, params || []);
    await client.end();

    return { success: true, rows: result.rows };
  } catch (error) {
    console.error("Query execution error:", error);
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
  // In a real app, this would read from a secure storage
  // For now, we'll use hardcoded values
  return {
    host: "localhost",
    port: "5432",
    username: "postgres",
    password: "postgres",
    dbName: "patient_appointment_system",
  };
}
