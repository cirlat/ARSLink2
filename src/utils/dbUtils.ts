/**
 * Utility for database management
 */

import Database from "../models/database";
import { electronAPI, isRunningInElectron } from "../lib/electronBridge";

/**
 * Test database connection
 * @returns Promise<boolean> true if connection successful, false otherwise
 */
export async function testDatabaseConnection(config: {
  host: string;
  port: string;
  username: string;
  password: string;
  dbName: string;
}): Promise<boolean> {
  try {
    console.log("Testing database connection with:", {
      host: config.host,
      port: config.port,
      username: config.username,
      dbName: config.dbName,
    });

    // Check if we're in Electron
    if (isRunningInElectron()) {
      console.log("Using Electron API for database connection");
      const result = await electronAPI.connectDatabase({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password || "", // Ensure password is always a string
        dbName: config.dbName,
      });
      if (!result.success) {
        console.error("Electron API connection error:", result.error);
        throw new Error(result.error || "Database connection error");
      }
      console.log("Electron API connection successful");
      return true;
    }

    // Verify all fields are filled
    if (!config.host || !config.port || !config.username || !config.dbName) {
      throw new Error("All fields are required");
    }

    // Verify port is a valid number
    const port = parseInt(config.port);
    if (isNaN(port) || port <= 0 || port > 65535) {
      throw new Error("Port must be a valid number between 1 and 65535");
    }

    // Verify host is in a valid format
    const hostRegex = /^[a-zA-Z0-9.-]+$/;
    if (!hostRegex.test(config.host)) {
      throw new Error("Invalid host format");
    }

    // In browser environment, use simulated Electron API
    console.log("Using simulated Electron API (browser environment)");
    const result = await electronAPI.connectDatabase({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password || "", // Ensure password is always a string
      dbName: config.dbName,
    });
    if (!result.success) {
      console.error("Simulated connection error:", result.error);
      throw new Error(result.error || "Database connection error");
    }
    console.log("Connection test successful (simulation):", result);

    return true;
  } catch (error) {
    console.error("Database connection test error:", error);
    throw error;
  }
}

/**
 * Create database if it doesn't exist
 * @returns Promise<boolean> true if creation successful, false otherwise
 */
export async function createDatabase(config: {
  host: string;
  port: string;
  username: string;
  password: string;
  dbName: string;
}): Promise<boolean> {
  try {
    console.log(
      `Attempting to create database ${config.dbName} if it doesn't exist`,
    );

    // Check if we're in Electron
    if (isRunningInElectron()) {
      try {
        // First connect to postgres system database
        console.log("Connecting to postgres system database");
        const connectResult = await electronAPI.connectDatabase({
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password || "", // Ensure password is always a string
          dbName: "postgres", // Use system database
        });

        if (!connectResult.success) {
          console.error(
            "Error connecting to postgres system database:",
            connectResult.error,
          );
          return false;
        }

        // Check if database already exists
        console.log(`Checking if database ${config.dbName} exists`);
        const checkResult = await electronAPI.executeQuery(
          "SELECT 1 FROM pg_database WHERE datname = $1",
          [config.dbName],
        );

        // If database doesn't exist, create it
        if (!checkResult.success || checkResult.rows?.length === 0) {
          console.log(`Database ${config.dbName} doesn't exist, creating it`);
          const createResult = await electronAPI.executeQuery(
            `CREATE DATABASE "${config.dbName}"`,
            [],
          );

          if (createResult.success) {
            console.log(`Database ${config.dbName} created successfully`);
            return true;
          } else {
            console.error("Error creating database:", createResult.error);
            return false;
          }
        } else {
          console.log(`Database ${config.dbName} already exists`);
          return true;
        }
      } catch (electronError) {
        console.error("Error during Electron API operation:", electronError);
        return false;
      }
    }

    // Simulation for non-Electron environment for testing
    if (!isRunningInElectron()) {
      console.log(`Simulation: Database ${config.dbName} created successfully`);
      return true;
    }

    // Direct implementation with pg (should not be reached in browser)
    const port = parseInt(config.port);
    const { Client } = await import("pg");

    // Connect to PostgreSQL server without specifying a database
    console.log("Connecting to PostgreSQL server");
    const client = new Client({
      host: config.host,
      port: port,
      user: config.username,
      password: config.password || "", // Ensure password is always a string
      database: "postgres", // Connect to system postgres database
      ssl: false,
    });

    await client.connect();

    // Check if database already exists
    console.log(`Checking if database ${config.dbName} exists`);
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [config.dbName],
    );

    // If database doesn't exist, create it
    if (checkResult.rows.length === 0) {
      console.log(`Creating database ${config.dbName}`);
      await client.query(`CREATE DATABASE "${config.dbName}"`); // Added quotes around database name
      console.log(`Database ${config.dbName} created successfully`);
    } else {
      console.log(`Database ${config.dbName} already exists`);
    }

    await client.end();
    return true;
  } catch (error) {
    console.error("Error creating database:", error);
    return false;
  }
}

