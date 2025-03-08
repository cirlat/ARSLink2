import { UserModel, User } from "../models/user";
import { LicenseModel } from "../models/license";

export class AuthService {
  private userModel: UserModel;
  private licenseModel: LicenseModel;
  private static instance: AuthService;

  private constructor() {
    this.userModel = new UserModel();
    this.licenseModel = LicenseModel.getInstance();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ user: User | null; token: string | null; error?: string }> {
    try {
      // Verifica se la licenza è valida
      const isLicenseValid = await this.licenseModel.isLicenseValid();
      if (!isLicenseValid) {
        return {
          user: null,
          token: null,
          error: "La licenza è scaduta. Contattare l'amministratore.",
        };
      }

      const user = await this.userModel.authenticate(username, password);
      if (!user) {
        return { user: null, token: null, error: "Credenziali non valide." };
      }

      // In un'implementazione reale, qui genereremmo un JWT token
      // Per ora, usiamo un semplice token fittizio
      const token = this.generateToken(user);

      // Salva l'utente autenticato in localStorage
      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("authToken", token);
      localStorage.setItem("isAuthenticated", "true");

      return { user, token };
    } catch (error) {
      console.error("Error during login:", error);
      return {
        user: null,
        token: null,
        error: "Si è verificato un errore durante il login.",
      };
    }
  }

  logout(): void {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("isAuthenticated");
  }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem("currentUser");
    return userJson ? JSON.parse(userJson) : null;
  }

  isAuthenticated(): boolean {
    return localStorage.getItem("isAuthenticated") === "true";
  }

  async requestPasswordReset(
    email: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        return {
          success: false,
          error: "Nessun utente trovato con questa email.",
        };
      }

      // In un'implementazione reale, qui genereremmo un token di reset e invieremmo un'email
      // Per ora, simuliamo il successo

      // Salva il token di reset in localStorage (solo per simulazione)
      const resetToken = Math.random().toString(36).substring(2, 15);
      localStorage.setItem(`resetToken_${email}`, resetToken);

      return { success: true };
    } catch (error) {
      console.error("Error requesting password reset:", error);
      return {
        success: false,
        error:
          "Si è verificato un errore durante la richiesta di reset password.",
      };
    }
  }

  async resetPassword(
    email: string,
    newPassword: string,
    token: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // In un'implementazione reale, verificheremmo il token di reset
      // Per ora, simuliamo la verifica
      const storedToken = localStorage.getItem(`resetToken_${email}`);
      if (!storedToken || storedToken !== token) {
        return {
          success: false,
          error: "Token di reset non valido o scaduto.",
        };
      }

      const success = await this.userModel.resetPassword(email, newPassword);
      if (!success) {
        return {
          success: false,
          error: "Impossibile reimpostare la password.",
        };
      }

      // Rimuovi il token di reset
      localStorage.removeItem(`resetToken_${email}`);

      return { success: true };
    } catch (error) {
      console.error("Error resetting password:", error);
      return {
        success: false,
        error: "Si è verificato un errore durante il reset della password.",
      };
    }
  }

  private generateToken(user: User): string {
    // In un'implementazione reale, qui genereremmo un JWT token
    // Per ora, usiamo un semplice token fittizio
    return `token_${user.id}_${Date.now()}`;
  }
}
