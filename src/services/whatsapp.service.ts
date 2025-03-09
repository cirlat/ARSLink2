import { LicenseModel } from "../models/license";
import { AppointmentModel, Appointment } from "../models/appointment";

export class WhatsAppService {
  private licenseModel: LicenseModel;
  private appointmentModel: AppointmentModel;
  private static instance: WhatsAppService;
  private isEnabled: boolean = false;
  private isAuthenticated: boolean = false;
  private browserPath: string = "";
  private dataPath: string = "";

  private constructor() {
    this.licenseModel = LicenseModel.getInstance();
    this.appointmentModel = new AppointmentModel();
    this.checkEnabled();
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  private async checkEnabled(): Promise<void> {
    this.isEnabled = await this.licenseModel.isWhatsAppEnabled();

    // Carica le configurazioni da localStorage
    const whatsappConfig = localStorage.getItem("whatsappConfig");
    if (whatsappConfig) {
      const config = JSON.parse(whatsappConfig);
      this.isAuthenticated = config.isAuthenticated || false;
      this.browserPath = config.browserPath || "";
      this.dataPath = config.dataPath || "";
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

  async configure(browserPath: string, dataPath: string): Promise<boolean> {
    if (!this.isEnabled) {
      throw new Error(
        "Il servizio WhatsApp non è abilitato con la licenza corrente.",
      );
    }

    try {
      // In un'implementazione reale, qui verificheremmo i percorsi e configureremmo Selenium
      // Per ora, simuliamo il successo

      this.browserPath = browserPath;
      this.dataPath = dataPath;

      // Salva le configurazioni in localStorage
      localStorage.setItem(
        "whatsappConfig",
        JSON.stringify({
          browserPath,
          dataPath,
          isAuthenticated: false,
        }),
      );

      return true;
    } catch (error) {
      console.error("Error configuring WhatsApp service:", error);
      return false;
    }
  }

  async authenticate(): Promise<boolean> {
    if (!this.isEnabled || !this.browserPath || !this.dataPath) {
      return false;
    }

    try {
      // In un'implementazione reale, qui avvieremmo il browser e autenticheremmo WhatsApp Web
      // Per ora, simuliamo il successo

      // Aggiorna lo stato di autenticazione in localStorage
      const config = JSON.parse(localStorage.getItem("whatsappConfig") || "{}");
      config.isAuthenticated = true;
      localStorage.setItem("whatsappConfig", JSON.stringify(config));

      this.isAuthenticated = true;
      return true;
    } catch (error) {
      console.error("Error authenticating WhatsApp:", error);
      return false;
    }
  }

  async sendNotification(
    appointment: Appointment,
    phoneNumber: string,
    message: string,
  ): Promise<boolean> {
    if (!this.isEnabled || !this.isAuthenticated) {
      return false;
    }

    try {
      // Verifica che l'appuntamento e il numero di telefono siano validi
      if (!appointment.id || !phoneNumber) {
        console.error("Dati incompleti per l'invio della notifica WhatsApp");
        return false;
      }

      // Verifica che il numero di telefono sia in un formato valido
      if (!this.isValidPhoneNumber(phoneNumber)) {
        console.error("Formato numero di telefono non valido:", phoneNumber);
        return false;
      }

      // In un'implementazione reale, qui utilizzeremmo Selenium per controllare WhatsApp Web
      // Simuliamo un processo più realistico

      console.log(`Simulazione invio WhatsApp a ${phoneNumber}: ${message}`);

      // Simulazione del processo di invio con possibilità di fallimento casuale
      const isSuccessful = Math.random() > 0.1; // 90% di successo

      if (!isSuccessful) {
        throw new Error("Simulazione fallimento invio WhatsApp");
      }

      // Salva la notifica in localStorage per simulazione
      try {
        const notifications = JSON.parse(
          localStorage.getItem("whatsappNotifications") || "[]",
        );
        notifications.push({
          appointmentId: appointment.id,
          phoneNumber,
          message,
          sentAt: new Date().toISOString(),
          status: "sent",
        });
        localStorage.setItem(
          "whatsappNotifications",
          JSON.stringify(notifications),
        );
      } catch (e) {
        console.error(
          "Errore nel salvataggio della notifica in localStorage:",
          e,
        );
      }

      // Aggiorna lo stato di notifica dell'appuntamento
      await this.appointmentModel.updateWhatsAppNotification(
        appointment.id,
        true,
      );

      return true;
    } catch (error) {
      console.error("Error sending WhatsApp notification:", error);

      // Registra il fallimento in localStorage
      try {
        const failedNotifications = JSON.parse(
          localStorage.getItem("failedWhatsappNotifications") || "[]",
        );
        failedNotifications.push({
          appointmentId: appointment.id,
          phoneNumber,
          message,
          attemptedAt: new Date().toISOString(),
          error: error.message || "Unknown error",
        });
        localStorage.setItem(
          "failedWhatsappNotifications",
          JSON.stringify(failedNotifications),
        );
      } catch (e) {
        console.error(
          "Errore nel salvataggio della notifica fallita in localStorage:",
          e,
        );
      }

      return false;
    }
  }

  // Metodo helper per validare il formato del numero di telefono
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Formato base: +39 123 456 7890 o varianti
    const phoneRegex = /^\+?[0-9\s]{10,15}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ""));
  }

