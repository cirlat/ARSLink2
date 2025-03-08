import { LicenseModel } from "../models/license";
import { AppointmentModel, Appointment } from "../models/appointment";

export class GoogleCalendarService {
  private licenseModel: LicenseModel;
  private appointmentModel: AppointmentModel;
  private static instance: GoogleCalendarService;
  private isEnabled: boolean = false;
  private isAuthenticated: boolean = false;
  private authClient: any = null; // In un'implementazione reale, questo sarebbe un client OAuth2

  private constructor() {
    this.licenseModel = LicenseModel.getInstance();
    this.appointmentModel = new AppointmentModel();
    this.checkEnabled();
  }

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  private async checkEnabled(): Promise<void> {
    this.isEnabled = await this.licenseModel.isGoogleCalendarEnabled();

    // Carica le configurazioni da localStorage
    const googleConfig = localStorage.getItem("googleConfig");
    if (googleConfig) {
      const config = JSON.parse(googleConfig);
      this.isAuthenticated = config.isAuthenticated || false;
    }
  }

  async isServiceEnabled(): Promise<boolean> {
    await this.checkEnabled();
    return this.isEnabled;
  }

  async isServiceAuthenticated(): Promise<boolean> {
    await this.checkEnabled();
    return this.isEnabled && this.isAuthenticated;
  }

  async authenticate(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<boolean> {
    if (!this.isEnabled) {
      throw new Error(
        "Il servizio Google Calendar non è abilitato con la licenza corrente.",
      );
    }

    try {
      // In un'implementazione reale, qui configureremmo il client OAuth2 e avvieremmo il flusso di autenticazione
      // Per ora, simuliamo il successo

      // Salva le configurazioni in localStorage
      localStorage.setItem(
        "googleConfig",
        JSON.stringify({
          clientId,
          clientSecret,
          redirectUri,
          isAuthenticated: true,
        }),
      );

      this.isAuthenticated = true;
      return true;
    } catch (error) {
      console.error("Error authenticating with Google Calendar:", error);
      return false;
    }
  }

  async syncAppointment(appointment: Appointment): Promise<boolean> {
    if (!this.isEnabled || !this.isAuthenticated) {
      return false;
    }

    try {
      // In un'implementazione reale, qui creeremmo o aggiorneremmo un evento in Google Calendar
      // Per ora, simuliamo il successo

      // Genera un ID evento fittizio
      const eventId = `event_${appointment.id}_${Date.now()}`;

      // Aggiorna lo stato di sincronizzazione dell'appuntamento
      await this.appointmentModel.updateGoogleCalendarSync(
        appointment.id!,
        true,
        eventId,
      );

      return true;
    } catch (error) {
      console.error("Error syncing appointment with Google Calendar:", error);
      return false;
    }
  }

  async deleteAppointment(appointment: Appointment): Promise<boolean> {
    if (
      !this.isEnabled ||
      !this.isAuthenticated ||
      !appointment.google_event_id
    ) {
      return false;
    }

    try {
      // In un'implementazione reale, qui elimineremmo l'evento da Google Calendar
      // Per ora, simuliamo il successo

      // Aggiorna lo stato di sincronizzazione dell'appuntamento
      await this.appointmentModel.updateGoogleCalendarSync(
        appointment.id!,
        false,
        null,
      );

      return true;
    } catch (error) {
      console.error("Error deleting appointment from Google Calendar:", error);
      return false;
    }
  }

  async syncAllAppointments(): Promise<{ success: number; failed: number }> {
    if (!this.isEnabled || !this.isAuthenticated) {
      return { success: 0, failed: 0 };
    }

    try {
      // Ottieni tutti gli appuntamenti futuri non sincronizzati
      const today = new Date();
      const appointments = await this.appointmentModel.findByDateRange(
        today,
        new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()),
      );

      let success = 0;
      let failed = 0;

      for (const appointment of appointments) {
        if (!appointment.google_calendar_synced) {
          const result = await this.syncAppointment(appointment);
          if (result) {
            success++;
          } else {
            failed++;
          }
        }
      }

      return { success, failed };
    } catch (error) {
      console.error(
        "Error syncing all appointments with Google Calendar:",
        error,
      );
      return { success: 0, failed: 0 };
    }
  }

  disconnect(): void {
    // In un'implementazione reale, qui revocheremmo l'accesso e disconnetteremmo il client OAuth2

    // Rimuovi le configurazioni da localStorage
    localStorage.removeItem("googleConfig");

    this.isAuthenticated = false;
    this.authClient = null;
  }
}
