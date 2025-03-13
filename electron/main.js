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
  console.log("Successfully loaded pg module");
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

    console.log("Attempting database connection with:", {
      host: config.host,
      port: config.port,
      user: config.username,
      database: config.dbName,
    });

    // First check if the database exists
    try {
      // Connect to postgres system database
      const pgClient = new Client({
        host: config.host,
        port: parseInt(config.port),
        user: config.username,
        password: typeof config.password === "string" ? config.password : "", // Ensure password is always a string
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
        await pgClient.query(`CREATE DATABASE "${config.dbName}"`); // Added quotes around database name
        console.log(`Database ${config.dbName} created successfully`);
      } else {
        console.log(`Database ${config.dbName} already exists`);
      }

      await pgClient.end();
    } catch (pgError) {
      console.error("Error checking/creating database:", pgError);
      // Continue with the attempt to connect to the specified database
    }

    // Now attempt to connect to the specified database
    const client = new Client({
      host: config.host,
      port: parseInt(config.port),
      user: config.username,
      password: config.password || "", // Ensure password is always a string
      database: config.dbName,
      ssl: false,
      connectionTimeoutMillis: 5000,
    });

    await client.connect();
    const testResult = await client.query("SELECT NOW()");
    console.log("Database connection test successful:", testResult.rows[0]);
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
    if (!dbConfig) {
      throw new Error("Database configuration not found");
    }

    console.log(`Executing query: ${query.substring(0, 100)}...`);
    console.log(`With parameters: ${JSON.stringify(params || [])}`);

    const client = new Client({
      host: dbConfig.host,
      port: parseInt(dbConfig.port),
      user: dbConfig.username,
      password: typeof dbConfig.password === "string" ? dbConfig.password : "", // Ensure password is always a string
      database: dbConfig.dbName,
      ssl: false,
    });

    await client.connect();

    try {
      // Execute the query
      const result = await client.query(query, params || []);

      // Debug log
      console.log(`Query executed successfully: ${query.substring(0, 50)}...`);
      console.log(`Parameters: ${JSON.stringify(params || [])}`);
      console.log(`Result: ${result.rowCount} rows`);

      return { success: true, rows: result.rows, rowCount: result.rowCount };
    } catch (queryError) {
      console.error("Query execution error:", queryError);
      return { success: false, error: queryError.message };
    } finally {
      // Always ensure the client is closed
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
    if (!dbConfig) {
      throw new Error("Database configuration not found");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `${dbConfig.dbName}_backup_${timestamp}.sql`;
    const fullBackupPath = `${path}/${backupFileName}`;

    // Ensure directory exists
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }

    const command = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -F c -b -v -f "${fullBackupPath}" "${dbConfig.dbName}"`;
    const env = { ...process.env, PGPASSWORD: dbConfig.password || "" }; // Ensure password is always a string

    console.log(`Executing backup command: ${command}`);
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
    if (!dbConfig) {
      throw new Error("Database configuration not found");
    }

    const command = `pg_restore -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d "${dbConfig.dbName}" -c "${path}"`;
    const env = { ...process.env, PGPASSWORD: dbConfig.password || "" }; // Ensure password is always a string

    console.log(`Executing restore command: ${command}`);
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
    // Try to read configuration from localStorage
    if (mainWindow) {
      const storedConfig = mainWindow.webContents.executeJavaScript(
        'localStorage.getItem("dbConfig")',
        true,
      );

      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        console.log("DB configuration loaded from localStorage:", {
          host: config.host,
          port: config.port,
          user: config.username,
          database: config.dbName,
        });
        return config;
      }
    }
  } catch (error) {
    console.error("Error loading DB configuration:", error);
  }

  // Default values if unable to load from localStorage
  console.log("Using default database configuration");
  return {
    host: "localhost",
    port: "5432",
    username: "postgres",
    password: "", // Empty default password for security
    dbName: "patient_appointment_system",
  };
}
