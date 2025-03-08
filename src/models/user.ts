import Database from "./database";
// Import mock implementations for browser environment
import * as bcrypt from "@/lib/mockBcrypt";

export interface User {
  id?: number;
  username: string;
  password?: string;
  full_name: string;
  email: string;
  role: "Medico" | "Assistente";
  created_at?: Date;
  updated_at?: Date;
}

export class UserModel {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async create(user: User): Promise<User> {
    try {
      // Hash della password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password || "", salt);

      const result = await this.db.query(
        "INSERT INTO users (username, password, full_name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, full_name, email, role, created_at, updated_at",
        [user.username, hashedPassword, user.full_name, user.email, user.role],
      );

      return result[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const result = await this.db.query(
        "SELECT id, username, password, full_name, email, role, created_at, updated_at FROM users WHERE username = $1",
        [username],
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error finding user by username:", error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.db.query(
        "SELECT id, username, password, full_name, email, role, created_at, updated_at FROM users WHERE email = $1",
        [email],
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  }

  async findById(id: number): Promise<User | null> {
    try {
      const result = await this.db.query(
        "SELECT id, username, full_name, email, role, created_at, updated_at FROM users WHERE id = $1",
        [id],
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error finding user by id:", error);
      throw error;
    }
  }

  async update(id: number, user: Partial<User>): Promise<User | null> {
    try {
      const currentUser = await this.findById(id);
      if (!currentUser) return null;

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // Costruisci la query dinamicamente in base ai campi da aggiornare
      if (user.full_name) {
        updates.push(`full_name = $${paramCount}`);
        values.push(user.full_name);
        paramCount++;
      }

      if (user.email) {
        updates.push(`email = $${paramCount}`);
        values.push(user.email);
        paramCount++;
      }

      if (user.role) {
        updates.push(`role = $${paramCount}`);
        values.push(user.role);
        paramCount++;
      }

      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        updates.push(`password = $${paramCount}`);
        values.push(hashedPassword);
        paramCount++;
      }

      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;

      values.push(id); // Per la clausola WHERE

      const query = `
        UPDATE users 
        SET ${updates.join(", ")} 
        WHERE id = $${paramCount - 1} 
        RETURNING id, username, full_name, email, role, created_at, updated_at
      `;

      const result = await this.db.query(query, values);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.db.query(
        "DELETE FROM users WHERE id = $1 RETURNING id",
        [id],
      );
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  async authenticate(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByUsername(username);
      if (!user || !user.password) return null;

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return null;

      // Non restituire la password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      console.error("Error authenticating user:", error);
      throw error;
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.findByEmail(email);
      if (!user) return false;

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const result = await this.db.query(
        "UPDATE users SET password = $1, updated_at = $2 WHERE email = $3 RETURNING id",
        [hashedPassword, new Date(), email],
      );

      return result.length > 0;
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  }
}
