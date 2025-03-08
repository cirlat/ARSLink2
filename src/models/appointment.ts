import Database from "./database";

export interface Appointment {
  id?: number;
  patient_id: number;
  date: Date;
  time: string;
  duration: number;
  appointment_type: string;
  notes?: string;
  google_calendar_synced?: boolean;
  google_event_id?: string;
  whatsapp_notification_sent?: boolean;
  whatsapp_notification_time?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class AppointmentModel {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async create(appointment: Appointment): Promise<Appointment> {
    try {
      const result = await this.db.query(
        `INSERT INTO appointments (
          patient_id, date, time, duration, appointment_type, notes,
          google_calendar_synced, google_event_id, whatsapp_notification_sent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
        [
          appointment.patient_id,
          appointment.date,
          appointment.time,
          appointment.duration,
          appointment.appointment_type,
          appointment.notes || null,
          appointment.google_calendar_synced || false,
          appointment.google_event_id || null,
          appointment.whatsapp_notification_sent || false,
        ],
      );

      return result[0];
    } catch (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }
  }

  async findById(id: number): Promise<Appointment | null> {
    try {
      const result = await this.db.query(
        "SELECT * FROM appointments WHERE id = $1",
        [id],
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error finding appointment by id:", error);
      throw error;
    }
  }

  async findByPatientId(patientId: number): Promise<Appointment[]> {
    try {
      return await this.db.query(
        "SELECT * FROM appointments WHERE patient_id = $1 ORDER BY date DESC, time DESC",
        [patientId],
      );
    } catch (error) {
      console.error("Error finding appointments by patient id:", error);
      throw error;
    }
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]> {
    try {
      return await this.db.query(
        "SELECT a.*, p.name as patient_name FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.date BETWEEN $1 AND $2 ORDER BY a.date, a.time",
        [startDate, endDate],
      );
    } catch (error) {
      console.error("Error finding appointments by date range:", error);
      throw error;
    }
  }

  async findByDate(date: Date): Promise<Appointment[]> {
    try {
      return await this.db.query(
        "SELECT a.*, p.name as patient_name FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.date = $1 ORDER BY a.time",
        [date],
      );
    } catch (error) {
      console.error("Error finding appointments by date:", error);
      throw error;
    }
  }

  async findUpcoming(limit: number = 10): Promise<Appointment[]> {
    try {
      const today = new Date();
      return await this.db.query(
        "SELECT a.*, p.name as patient_name FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.date >= $1 ORDER BY a.date, a.time LIMIT $2",
        [today, limit],
      );
    } catch (error) {
      console.error("Error finding upcoming appointments:", error);
      throw error;
    }
  }

  async update(
    id: number,
    appointment: Partial<Appointment>,
  ): Promise<Appointment | null> {
    try {
      const currentAppointment = await this.findById(id);
      if (!currentAppointment) return null;

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // Costruisci la query dinamicamente in base ai campi da aggiornare
      const fields: (keyof Appointment)[] = [
        "patient_id",
        "date",
        "time",
        "duration",
        "appointment_type",
        "notes",
        "google_calendar_synced",
        "google_event_id",
        "whatsapp_notification_sent",
        "whatsapp_notification_time",
      ];

      fields.forEach((field) => {
        if (appointment[field] !== undefined) {
          updates.push(`${field} = $${paramCount}`);
          values.push(appointment[field]);
          paramCount++;
        }
      });

      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;

      values.push(id); // Per la clausola WHERE

      const query = `
        UPDATE appointments 
        SET ${updates.join(", ")} 
        WHERE id = $${paramCount - 1} 
        RETURNING *
      `;

      const result = await this.db.query(query, values);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating appointment:", error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.db.query(
        "DELETE FROM appointments WHERE id = $1 RETURNING id",
        [id],
      );
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting appointment:", error);
      throw error;
    }
  }

  async updateGoogleCalendarSync(
    id: number,
    synced: boolean,
    eventId?: string,
  ): Promise<Appointment | null> {
    try {
      const result = await this.db.query(
        "UPDATE appointments SET google_calendar_synced = $1, google_event_id = $2, updated_at = $3 WHERE id = $4 RETURNING *",
        [synced, eventId || null, new Date(), id],
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating Google Calendar sync status:", error);
      throw error;
    }
  }

  async updateWhatsAppNotification(
    id: number,
    sent: boolean,
  ): Promise<Appointment | null> {
    try {
      const result = await this.db.query(
        "UPDATE appointments SET whatsapp_notification_sent = $1, whatsapp_notification_time = $2, updated_at = $3 WHERE id = $4 RETURNING *",
        [sent, sent ? new Date() : null, new Date(), id],
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating WhatsApp notification status:", error);
      throw error;
    }
  }

  async findPendingNotifications(): Promise<Appointment[]> {
    try {
      const today = new Date();
      // Trova appuntamenti per i prossimi 2 giorni che non hanno ancora ricevuto notifica
      const twoDaysFromNow = new Date(today);
      twoDaysFromNow.setDate(today.getDate() + 2);

      return await this.db.query(
        `SELECT a.*, p.name as patient_name, p.phone 
         FROM appointments a 
         JOIN patients p ON a.patient_id = p.id 
         WHERE a.date BETWEEN $1 AND $2 
         AND a.whatsapp_notification_sent = false 
         ORDER BY a.date, a.time`,
        [today, twoDaysFromNow],
      );
    } catch (error) {
      console.error("Error finding pending notifications:", error);
      throw error;
    }
  }
}
