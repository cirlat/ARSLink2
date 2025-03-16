import Database from "./database";

export interface Patient {
  id?: number;
  name: string;
  codice_fiscale: string;
  date_of_birth: Date;
  gender: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  birth_place?: string;
  postal_code?: string;
  medical_history?: string;
  allergies?: string;
  medications?: string;
  notes?: string;
  privacy_consent: boolean;
  marketing_consent?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class PatientModel {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
    this.ensureTableExists();
  }

  private async ensureTableExists(): Promise<void> {
    try {
      // Ensure the patients table has all the required columns
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS patients (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          codice_fiscale VARCHAR(16) NOT NULL,
          date_of_birth DATE NOT NULL,
          gender VARCHAR(10) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20) NOT NULL,
          address TEXT,
          city VARCHAR(100),
          birth_place VARCHAR(100),
          postal_code VARCHAR(10),
          medical_history TEXT,
          allergies TEXT,
          medications TEXT,
          notes TEXT,
          privacy_consent BOOLEAN NOT NULL DEFAULT TRUE,
          marketing_consent BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check if medical_history column exists, if not add it
      const checkMedicalHistoryColumn = await this.db.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'medical_history'",
      );

      if (checkMedicalHistoryColumn.length === 0) {
        await this.db.query(
          "ALTER TABLE patients ADD COLUMN medical_history TEXT",
        );
      }

      // Check if allergies column exists, if not add it
      const checkAllergiesColumn = await this.db.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'allergies'",
      );

      if (checkAllergiesColumn.length === 0) {
        await this.db.query("ALTER TABLE patients ADD COLUMN allergies TEXT");
      }

      // Check if medications column exists, if not add it
      const checkMedicationsColumn = await this.db.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'medications'",
      );

      if (checkMedicationsColumn.length === 0) {
        await this.db.query("ALTER TABLE patients ADD COLUMN medications TEXT");
      }

      // Check if birth_place column exists, if not add it
      const checkBirthPlaceColumn = await this.db.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'birth_place'",
      );

      if (checkBirthPlaceColumn.length === 0) {
        await this.db.query(
          "ALTER TABLE patients ADD COLUMN birth_place VARCHAR(100)",
        );
      }

      console.log("Ensured patients table exists with all required columns");
    } catch (error) {
      console.error("Error ensuring patients table exists:", error);
    }
  }

  async create(patient: Patient): Promise<Patient> {
    try {
      // Verifica che i campi obbligatori siano presenti
      if (
        !patient.name ||
        !patient.codice_fiscale ||
        !patient.date_of_birth ||
        !patient.gender ||
        !patient.phone
      ) {
        throw new Error("Campi obbligatori mancanti");
      }

      const result = await this.db.query(
        `INSERT INTO patients (
          name, codice_fiscale, date_of_birth, gender, email, phone, 
          address, city, birth_place, postal_code, medical_history, allergies, 
          medications, notes, privacy_consent, marketing_consent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
        RETURNING *`,
        [
          patient.name,
          patient.codice_fiscale,
          patient.date_of_birth,
          patient.gender,
          patient.email || null,
          patient.phone,
          patient.address || null,
          patient.city || null,
          patient.birth_place || null,
          patient.postal_code || null,
          patient.medical_history || null,
          patient.allergies || null,
          patient.medications || null,
          patient.notes || null,
          patient.privacy_consent,
          patient.marketing_consent || false,
        ],
      );

      console.log(`Paziente ${result[0].id} creato nel database`);
      return result[0];
    } catch (error) {
      console.error("Error creating patient:", error);
      throw error;
    }
  }

  async findById(id: number): Promise<Patient | null> {
    try {
      const result = await this.db.query(
        "SELECT * FROM patients WHERE id = $1",
        [id],
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error finding patient by id:", error);
      throw error;
    }
  }

  async findByCodiceFiscale(codiceFiscale: string): Promise<Patient | null> {
    try {
      const result = await this.db.query(
        "SELECT * FROM patients WHERE codice_fiscale = $1",
        [codiceFiscale],
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error finding patient by codice fiscale:", error);
      throw error;
    }
  }

  async findAll(
    searchTerm: string = "",
    page: number = 1,
    limit: number = 10,
  ): Promise<{ patients: Patient[]; total: number }> {
    try {
      let query = "SELECT * FROM patients";
      const params: any[] = [];
      let countQuery = "SELECT COUNT(*) FROM patients";

      if (searchTerm) {
        query += ` WHERE 
          name ILIKE $1 OR 
          codice_fiscale ILIKE $1 OR 
          email ILIKE $1 OR 
          phone ILIKE $1`;
        countQuery += ` WHERE 
          name ILIKE $1 OR 
          codice_fiscale ILIKE $1 OR 
          email ILIKE $1 OR 
          phone ILIKE $1`;
        params.push(`%${searchTerm}%`);
      }

      query += " ORDER BY name ASC";

      // Paginazione
      const offset = (page - 1) * limit;
      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const patients = await this.db.query(query, params);
      const countResult = await this.db.query(
        countQuery,
        searchTerm ? [`%${searchTerm}%`] : [],
      );
      const total = parseInt(countResult[0].count);

      return { patients, total };
    } catch (error) {
      console.error("Error finding patients:", error);
      throw error;
    }
  }

  async update(id: number, patient: Partial<Patient>): Promise<Patient | null> {
    try {
      const currentPatient = await this.findById(id);
      if (!currentPatient) return null;

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // Costruisci la query dinamicamente in base ai campi da aggiornare
      const fields: (keyof Patient)[] = [
        "name",
        "codice_fiscale",
        "date_of_birth",
        "gender",
        "email",
        "phone",
        "address",
        "city",
        "birth_place",
        "postal_code",
        "medical_history",
        "allergies",
        "medications",
        "notes",
        "privacy_consent",
        "marketing_consent",
      ];

      fields.forEach((field) => {
        if (patient[field] !== undefined) {
          updates.push(`${field} = $${paramCount}`);
          values.push(patient[field]);
          paramCount++;
        }
      });

      // Use CURRENT_TIMESTAMP for updated_at instead of passing a value
      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(id); // Per la clausola WHERE

      const query = `
        UPDATE patients 
        SET ${updates.join(", ")} 
        WHERE id = $${paramCount} 
        RETURNING *
      `;

      const result = await this.db.query(query, values);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating patient:", error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.db.query(
        "DELETE FROM patients WHERE id = $1 RETURNING id",
        [id],
      );
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting patient:", error);
      throw error;
    }
  }
}
