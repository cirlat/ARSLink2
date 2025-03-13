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
      const dbClient = new Client({
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
    console.error("Error in connect-database handler:", error);
    return { success: false, error: error.message };
  }
});

// Execute query handler
ipcMain.handle("execute-query", async (event, { query, params }) => {
  try {
    if (!Client) {
      throw new Error("PostgreSQL client not available");
    }

    // Get database configuration from app storage
    const dbConfig = getDbConfig();
    if (!dbConfig) {
      throw new Error("Database configuration not found");
    }

    const client = new Client({
      host: dbConfig.host,
      port: parseInt(dbConfig.port),
      user: dbConfig.username,
      password: dbConfig.password || "", // Ensure password is always a string
      database: dbConfig.dbName,
      ssl: false,
    });

    await client.connect();
    console.log("Connected to database for query execution");

    const result = await client.query(query, params);
    await client.end();

    return { success: true, rows: result.rows, rowCount: result.rowCount };
  } catch (error) {
    console.error("Error executing query:", error);
    return { success: false, error: error.message };
  }
});

// Backup database handler
ipcMain.handle("backup-database", async (event, backupPath) => {
  try {
    // Get database configuration from app storage
    const dbConfig = getDbConfig();
    if (!dbConfig) {
      throw new Error("Database configuration not found");
    }

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `${dbConfig.dbName}_backup_${timestamp}.sql`;
    const fullBackupPath = path.join(backupPath, backupFileName);

    // pg_dump command
    const command = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -F c -b -v -f "${fullBackupPath}" "${dbConfig.dbName}"`;

    // Set PGPASSWORD environment variable to avoid password prompt
    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password || "", // Ensure password is always a string
    };

    console.log(`Executing backup to ${fullBackupPath}`);
    await execPromise(command, { env });
    console.log("Backup completed successfully");

    return { success: true, path: fullBackupPath };
  } catch (error) {
    console.error("Error backing up database:", error);
    return { success: false, error: error.message };
  }
});

// Restore database handler
ipcMain.handle("restore-database", async (event, restorePath) => {
  try {
    // Get database configuration from app storage
    const dbConfig = getDbConfig();
    if (!dbConfig) {
      throw new Error("Database configuration not found");
    }

    // Check if restore file exists
    if (!fs.existsSync(restorePath)) {
      throw new Error(`Restore file not found: ${restorePath}`);
    }

    // pg_restore command
    const command = `pg_restore -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d "${dbConfig.dbName}" -c -v "${restorePath}"`;

    // Set PGPASSWORD environment variable to avoid password prompt
    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password || "", // Ensure password is always a string
    };

    console.log(`Executing restore from ${restorePath}`);
    await execPromise(command, { env });
    console.log("Restore completed successfully");

    return { success: true };
  } catch (error) {
    console.error("Error restoring database:", error);
    return { success: false, error: error.message };
  }
});

// Helper function to get database configuration
function getDbConfig() {
  try {
    // In a real implementation, this would read from a configuration file or secure storage
    // For now, we'll use a simple approach
    const configPath = path.join(app.getPath("userData"), "dbConfig.json");

    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, "utf8");
      return JSON.parse(configData);
    }

    return null;
  } catch (error) {
    console.error("Error reading database configuration:", error);
    return null;
  }
}

// Helper function to save database configuration
function saveDbConfig(config) {
  try {
    const configPath = path.join(app.getPath("userData"), "dbConfig.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving database configuration:", error);
    return false;
  }
}

// Save database configuration handler
ipcMain.handle("save-db-config", async (event, config) => {
  try {
    const success = saveDbConfig(config);
    return { success };
  } catch (error) {
    console.error("Error saving database configuration:", error);
    return { success: false, error: error.message };
  }
});
