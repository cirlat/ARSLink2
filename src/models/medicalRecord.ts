import Database from "./database";
import { electronAPI, isRunningInElectron } from "../lib/electronBridge";

export interface MedicalRecord {
  id?: number;
  patient_id: number;
  title: string;
  date: Date;
  doctor: string;
  description: string;
  files?: string[];
  created_at?: Date;
  updated_at?: Date;
}

export class MedicalRecordModel {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
    this.ensureTableExists();
  }

  private async ensureTableExists(): Promise<void> {
    try {
      if (isRunningInElectron()) {
        try {
          // Check if electronAPI.ensureMedicalRecordsTable is available
          if (typeof electronAPI.ensureMedicalRecordsTable === "function") {
            // Use Electron API to ensure the table exists
            await electronAPI.ensureMedicalRecordsTable();
          } else {
            // Fallback to direct query if the API is not available
            console.log(
              "ensureMedicalRecordsTable not available, using direct query",
            );
            await this.db.query(`
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
            `);
          }
        } catch (error) {
          console.error(
            "Error with Electron API, falling back to direct query:",
            error,
          );
          // Fallback to direct query on error
          await this.db.query(`
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
          `);
        }
      } else {
        // In browser environment, create the table using the Database instance
        await this.db.query(`
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
        `);
      }
      console.log("Ensured medical_records table exists");
    } catch (error) {
      console.error("Error ensuring medical_records table exists:", error);
    }
  }

  async create(record: MedicalRecord): Promise<MedicalRecord> {
    try {
      const result = await this.db.query(
        `INSERT INTO medical_records (
          patient_id, title, date, doctor, description, files
        ) VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        [
          record.patient_id,
          record.title,
          record.date,
          record.doctor,
          record.description,
          record.files ? JSON.stringify(record.files) : null,
        ],
      );

      return result[0];
    } catch (error) {
      console.error("Error creating medical record:", error);
      throw error;
    }
  }

  async findById(id: number): Promise<MedicalRecord | null> {
    try {
      const result = await this.db.query(
        "SELECT * FROM medical_records WHERE id = $1",
        [id],
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error finding medical record by id:", error);
      throw error;
    }
  }

  async findByPatientId(patientId: number): Promise<MedicalRecord[]> {
    try {
      return await this.db.query(
        "SELECT * FROM medical_records WHERE patient_id = $1 ORDER BY date DESC",
        [patientId],
      );
    } catch (error) {
      console.error("Error finding medical records by patient id:", error);
      throw error;
    }
  }

  async update(
    id: number,
    record: Partial<MedicalRecord>,
  ): Promise<MedicalRecord | null> {
    try {
      const currentRecord = await this.findById(id);
      if (!currentRecord) return null;

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // Build the query dynamically based on the fields to update
      const fields: (keyof MedicalRecord)[] = [
        "patient_id",
        "title",
        "date",
        "doctor",
        "description",
        "files",
      ];

      fields.forEach((field) => {
        if (record[field] !== undefined) {
          updates.push(`${field} = $${paramCount}`);
          if (field === "files" && record.files) {
            values.push(JSON.stringify(record.files));
          } else {
            values.push(record[field]);
          }
          paramCount++;
        }
      });

      // Add updated_at timestamp
      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;

      values.push(id); // For the WHERE clause

      const query = `
        UPDATE medical_records 
        SET ${updates.join(", ")} 
        WHERE id = $${paramCount} 
        RETURNING *
      `;

      const result = await this.db.query(query, values);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating medical record:", error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.db.query(
        "DELETE FROM medical_records WHERE id = $1 RETURNING id",
        [id],
      );
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting medical record:", error);
      throw error;
    }
  }

  async deleteByPatientId(patientId: number): Promise<number> {
    try {
      const result = await this.db.query(
        "DELETE FROM medical_records WHERE patient_id = $1 RETURNING id",
        [patientId],
      );
      return result.length;
    } catch (error) {
      console.error("Error deleting medical records by patient id:", error);
      throw error;
    }
  }
}
