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

    // pg_dump command with full path detection
    let pgDumpPath = "pg_dump";

    // Try to find pg_dump in common installation locations
    const possiblePaths = [
      "pg_dump",
      "/usr/bin/pg_dump",
      "/usr/local/bin/pg_dump",
      "/usr/local/pgsql/bin/pg_dump",
      "C:\\Program Files\\PostgreSQL\\latest\\bin\\pg_dump.exe",
      "C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe",
      "C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe",
      "C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dump.exe",
      "C:\\Program Files\\PostgreSQL\\12\\bin\\pg_dump.exe",
    ];

    for (const path of possiblePaths) {
      try {
        // Check if the file exists and is executable
        if (fs.existsSync(path)) {
          pgDumpPath = path;
          console.log(`Found pg_dump at: ${pgDumpPath}`);
          break;
        }
      } catch (err) {
        // Continue to next path
      }
    }

    const command = `"${pgDumpPath}" -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -F c -b -v -f "${fullBackupPath}" "${dbConfig.dbName}"`;

    // Set PGPASSWORD environment variable to avoid password prompt
    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password || "", // Ensure password is always a string
    };

    console.log(`Executing backup to ${fullBackupPath}`);
    try {
      await execPromise(command, { env });
      console.log("Backup completed successfully");
    } catch (execError) {
      console.error("Error executing pg_dump:", execError);

      // Fallback to JSON backup if pg_dump fails
      console.log("Falling back to JSON backup method...");

      // Export database tables as JSON
      const tables = [
        "users",
        "patients",
        "appointments",
        "license",
        "configurations",
        "medical_records",
        "notifications",
      ];

      const backupData = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          path: fullBackupPath,
          error: execError.message,
        },
        tables: {},
      };

      // Connect to database to export data
      const client = new Client({
        host: dbConfig.host,
        port: parseInt(dbConfig.port),
        user: dbConfig.username,
        password: dbConfig.password || "",
        database: dbConfig.dbName,
        ssl: false,
      });

      await client.connect();

      for (const table of tables) {
        try {
          const result = await client.query(`SELECT * FROM ${table}`);
          backupData.tables[table] = result.rows;
        } catch (tableError) {
          console.warn(`Could not backup table ${table}:`, tableError);
          backupData.tables[table] = [];
        }
      }

      await client.end();

      // Save JSON backup
      const jsonBackupPath = fullBackupPath.replace(".sql", ".json");
      fs.writeFileSync(jsonBackupPath, JSON.stringify(backupData, null, 2));
      console.log(`JSON backup saved to ${jsonBackupPath}`);

      // Return success with the JSON path
      return { success: true, path: jsonBackupPath, format: "json" };
    }

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

// File system handlers

// Create directory handler
ipcMain.handle("create-directory", async (event, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Directory created: ${dirPath}`);
    } else {
      console.log(`Directory already exists: ${dirPath}`);
    }
    return { success: true };
  } catch (error) {
    console.error(`Error creating directory: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Write file handler
ipcMain.handle("write-file", async (event, { filePath, data }) => {
  try {
    fs.writeFileSync(filePath, data);
    console.log(`File written: ${filePath}`);
    return { success: true };
  } catch (error) {
    console.error(`Error writing file: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Read file handler
ipcMain.handle("read-file", async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const data = fs.readFileSync(filePath);
    console.log(`File read: ${filePath}`);
    return { success: true, data };
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Delete file handler
ipcMain.handle("delete-file", async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    fs.unlinkSync(filePath);
    console.log(`File deleted: ${filePath}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Get file info handler
ipcMain.handle("get-file-info", async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const stats = fs.statSync(filePath);
    console.log(`File info retrieved: ${filePath}`);
    return {
      success: true,
      info: {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
      },
    };
  } catch (error) {
    console.error(`Error getting file info: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Open file with default application handler
ipcMain.handle("open-file", async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const { shell } = require("electron");
    await shell.openPath(filePath);
    console.log(`File opened: ${filePath}`);
    return { success: true };
  } catch (error) {
    console.error(`Error opening file: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Path operations handlers
ipcMain.handle("join-paths", async (event, paths) => {
  try {
    const joinedPath = path.join(...paths);
    return { success: true, path: joinedPath };
  } catch (error) {
    console.error(`Error joining paths: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Get user data path handler
ipcMain.handle("get-user-data-path", async (event) => {
  try {
    const userDataPath = app.getPath("userData");
    return { success: true, path: userDataPath };
  } catch (error) {
    console.error(`Error getting user data path: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Reset setup handler
ipcMain.handle("reset-setup", async (event) => {
  try {
    // Create a BrowserWindow to access localStorage
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    if (win) {
      // Execute script to remove setupCompleted from localStorage
      await win.webContents.executeJavaScript(
        "localStorage.removeItem('setupCompleted'); console.log('Setup reset: localStorage.setupCompleted removed');",
      );
      console.log("Setup has been reset successfully");
      return { success: true, message: "Setup reset successfully" };
    } else {
      throw new Error("No active window found");
    }
  } catch (error) {
    console.error(`Error resetting setup: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Create medical_records table if it doesn't exist
ipcMain.handle("ensure-medical-records-table", async (event) => {
  try {
    // Get database configuration from app storage
    const dbConfig = getDbConfig();
    if (!dbConfig) {
      throw new Error("Database configuration not found");
    }

    const client = new Client({
      host: dbConfig.host,
      port: parseInt(dbConfig.port),
      user: dbConfig.username,
      password: dbConfig.password || "",
      database: dbConfig.dbName,
      ssl: false,
    });

    await client.connect();
    console.log("Connected to database for medical_records table creation");

    // Create medical_records table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS medical_records (
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
    `;

    await client.query(createTableQuery);
    console.log("medical_records table created or already exists");
    await client.end();

    return { success: true };
  } catch (error) {
    console.error("Error creating medical_records table:", error);
    return { success: false, error: error.message };
  }
});

// Create notifications table if it doesn't exist
ipcMain.handle("ensure-notifications-table", async (event) => {
  try {
    // Get database configuration from app storage
    const dbConfig = getDbConfig();
    if (!dbConfig) {
      throw new Error("Database configuration not found");
    }

    const client = new Client({
      host: dbConfig.host,
      port: parseInt(dbConfig.port),
      user: dbConfig.username,
      password: dbConfig.password || "",
      database: dbConfig.dbName,
      ssl: false,
    });

    await client.connect();
    console.log("Connected to database for notifications table creation");

    // Create notifications table if it doesn't exist
    const createTableQuery = `
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
    `;

    await client.query(createTableQuery);
    console.log("notifications table created or already exists");
    await client.end();

    return { success: true };
  } catch (error) {
    console.error("Error creating notifications table:", error);
    return { success: false, error: error.message };
  }
});
