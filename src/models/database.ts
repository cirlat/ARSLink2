// Import mock implementations for browser environment
import { Pool, PoolClient } from "@/lib/mockDatabase";

// Singleton pattern per la connessione al database
class Database {
  private static instance: Database;
  private pool: Pool;
  private isConnected: boolean = false;

  private constructor() {
    // Leggi le configurazioni da localStorage o da un file di configurazione
    const dbConfig = this.getDbConfig();

    // Use mock Pool implementation that doesn't require process.env
    this.pool = new Pool();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private getDbConfig() {
    // In un'implementazione reale, questo leggerebbe da un file di configurazione
    // o da localStorage se configurato tramite wizard
    const storedConfig = localStorage.getItem("dbConfig");
    if (storedConfig) {
      return JSON.parse(storedConfig);
    }

    // Valori di default
    return {
      host: "localhost",
      port: "5432",
      username: "postgres",
      password: "postgres",
      dbName: "patient_appointment_system",
    };
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

    return await this.pool.connect();
  }

  public async close(): Promise<void> {
    if (this.isConnected) {
      await this.pool.end();
      this.isConnected = false;
      console.log("Database connection closed");
    }
  }

  // Metodo per inizializzare il database con le tabelle necessarie
  public async initializeDatabase(): Promise<void> {
    try {
      const client = await this.getClient();

      try {
        await client.query("BEGIN");

        // Tabella utenti
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

        // Tabella pazienti
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

        // Tabella appuntamenti
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

        // Tabella licenza
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

        // Tabella configurazioni
        await client.query(`
          CREATE TABLE IF NOT EXISTS configurations (
            id SERIAL PRIMARY KEY,
            key VARCHAR(50) UNIQUE NOT NULL,
            value TEXT NOT NULL,
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
        client.release();
      }
    } catch (error) {
      console.error("Error getting client for database initialization:", error);
      throw error;
    }
  }
}

export default Database;
