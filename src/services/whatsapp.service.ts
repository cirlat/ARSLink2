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
      // In un'implementazione reale, qui invieremmo un messaggio WhatsApp tramite Selenium
      // Per ora, simuliamo il successo

      // Aggiorna lo stato di notifica dell'appuntamento
      await this.appointmentModel.updateWhatsAppNotification(
        appointment.id!,
        true,
      );

      return true;
    } catch (error) {
      console.error("Error sending WhatsApp notification:", error);
      return false;
    }
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
