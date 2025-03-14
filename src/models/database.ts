// Database simulation for browser environment with real PostgreSQL support in Electron
// Provides a unified interface for both environments
import { electronAPI, isRunningInElectron } from "../lib/electronBridge";

// PgPool interface definition to avoid type errors
interface PgPool {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
  connect: () => Promise<any>;
  end: () => Promise<void>;
}

// Don't directly import pg in browser
let pg: any = null;

// In Electron environment, pg will be available through preload
if (isRunningInElectron()) {
  console.log("Electron environment detected, using pg through preload");
} else {
  console.log("Browser environment detected, using DB simulation");
}

// Interfaces for compatibility
interface PoolClient {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
  release: () => void;
}

interface Pool {
  connect: () => Promise<void>;
  end: () => Promise<void>;
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
  getClient: () => Promise<PoolClient>;
}

// Singleton pattern for database connection
class Database {
  private static instance: Database;
  private pool: Pool;
  private pgPool: PgPool | null = null;
  private isConnected: boolean = false;
  private useRealDb: boolean = false;

  private constructor() {
    // Read configuration from localStorage or configuration file
    const dbConfig = this.getDbConfig();
    console.log("Database configuration loaded:", {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      database: dbConfig.dbName,
    });

    // Check if we can use a real DB
    this.useRealDb = isRunningInElectron();

    if (pg && this.useRealDb) {
      try {
        // Attempt to create a real PostgreSQL connection
        this.pgPool = new pg.Pool({
          host: dbConfig.host,
          port: parseInt(dbConfig.port),
          user: dbConfig.username,
          password:
            typeof dbConfig.password === "string" ? dbConfig.password : "", // Ensure password is always a string
          database: dbConfig.dbName,
          ssl: false,
          // 5 second connection timeout
          connectionTimeoutMillis: 5000,
        });
        console.log("Real PostgreSQL connection configured");
      } catch (error) {
        console.error("Error configuring PostgreSQL:", error);
        console.log("Falling back to simulated database");
        this.useRealDb = false;
      }
    } else {
      console.log("Using simulated database (browser environment)");
    }

    // Pool implementation that decides whether to use real PostgreSQL or simulation
    this.pool = {
      connect: async () => {
        if (this.useRealDb && this.pgPool) {
          try {
            // Test connection
            const result = await this.pgPool.query("SELECT NOW()");
            console.log("PostgreSQL connection established:", result.rows[0]);
          } catch (error) {
            console.error("PostgreSQL connection error:", error);
            this.useRealDb = false;
            console.log("Falling back to simulated database");
          }
        } else if (isRunningInElectron()) {
          // If in Electron but couldn't use pg directly
          try {
            const result = await electronAPI.connectDatabase({
              host: dbConfig.host,
              port: dbConfig.port,
              username: dbConfig.username,
              password:
                typeof dbConfig.password === "string" ? dbConfig.password : "", // Ensure password is always a string
              dbName: dbConfig.dbName,
            });
            if (result.success) {
              console.log(
                "PostgreSQL connection established through Electron API",
              );
              this.useRealDb = true;
            } else {
              console.error(
                "PostgreSQL connection error through Electron API:",
                result.error,
              );
              this.useRealDb = false;
              console.log("Falling back to simulated database");
            }
          } catch (error) {
            console.error(
              "PostgreSQL connection error through Electron API:",
              error,
            );
            this.useRealDb = false;
            console.log("Falling back to simulated database");
          }
        } else {
          console.log("Simulating database connection");
        }
        return Promise.resolve();
      },
      end: async () => {
        if (this.useRealDb && this.pgPool) {
          await this.pgPool.end();
          console.log("PostgreSQL connection closed");
        } else {
          console.log("Simulating database connection closure");
        }
        return Promise.resolve();
      },
      query: async (text: string, params: any[] = []) => {
        console.log(`Executing query: ${text.substring(0, 100)}...`);
        console.log(`With parameters: ${JSON.stringify(params)}`);

        if (this.useRealDb) {
          if (this.pgPool) {
            try {
              const result = await this.pgPool.query(text, params);
              console.log(
                `Query successful, returned ${result.rows.length} rows`,
              );
              return result;
            } catch (error) {
              console.error("PostgreSQL query execution error:", error);
              console.error("Query:", text, "Params:", params);
              // Fallback to simulation on error
              return this.simulateQuery(text, params);
            }
          } else if (isRunningInElectron()) {
            try {
              const result = await electronAPI.executeQuery(text, params);
              if (result.success) {
                console.log(
                  `Query successful through Electron API, returned ${result.rows?.length || 0} rows`,
                );
                return { rows: result.rows || [] };
              } else {
                console.error(
                  "Query execution error through Electron API:",
                  result.error,
                );
                // Fallback to simulation on error
                return this.simulateQuery(text, params);
              }
            } catch (error) {
              console.error(
                "Query execution error through Electron API:",
                error,
              );
              // Fallback to simulation on error
              return this.simulateQuery(text, params);
            }
          }
        }

        // Use simulation if we can't use a real DB
        return this.simulateQuery(text, params);
      },
      getClient: async () => {
        if (this.useRealDb && this.pgPool) {
          try {
            const client = await this.pgPool.connect();
            return {
              query: async (text: string, params: any[] = []) => {
                const result = await client.query(text, params);
                return result;
              },
              release: () => client.release(),
            };
          } catch (error) {
            console.error("Error getting PostgreSQL client:", error);
            // Fallback to simulation
            return this.getSimulatedClient();
          }
        } else {
          return this.getSimulatedClient();
        }
      },
    };
  }

