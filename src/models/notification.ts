import Database from "./database";
import { electronAPI, isRunningInElectron } from "../lib/electronBridge";

export interface Notification {
  id?: number;
  patient_id: number;
  patient_name: string;
  appointment_id?: number | null;
  appointment_date?: Date | null;
  appointment_time?: string | null;
  message: string;
  status: "sent" | "failed" | "pending";
  type: "confirmation" | "reminder" | "custom";
  sent_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export class NotificationModel {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
    this.ensureTableExists();
  }

  private async ensureTableExists(): Promise<void> {
    try {
      if (isRunningInElectron()) {
        // Use Electron API to ensure the table exists
        await electronAPI.executeQuery("ensure-notifications-table", []);
      } else {
        // In browser environment, create the table using the Database instance
        await this.db.query(`
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
        `);
      }
      console.log("Ensured notifications table exists");
    } catch (error) {
      console.error("Error ensuring notifications table exists:", error);
    }
  }

  async create(notification: Notification): Promise<Notification> {
    try {
      const result = await this.db.query(
        `INSERT INTO notifications (
          patient_id, patient_name, appointment_id, appointment_date, appointment_time,
          message, status, type, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
        [
          notification.patient_id,
          notification.patient_name,
          notification.appointment_id || null,
          notification.appointment_date || null,
          notification.appointment_time || null,
          notification.message,
          notification.status,
          notification.type,
          notification.sent_at || null,
        ],
      );

      return result[0];
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async findById(id: number): Promise<Notification | null> {
    try {
      const result = await this.db.query(
        "SELECT * FROM notifications WHERE id = $1",
        [id],
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error finding notification by id:", error);
      throw error;
    }
  }

  async findByPatientId(patientId: number): Promise<Notification[]> {
    try {
      return await this.db.query(
        "SELECT * FROM notifications WHERE patient_id = $1 ORDER BY created_at DESC",
        [patientId],
      );
    } catch (error) {
      console.error("Error finding notifications by patient id:", error);
      throw error;
    }
  }

  async findAll(
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const notifications = await this.db.query(
        "SELECT * FROM notifications ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        [limit, offset],
      );

      const countResult = await this.db.query(
        "SELECT COUNT(*) as total FROM notifications",
        [],
      );
      const total = parseInt(countResult[0]?.total || "0");

      return { notifications, total };
    } catch (error) {
      console.error("Error finding all notifications:", error);
      throw error;
    }
  }

  async findByStatus(
    status: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const notifications = await this.db.query(
        "SELECT * FROM notifications WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        [status, limit, offset],
      );

      const countResult = await this.db.query(
        "SELECT COUNT(*) as total FROM notifications WHERE status = $1",
        [status],
      );
      const total = parseInt(countResult[0]?.total || "0");

      return { notifications, total };
    } catch (error) {
      console.error("Error finding notifications by status:", error);
      throw error;
    }
  }

  async findByType(
    type: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const notifications = await this.db.query(
        "SELECT * FROM notifications WHERE type = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        [type, limit, offset],
      );

      const countResult = await this.db.query(
        "SELECT COUNT(*) as total FROM notifications WHERE type = $1",
        [type],
      );
      const total = parseInt(countResult[0]?.total || "0");

      return { notifications, total };
    } catch (error) {
      console.error("Error finding notifications by type:", error);
      throw error;
    }
  }

  async update(
    id: number,
    notification: Partial<Notification>,
  ): Promise<Notification | null> {
    try {
      const currentNotification = await this.findById(id);
      if (!currentNotification) return null;

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // Build the query dynamically based on the fields to update
      const fields: (keyof Notification)[] = [
        "patient_id",
        "patient_name",
        "appointment_id",
        "appointment_date",
        "appointment_time",
        "message",
        "status",
        "type",
        "sent_at",
      ];

      fields.forEach((field) => {
        if (notification[field] !== undefined) {
          updates.push(`${field} = $${paramCount}`);
          values.push(notification[field]);
          paramCount++;
        }
      });

      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;

      values.push(id); // For the WHERE clause

      const query = `
        UPDATE notifications 
        SET ${updates.join(", ")} 
        WHERE id = $${paramCount - 1} 
        RETURNING *
      `;

      const result = await this.db.query(query, values);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating notification:", error);
      throw error;
    }
  }

  async updateStatus(
    id: number,
    status: string,
    sentAt?: Date,
  ): Promise<Notification | null> {
    try {
      const result = await this.db.query(
        "UPDATE notifications SET status = $1, sent_at = $2, updated_at = $3 WHERE id = $4 RETURNING *",
        [status, sentAt || null, new Date(), id],
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating notification status:", error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.db.query(
        "DELETE FROM notifications WHERE id = $1 RETURNING id",
        [id],
      );
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  async deleteByPatientId(patientId: number): Promise<number> {
    try {
      const result = await this.db.query(
        "DELETE FROM notifications WHERE patient_id = $1 RETURNING id",
        [patientId],
      );
      return result.length;
    } catch (error) {
      console.error("Error deleting notifications by patient id:", error);
      throw error;
    }
  }
}
