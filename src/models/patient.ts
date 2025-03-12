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
          address, city, postal_code, medical_history, allergies, 
          medications, notes, privacy_consent, marketing_consent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
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

      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;

      values.push(id); // Per la clausola WHERE

      const query = `
        UPDATE patients 
        SET ${updates.join(", ")} 
        WHERE id = $${paramCount - 1} 
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
