import { LicenseModel } from "../models/license";
import { AppointmentModel, Appointment } from "../models/appointment";

export class GoogleCalendarService {
  private licenseModel: LicenseModel;
  private appointmentModel: AppointmentModel;
  private static instance: GoogleCalendarService;
  private isEnabled: boolean = false;
  private isAuthenticated: boolean = false;
  private authClient: any = null; // In un'implementazione reale, questo sarebbe un client OAuth2
  private clientId: string = "";
  private clientSecret: string = "";
  private redirectUri: string = "";

  private constructor() {
    this.licenseModel = LicenseModel.getInstance();
    this.appointmentModel = new AppointmentModel();
    this.checkEnabled();
    this.loadConfiguration();
  }

  private loadConfiguration() {
    // Carica la configurazione da localStorage
    const clientId = localStorage.getItem("googleClientId");
    const clientSecret = localStorage.getItem("googleClientSecret");
    const redirectUri = localStorage.getItem("googleRedirectUri");

    if (clientId && clientSecret && redirectUri) {
      this.clientId = clientId;
      this.clientSecret = clientSecret;
      this.redirectUri = redirectUri;
      console.log("Configurazione Google Calendar caricata da localStorage");
    }
  }

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  private async checkEnabled(): Promise<void> {
    // Verifica se la licenza permette Google Calendar
    const isLicenseEnabled = await this.licenseModel.isGoogleCalendarEnabled();

    // Carica le configurazioni dal database
    try {
      const { default: Database } = await import("../models/database");
      const db = Database.getInstance();
      const configRows = await db.query(
        "SELECT value FROM configurations WHERE key = 'google_calendar_config'",
      );

      if (configRows && configRows.length > 0) {
        const configValue = configRows[0].value;
        if (configValue) {
          const config = JSON.parse(configValue);
          // Aggiorna lo stato in base alla licenza
          config.enabled = isLicenseEnabled;
          this.isAuthenticated = config.authenticated || false;

          // Salva la configurazione aggiornata
          await db.query(
            `INSERT INTO configurations (key, value) 
             VALUES ($1, $2) 
             ON CONFLICT (key) DO UPDATE SET value = $2`,
            ["google_calendar_config", JSON.stringify(config)],
          );

          // Aggiorna anche localStorage per compatibilità
          localStorage.setItem("googleConfig", JSON.stringify(config));
        }
      }
    } catch (error) {
      console.error("Error loading Google Calendar configuration:", error);
    }

    // Imposta lo stato di abilitazione
    this.isEnabled = isLicenseEnabled;
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

  // Metodo per configurare il servizio
  async configure(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<void> {
    // Implementazione della configurazione
    console.log("Configurazione del servizio Google Calendar");

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;

    // Salva la configurazione in localStorage
    localStorage.setItem("googleClientId", clientId);
    localStorage.setItem("googleClientSecret", clientSecret);
    localStorage.setItem("googleRedirectUri", redirectUri);
  }

  // Metodo per ottenere l'URL di autorizzazione
  async getAuthUrl(): Promise<string> {
    // Verifica che i parametri di configurazione siano impostati
    if (!this.clientId || !this.redirectUri) {
      throw new Error(
        "Configurazione Google Calendar mancante. Imposta Client ID e Redirect URI.",
      );
    }

    // Costruisci l'URL di autorizzazione con i parametri corretti
    const scopes = encodeURIComponent(
      "https://www.googleapis.com/auth/calendar",
    );
    const redirectUri = encodeURIComponent(this.redirectUri);

    console.log("Generazione URL di autorizzazione Google Calendar");
    console.log(`Client ID: ${this.clientId}`);
    console.log(`Redirect URI: ${this.redirectUri}`);

    return `https://accounts.google.com/o/oauth2/auth?client_id=${this.clientId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code&access_type=offline&prompt=consent`;
  }

  // Alias per compatibilità con il codice esistente
  async createEvent(appointment: Appointment): Promise<boolean> {
    return this.syncAppointment(appointment);
  }

  async syncAppointment(appointment: Appointment): Promise<boolean> {
    if (!this.isEnabled || !this.isAuthenticated) {
      return false;
    }

    try {
      // Verifica che l'appuntamento abbia tutti i dati necessari
      if (
        !appointment.id ||
        !appointment.patient_id ||
        !appointment.date ||
        !appointment.time
      ) {
        console.error(
          "Dati appuntamento incompleti per la sincronizzazione con Google Calendar",
        );
        return false;
      }

      // In un'implementazione reale, qui utilizzeremmo l'API di Google Calendar
      // Per ora, implementiamo una simulazione più realistica

      // Recupera le informazioni del paziente (in un'app reale)
      // const patient = await patientModel.findById(appointment.patient_id);

      // Costruisci l'oggetto evento per Google Calendar
      const eventDetails = {
        summary: `Appuntamento: ${appointment.appointment_type}`,
        description: appointment.notes || "Nessuna nota",
        start: {
          dateTime: `${new Date(appointment.date).toISOString().split("T")[0]}T${appointment.time}:00`,
          timeZone: "Europe/Rome",
        },
        end: {
          // Calcola l'ora di fine in base alla durata
          dateTime: this.calculateEndTime(
            appointment.date,
            appointment.time,
            appointment.duration,
          ),
          timeZone: "Europe/Rome",
        },
        // Altre proprietà che sarebbero presenti in un evento reale
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 30 },
          ],
        },
      };

      console.log(
        "Simulazione sincronizzazione con Google Calendar:",
        eventDetails,
      );

      // Genera un ID evento fittizio ma più realistico
      const eventId = `google_event_${appointment.id}_${Date.now().toString(36)}`;

      // Aggiorna lo stato di sincronizzazione dell'appuntamento
      await this.appointmentModel.updateGoogleCalendarSync(
        appointment.id,
        true,
        eventId,
      );

      // Salva i dettagli dell'evento in localStorage per simulazione
      try {
        const syncedEvents = JSON.parse(
          localStorage.getItem("googleCalendarEvents") || "{}",
        );
        syncedEvents[eventId] = {
          ...eventDetails,
          appointmentId: appointment.id,
          syncedAt: new Date().toISOString(),
        };
        localStorage.setItem(
          "googleCalendarEvents",
          JSON.stringify(syncedEvents),
        );
      } catch (e) {
        console.error("Errore nel salvataggio dell'evento in localStorage:", e);
      }

      return true;
    } catch (error) {
      console.error("Error syncing appointment with Google Calendar:", error);
      return false;
    }
  }

  // Metodo helper per calcolare l'ora di fine dell'appuntamento
  private calculateEndTime(
    date: Date,
    startTime: string,
    durationMinutes: number,
  ): string {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date(date);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return endDate.toISOString();
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

  // Metodo per gestire il callback di autorizzazione
  async handleAuthCallback(
    code: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verifica che i parametri di configurazione siano impostati
      if (!this.clientId || !this.clientSecret || !this.redirectUri) {
        return {
          success: false,
          error:
            "Configurazione Google Calendar mancante. Imposta Client ID, Client Secret e Redirect URI.",
        };
      }

      console.log("Gestione callback di autorizzazione Google Calendar");
      console.log(`Codice di autorizzazione: ${code}`);

      // In un'implementazione reale, qui ci sarebbe lo scambio del codice con un token di accesso
      // Per ora, simuliamo un token di accesso
      const accessToken = `simulated_access_token_${Date.now()}`;
      const refreshToken = `simulated_refresh_token_${Date.now()}`;
      const expiresIn = 3600; // 1 ora

      // Salva i token in localStorage
      localStorage.setItem("googleAccessToken", accessToken);
      localStorage.setItem("googleRefreshToken", refreshToken);
      localStorage.setItem(
        "googleTokenExpiry",
        (Date.now() + expiresIn * 1000).toString(),
      );

      return { success: true };
    } catch (error) {
      console.error(
        "Errore durante la gestione del callback di autorizzazione:",
        error,
      );
      return {
        success: false,
        error: error.message || "Errore sconosciuto durante l'autorizzazione",
      };
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