  async sendAppointmentConfirmation(
    appointment: Appointment,
    phoneNumber: string,
  ): Promise<boolean> {
    const message = `Gentile paziente, confermiamo il suo appuntamento per il ${new Date(appointment.date).toLocaleDateString()} alle ${appointment.time}. Risponda "OK" per confermare o "NO" per annullare. Grazie!`;
    return this.sendNotification(appointment, phoneNumber, message);
  }

  async sendAppointmentReminder(
    appointment: Appointment,
    phoneNumber: string,
  ): Promise<boolean> {
    const message = `Gentile paziente, le ricordiamo il suo appuntamento per domani ${new Date(appointment.date).toLocaleDateString()} alle ${appointment.time}. A presto!`;
    return this.sendNotification(appointment, phoneNumber, message);
  }

  async processPendingNotifications(): Promise<{
    success: number;
    failed: number;
  }> {
    if (!this.isEnabled || !this.isAuthenticated) {
      return { success: 0, failed: 0 };
    }

    try {
      // Ottieni tutti gli appuntamenti che necessitano di notifica
      const pendingAppointments =
        await this.appointmentModel.findPendingNotifications();

      let success = 0;
      let failed = 0;

      for (const appointment of pendingAppointments) {
        const today = new Date();
        const appointmentDate = new Date(appointment.date);
        const isToday =
          appointmentDate.getDate() === today.getDate() &&
          appointmentDate.getMonth() === today.getMonth() &&
          appointmentDate.getFullYear() === today.getFullYear();

        const isTomorrow =
          appointmentDate.getDate() === today.getDate() + 1 &&
          appointmentDate.getMonth() === today.getMonth() &&
          appointmentDate.getFullYear() === today.getFullYear();

        // Invia promemoria per appuntamenti di domani
        if (isTomorrow) {
          const result = await this.sendAppointmentReminder(
            appointment,
            appointment.phone,
          );
          if (result) {
            success++;
          } else {
            failed++;
          }
        }
        // Invia conferma per appuntamenti futuri (non di oggi o domani)
        else if (!isToday && !isTomorrow) {
          const result = await this.sendAppointmentConfirmation(
            appointment,
            appointment.phone,
          );
          if (result) {
            success++;
          } else {
            failed++;
          }
        }
      }

      return { success, failed };
    } catch (error) {
      console.error("Error processing pending notifications:", error);
      return { success: 0, failed: 0 };
    }
  }

  disconnect(): void {
    // In un'implementazione reale, qui chiuderemmo il browser e disconnetteremmo WhatsApp Web

    // Aggiorna lo stato di autenticazione in localStorage
    const config = JSON.parse(localStorage.getItem("whatsappConfig") || "{}");
    config.isAuthenticated = false;
    localStorage.setItem("whatsappConfig", JSON.stringify(config));

    this.isAuthenticated = false;
  }
}