/**
 * Create a single table in the database
 * @param config Database configuration
 * @param tableName Name of table to create
 * @returns Promise<boolean> true if creation successful, false otherwise
 */
export async function createTable(
  config: {
    host: string;
    port: string;
    username: string;
    password: string;
    dbName: string;
  },
  tableName: string,
): Promise<boolean> {
  console.log(
    `Attempting to create table ${tableName} in database ${config.dbName}`,
  );
  try {
    // Save the database configuration to localStorage to ensure it's available
    try {
      localStorage.setItem(
        "dbConfig",
        JSON.stringify({
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password || "",
          dbName: config.dbName,
        }),
      );

      // Also save to window object for immediate access
      if (typeof window !== "undefined") {
        window.dbConfigTemp = {
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password || "",
          dbName: config.dbName,
        };
      }
    } catch (storageError) {
      console.warn(
        "Could not save database config to localStorage:",
        storageError,
      );
    }

    // Check if we're in Electron
    if (isRunningInElectron()) {
      // Connect to specific database
      console.log(`Connecting to database ${config.dbName}`);
      const connectResult = await electronAPI.connectDatabase({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password || "", // Ensure password is always a string
        dbName: config.dbName,
      });

      if (!connectResult.success) {
        console.error(
          "Error connecting to specific database:",
          connectResult.error,
        );
        return false;
      }

      let query = "";

      // Define query based on table name
      switch (tableName) {
        case "users":
          query = `CREATE TABLE IF NOT EXISTS "users" (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            role VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`;
          break;

        case "patients":
          query = `CREATE TABLE IF NOT EXISTS "patients" (
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
          )`;
          break;

        case "appointments":
          query = `CREATE TABLE IF NOT EXISTS "appointments" (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER NOT NULL,
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
          )`;
          break;

        case "license":
          query = `CREATE TABLE IF NOT EXISTS "license" (
            id SERIAL PRIMARY KEY,
            license_key VARCHAR(100) UNIQUE NOT NULL,
            license_type VARCHAR(20) NOT NULL,
            expiry_date DATE NOT NULL,
            google_calendar_enabled BOOLEAN NOT NULL DEFAULT FALSE,
            whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`;
          break;

        case "configurations":
          query = `CREATE TABLE IF NOT EXISTS "configurations" (
            id SERIAL PRIMARY KEY,
            key VARCHAR(50) UNIQUE NOT NULL,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`;
          break;

        default:
          console.error(`Table ${tableName} not recognized`);
          return false;
      }

      console.log(`Executing query to create table ${tableName}`);
      console.log(query);

      // First, save the database configuration to Electron's storage if the function exists
      try {
        if (typeof electronAPI.saveDbConfig === "function") {
          const saveResult = await electronAPI.saveDbConfig({
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password || "",
            dbName: config.dbName,
          });

          if (!saveResult.success) {
            console.error(
              "Failed to save database configuration to Electron:",
              saveResult.error,
            );
          } else {
            console.log(
              "Database configuration saved to Electron successfully",
            );
          }
        } else {
          console.log(
            "saveDbConfig function not available in this environment, skipping",
          );
        }
      } catch (saveError) {
        console.error(
          "Error saving database configuration to Electron:",
          saveError,
        );
      }

      // Execute query
      try {
        const result = await electronAPI.executeQuery(query, []);

        if (!result.success) {
          console.error(`Error creating table ${tableName}:`, result.error);
          return false;
        }

        console.log(`Table ${tableName} created successfully`);
        return true;
      } catch (queryError) {
        console.error(
          `Error executing query for table ${tableName}:`,
          queryError,
        );
        return false;
      }
    }

    // Simulation for non-Electron environment for testing
    if (!isRunningInElectron()) {
      console.log(`Simulation: Table ${tableName} created successfully`);
      return true;
    }

    // Direct implementation with pg
    const port = parseInt(config.port);
    const { Client } = await import("pg");
    const client = new Client({
      host: config.host,
      port: port,
      user: config.username,
      password: config.password || "", // Ensure password is always a string
      database: config.dbName,
      ssl: false,
    });

    await client.connect();

    let query = "";

    // Define query based on table name
    switch (tableName) {
      case "users":
        query = `CREATE TABLE IF NOT EXISTS "users" (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(100) NOT NULL,
          full_name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          role VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        break;

      case "patients":
        query = `CREATE TABLE IF NOT EXISTS "patients" (
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
        )`;
        break;

      case "appointments":
        query = `CREATE TABLE IF NOT EXISTS "appointments" (
          id SERIAL PRIMARY KEY,
          patient_id INTEGER NOT NULL,
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
        )`;
        break;

      case "license":
        query = `CREATE TABLE IF NOT EXISTS "license" (
          id SERIAL PRIMARY KEY,
          license_key VARCHAR(100) UNIQUE NOT NULL,
          license_type VARCHAR(20) NOT NULL,
          expiry_date DATE NOT NULL,
          google_calendar_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        break;

      case "configurations":
        query = `CREATE TABLE IF NOT EXISTS "configurations" (
          id SERIAL PRIMARY KEY,
          key VARCHAR(50) UNIQUE NOT NULL,
          value TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        break;

      default:
        console.error(`Table ${tableName} not recognized`);
        return false;
    }

    console.log(`Executing query to create table ${tableName}`);
    await client.query(query);
    console.log(`Table ${tableName} created successfully`);
    await client.end();
    return true;
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
    return false;
  }
}

/**
 * Initialize database with necessary tables
 * @returns Promise<boolean> true if initialization successful, false otherwise
 */
export async function initializeDatabase(config: {
  host: string;
  port: string;
  username: string;
  password: string;
  dbName: string;
}): Promise<boolean> {
  try {
    console.log("Starting database initialization");

    // First create database if it doesn't exist
    const dbCreated = await createDatabase({
      ...config,
      password: config.password || "",
    });
    if (!dbCreated) {
      throw new Error("Unable to create database");
    }

    // Create all tables
    const tables = [
      "users",
      "patients",
      "appointments",
      "license",
      "configurations",
    ];
    let allTablesCreated = true;

    for (const table of tables) {
      console.log(`Creating table: ${table}`);
      const tableCreated = await createTable(
        {
          ...config,
          password: config.password || "",
        },
        table,
      );
      if (!tableCreated) {
        console.error(`Error creating table ${table}`);
        allTablesCreated = false;
      }
    }

    if (allTablesCreated) {
      console.log("All tables created successfully");
    } else {
      console.warn("Some tables failed to create");
    }

    return allTablesCreated;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
}

/**
 * Backup database
 * @param path Path to save backup
 * @returns Promise<boolean> true if backup successful, false otherwise
 */
export async function backupDatabase(path: string): Promise<boolean> {
  try {
    console.log(`Starting database backup to ${path}`);

    // Check if we're in Electron
    if (isRunningInElectron()) {
      const result = await electronAPI.backupDatabase(path);
      if (!result.success) {
        throw new Error(result.error || "Error during backup");
      }

      // Save backup information to database
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

        console.log("Backup information saved to database");
      } catch (dbError) {
        console.error("Error saving backup information to database:", dbError);
        // Fallback to localStorage
        localStorage.setItem("lastBackup", now.toISOString());
        localStorage.setItem("lastBackupPath", path);
        localStorage.setItem("lastBackupStatus", "success");
        console.log("Backup information saved to localStorage (fallback)");
      }

      return true;
    }

    // Get database configuration
    let dbConfig;
    try {
      // Try to get from localStorage first
      const dbConfigStr = localStorage.getItem("dbConfig");
      if (dbConfigStr) {
        dbConfig = JSON.parse(dbConfigStr);
        console.log("Database configuration loaded from localStorage");
      } else {
        // If not in localStorage, try to get from database
        const db = Database.getInstance();
        const configResult = await db.query(
          "SELECT value FROM configurations WHERE key = 'db_config'",
        );
        if (configResult.length > 0) {
          dbConfig = JSON.parse(configResult[0].value);
          console.log("Database configuration loaded from database");
        } else {
          // Use the provided config as fallback
          dbConfig = {
            host: "localhost",
            port: "5432",
            username: "postgres",
            password: "",
            dbName: "patient_appointment_system",
          };
          console.log("Using default database configuration");
        }
      }
    } catch (error) {
      console.error("Error loading database configuration:", error);
      // Use the provided config as fallback
      dbConfig = {
        host: "localhost",
        port: "5432",
        username: "postgres",
        password: "",
        dbName: "patient_appointment_system",
      };
      console.log("Using default database configuration after error");
    }

    const { host, port, username, password, dbName } = dbConfig;

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `${dbName}_backup_${timestamp}.sql`;
    const fullBackupPath = `${path}/${backupFileName}`;

    console.log(`Executing database backup to ${fullBackupPath}`);

    // Execute real database backup
    // This code will only work in Electron, but we include it for completeness
    try {
      // pg_dump command
      const { exec } = await import("child_process");
      const util = await import("util");
      const execPromise = util.promisify(exec);

      const command = `pg_dump -h ${host} -p ${port} -U ${username} -F c -b -v -f "${fullBackupPath}" "${dbName}"`;

      // Set PGPASSWORD environment variable to avoid password prompt
      const env = {
        ...process.env,
        PGPASSWORD: password || "",
      }; // Ensure password is always a string

      await execPromise(command, { env });

      console.log(`Backup completed: ${fullBackupPath}`);

      // Save backup information to database
      const now = new Date();

      try {
        const db = Database.getInstance();
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
        console.error("Error saving backup information to database:", dbError);
        // Fallback to localStorage
        localStorage.setItem("lastBackup", now.toISOString());
        localStorage.setItem("lastBackupPath", fullBackupPath);
        localStorage.setItem("lastBackupStatus", "success");
      }

      return true;
    } catch (execError) {
      console.error("Error executing pg_dump:", execError);
      throw execError;
    }
  } catch (error) {
    console.error("Error during database backup:", error);

    // Save failed backup information to database
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
        "Error saving failed backup information to database:",
        dbError,
      );
      // Fallback to localStorage
      const now = new Date();
      localStorage.setItem("lastBackup", now.toISOString());
      localStorage.setItem("lastBackupStatus", "failed");
    }

    return false;
  }
}

/**
 * Restore database from backup
 * @param path Path to backup file
 * @returns Promise<boolean> true if restore successful, false otherwise
 */
export async function restoreDatabase(path: string): Promise<boolean> {
  try {
    console.log(`Starting database restore from ${path}`);

    // Check if we're in Electron
    if (isRunningInElectron()) {
      const result = await electronAPI.restoreDatabase(path);
      if (!result.success) {
        throw new Error(result.error || "Error during restore");
      }

      // Save restore information to localStorage
      const now = new Date();
      localStorage.setItem("lastRestore", now.toISOString());
      localStorage.setItem("lastRestorePath", path);
      localStorage.setItem("lastRestoreStatus", "success");

      return true;
    }

    // In a real desktop application, we would execute pg_restore here
    // But since we're in a browser, we need to handle the uploaded file

    console.log(`Restoring database from ${path}`);

    // Read backup file
    // Note: in a web application, path will actually be a File object
    if (path instanceof File) {
      const file = path;
      const reader = new FileReader();

      // Read file as text
      const backupData = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });

      // Parse JSON
      const backup = JSON.parse(backupData);

      // Verify backup is valid
      if (!backup.metadata || !backup.tables) {
        throw new Error("Invalid backup file");
      }

      // Restore data to tables
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

      // In a real application, we would execute an SQL query to restore the data
      // But since we're in a browser, we've already restored the data to localStorage

      // Save restore information to localStorage
      const now = new Date();
      localStorage.setItem("lastRestore", now.toISOString());
      localStorage.setItem("lastRestorePath", file.name);
      localStorage.setItem("lastRestoreStatus", "success");

      return true;
    } else {
      // If not a File object, it could be a path or previously saved backup
      // Try to load from localStorage
      const backupData = localStorage.getItem("lastBackupData");

      if (!backupData) {
        throw new Error("No backup found in localStorage");
      }

      const backup = JSON.parse(backupData);

      // Verify backup is valid
      if (!backup.metadata || !backup.tables) {
        throw new Error("Invalid backup in localStorage");
      }

      // Restore data to tables
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

      // Save restore information to localStorage
      const now = new Date();
      localStorage.setItem("lastRestore", now.toISOString());
      localStorage.setItem("lastRestorePath", path);
      localStorage.setItem("lastRestoreStatus", "success");

      return true;
    }
  } catch (error) {
    console.error("Error during database restore:", error);

    // Save failed restore information to localStorage
    const now = new Date();
    localStorage.setItem("lastRestore", now.toISOString());
    localStorage.setItem("lastRestoreStatus", "failed");

    return false;
  }
}