  // Methods for database simulation
  private storage: Record<string, any[]> = {
    users: [],
    patients: [],
    appointments: [],
    license: [],
    configurations: [],
    notifications: [],
    medical_records: [],
  };

  private simulateQuery(
    text: string,
    params: any[] = [],
  ): Promise<{ rows: any[] }> {
    console.log("Simulating query:", text, params);

    // Load data from localStorage if available
    this.loadStorageFromLocalStorage();

    // Simple query parsing to simulate database operations
    if (text.toLowerCase().includes("select")) {
      const table = this.extractTableName(text);
      return Promise.resolve({ rows: this.storage[table] || [] });
    } else if (text.toLowerCase().includes("insert")) {
      const table = this.extractTableName(text);
      const newItem = { id: Date.now(), ...this.createMockItem(params) };
      this.storage[table] = [...(this.storage[table] || []), newItem];

      // Save to localStorage
      this.saveStorageToLocalStorage();

      return Promise.resolve({ rows: [newItem] });
    } else if (text.toLowerCase().includes("update")) {
      const table = this.extractTableName(text);
      // Simplified update logic
      this.saveStorageToLocalStorage();
      return Promise.resolve({ rows: this.storage[table] || [] });
    } else if (text.toLowerCase().includes("delete")) {
      const table = this.extractTableName(text);
      // Simplified delete logic
      this.saveStorageToLocalStorage();
      return Promise.resolve({ rows: [] });
    }

    return Promise.resolve({ rows: [] });
  }

  private getSimulatedClient(): PoolClient {
    return {
      query: async (text: string, params: any[] = []) =>
        this.simulateQuery(text, params),
      release: () => {},
    };
  }

  private extractTableName(query: string): string {
    // Very simplified table name extraction
    const tables = [
      "users",
      "patients",
      "appointments",
      "license",
      "configurations",
      "notifications",
      "medical_records",
    ];
    for (const table of tables) {
      if (query.toLowerCase().includes(table)) {
        return table;
      }
    }
    return "unknown";
  }

  private createMockItem(params: any[]): any {
    // Create a mock item with the parameters
    const mockItem: Record<string, any> = {};
    params.forEach((param, index) => {
      mockItem[`field${index}`] = param;
    });
    return mockItem;
  }

  private loadStorageFromLocalStorage(): void {
    try {
      const storedData = localStorage.getItem("simulatedDatabase");
      if (storedData) {
        this.storage = JSON.parse(storedData);
      }
    } catch (error) {
      console.error("Error loading simulated database:", error);
    }
  }

  private saveStorageToLocalStorage(): void {
    try {
      localStorage.setItem("simulatedDatabase", JSON.stringify(this.storage));
    } catch (error) {
      console.error("Error saving simulated database:", error);
    }
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private getDbConfig() {
    try {
      // First check if we have a temporary config in the window object
      if (typeof window !== "undefined" && window.dbConfigTemp) {
        console.log("Using database configuration from window object:", {
          host: window.dbConfigTemp.host,
          port: window.dbConfigTemp.port,
          username: window.dbConfigTemp.username,
          dbName: window.dbConfigTemp.dbName,
        });
        return window.dbConfigTemp;
      }

      // Then check localStorage
      if (typeof localStorage !== "undefined") {
        const storedConfig = localStorage.getItem("dbConfig");
        if (storedConfig) {
          try {
            const config = JSON.parse(storedConfig);
            console.log("Using database configuration from localStorage:", {
              host: config.host,
              port: config.port,
              username: config.username,
              dbName: config.dbName,
            });
            return config;
          } catch (error) {
            console.error(
              "Error parsing stored database configuration:",
              error,
            );
          }
        } else {
          // Check for mock config in non-Electron environment
          const mockConfig = localStorage.getItem("mockDbConfig");
          if (mockConfig) {
            try {
              const config = JSON.parse(mockConfig);
              console.log(
                "Using mock database configuration from localStorage:",
                {
                  host: config.host,
                  port: config.port,
                  username: config.username,
                  dbName: config.dbName,
                },
              );
              return config;
            } catch (error) {
              console.error(
                "Error parsing mock database configuration:",
                error,
              );
            }
          } else {
            console.warn(
              "No database configuration found in localStorage, using defaults",
            );
          }
        }
      }
    } catch (error) {
      console.error("Error accessing window or localStorage:", error);
    }

    // Default values
    const defaultConfig = {
      host: "localhost",
      port: "5432",
      username: "postgres",
      password: "", // Empty default password for security
      dbName: "patient_appointment_system",
    };

    // Save default config to localStorage if no config exists
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("dbConfig", JSON.stringify(defaultConfig));
        console.log("Saved default database configuration to localStorage");
      } catch (error) {
        console.error(
          "Error saving default database configuration to localStorage:",
          error,
        );
      }
    }

    return defaultConfig;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.pool.connect();
        this.isConnected = true;
        console.log("Connected to database");
      } catch (error) {
        console.error("Error connecting to database:", error);
        throw error;
      }
    }
  }

  public async query(text: string, params: any[] = []): Promise<any> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const result = await this.pool.query(text, params);
      return result.rows;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    if (!this.isConnected) {
      await this.connect();
    }

    return await this.pool.getClient();
  }

  public async close(): Promise<void> {
    if (this.isConnected) {
      await this.pool.end();
      this.isConnected = false;
      console.log("Database connection closed");
    }
  }

  // Method to initialize database with necessary tables
  public async initializeDatabase(): Promise<void> {
    try {
      // Get database configuration
      const dbConfig = this.getDbConfig();
      const port = parseInt(dbConfig.port);

      // Use pg directly to create tables
      if (pg) {
        const client = new pg.Client({
          host: dbConfig.host,
          port: port,
          user: dbConfig.username,
          password:
            typeof dbConfig.password === "string" ? dbConfig.password : "", // Ensure password is always a string
          database: dbConfig.dbName,
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

          // Medical Records table
          await client.query(`
            CREATE TABLE IF NOT EXISTS "medical_records" (
              id SERIAL PRIMARY KEY,
              patient_id INTEGER NOT NULL REFERENCES "patients"(id) ON DELETE CASCADE,
              record_date DATE NOT NULL,
              diagnosis TEXT,
              treatment TEXT,
              notes TEXT,
              attachments TEXT[],
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          await client.query("COMMIT");
          console.log("Database initialized successfully");
        } catch (error) {
          await client.query("ROLLBACK");
          console.error("Error initializing database:", error);
          throw error;
        } finally {
          await client.end();
        }
      } else if (isRunningInElectron()) {
        // If in Electron but couldn't use pg directly
        // Create users table
        let result = await electronAPI.executeQuery(
          `CREATE TABLE IF NOT EXISTS "users" (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            role VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          [],
        );

        if (!result.success) {
          throw new Error(result.error || "Error initializing users table");
        }

        // Create patients table
        result = await electronAPI.executeQuery(
          `CREATE TABLE IF NOT EXISTS "patients" (
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
          )`,
          [],
        );

        if (!result.success) {
          throw new Error(result.error || "Error initializing patients table");
        }

        // Create appointments table
        result = await electronAPI.executeQuery(
          `CREATE TABLE IF NOT EXISTS "appointments" (
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
          )`,
          [],
        );

        if (!result.success) {
          throw new Error(
            result.error || "Error initializing appointments table",
          );
        }

        // Create license table
        result = await electronAPI.executeQuery(
          `CREATE TABLE IF NOT EXISTS "license" (
            id SERIAL PRIMARY KEY,
            license_key VARCHAR(100) UNIQUE NOT NULL,
            license_type VARCHAR(20) NOT NULL,
            expiry_date DATE NOT NULL,
            google_calendar_enabled BOOLEAN NOT NULL DEFAULT FALSE,
            whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          [],
        );

        if (!result.success) {
          throw new Error(result.error || "Error initializing license table");
        }

        // Create configurations table
        result = await electronAPI.executeQuery(
          `CREATE TABLE IF NOT EXISTS "configurations" (
            id SERIAL PRIMARY KEY,
            key VARCHAR(50) UNIQUE NOT NULL,
            value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          [],
        );

        if (!result.success) {
          throw new Error(
            result.error || "Error initializing configurations table",
          );
        }

        // Create notifications table
        result = await electronAPI.executeQuery(
          `CREATE TABLE IF NOT EXISTS "notifications" (
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
          )`,
          [],
        );

        if (!result.success) {
          throw new Error(
            result.error || "Error initializing notifications table",
          );
        }

        // Create medical_records table
        result = await electronAPI.executeQuery(
          `CREATE TABLE IF NOT EXISTS "medical_records" (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER NOT NULL REFERENCES "patients"(id) ON DELETE CASCADE,
            record_date DATE NOT NULL,
            diagnosis TEXT,
            treatment TEXT,
            notes TEXT,
            attachments TEXT[],
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          [],
        );

        if (!result.success) {
          throw new Error(
            result.error || "Error initializing medical_records table",
          );
        }

        console.log("Database initialized successfully via Electron API");
      } else {
        // Fallback to simulated client
        const client = await this.getClient();

        try {
          await client.query("BEGIN");

          // Create all tables in simulation mode
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

          await client.query(`
            CREATE TABLE IF NOT EXISTS "configurations" (
              id SERIAL PRIMARY KEY,
              key VARCHAR(50) UNIQUE NOT NULL,
              value TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

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

          await client.query(`
            CREATE TABLE IF NOT EXISTS "medical_records" (
              id SERIAL PRIMARY KEY,
              patient_id INTEGER NOT NULL REFERENCES "patients"(id) ON DELETE CASCADE,
              record_date DATE NOT NULL,
              diagnosis TEXT,
              treatment TEXT,
              notes TEXT,
              attachments TEXT[],
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          console.log("Database initialized successfully (simulated)");
        } catch (error) {
          console.error("Error initializing database (simulated):", error);
          throw error;
        } finally {
          if (client && typeof client.release === "function") {
            client.release();
          }
        }
      }
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }
}

export default Database;
