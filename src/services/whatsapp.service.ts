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
    notificationType: "confirmation" | "reminder" | "custom" = "custom",
  ): Promise<boolean> {
    // Formatta il numero di telefono per WhatsApp
    phoneNumber = this.formatPhoneNumber(phoneNumber);
    if (!this.isEnabled || !this.isAuthenticated) {
      throw new Error(
        "Il servizio WhatsApp non è abilitato o autenticato. Verifica le impostazioni e l'autenticazione.",
      );
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

      // Crea una nuova notifica nel database
      const { NotificationModel } = await import("@/models/notification");
      const notificationModel = new NotificationModel();

      // Ottieni il nome del paziente
      let patientName = "Paziente";
      try {
        const { PatientModel } = await import("@/models/patient");
        const patientModel = new PatientModel();
        const patient = await patientModel.findById(appointment.patient_id);
        if (patient) {
          patientName = patient.name;
        }
      } catch (error) {
        console.error("Errore nel recupero del nome del paziente:", error);
      }

      // Crea la notifica con stato "pending"
      const notification = await notificationModel.create({
        patient_id: appointment.patient_id,
        patient_name: patientName,
        appointment_id: appointment.id,
        appointment_date: new Date(appointment.date),
        appointment_time: appointment.time,
        message,
        status: "pending",
        type: notificationType,
      });

      // In un'implementazione reale, qui utilizzeremmo Selenium per controllare WhatsApp Web
      console.log(`Invio WhatsApp a ${phoneNumber}: ${message}`);

      try {
        // Verifica se WhatsApp Web è aperto e connesso
        // Questa è una simulazione, in un'implementazione reale controlleremmo lo stato di Selenium
        const isWhatsAppConnected = this.isAuthenticated;

        if (!isWhatsAppConnected) {
          throw new Error(
            "WhatsApp Web non è connesso. Apri WhatsApp Web e scansiona il codice QR.",
          );
        }

        // Simulazione del processo di invio con possibilità di fallimento casuale
        const isSuccessful = Math.random() > 0.1; // 90% di successo

        if (!isSuccessful) {
          throw new Error(
            "Errore nell'invio del messaggio WhatsApp. Verifica la connessione e riprova.",
          );
        }

        // Aggiorna lo stato della notifica a "sent"
        await notificationModel.updateStatus(
          notification.id!,
          "sent",
          new Date(),
        );

        // Aggiorna lo stato di notifica dell'appuntamento
        await this.appointmentModel.updateWhatsAppNotification(
          appointment.id,
          true,
        );

        return true;
      } catch (sendError) {
        // Aggiorna lo stato della notifica a "failed"
        await notificationModel.updateStatus(notification.id!, "failed");
        throw sendError;
      }
    } catch (error) {
      console.error("Error sending WhatsApp notification:", error);
      throw error;
    }
  }

  // Metodo helper per validare il formato del numero di telefono
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Accetta qualsiasi numero con almeno 8 cifre, con o senza prefisso internazionale
    const phoneRegex = /^\+?[0-9\s]{8,15}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ""));
  }

  // Metodo per formattare il numero di telefono per WhatsApp
  private formatPhoneNumber(phoneNumber: string): string {
    // Rimuove spazi e caratteri non numerici
    let formattedNumber = phoneNumber
      .replace(/\s+/g, "")
      .replace(/[^0-9+]/g, "");

    // Assicura che il numero inizi con +
    if (!formattedNumber.startsWith("+")) {
      // Se inizia con 00, sostituisci con +
      if (formattedNumber.startsWith("00")) {
        formattedNumber = "+" + formattedNumber.substring(2);
      } else if (formattedNumber.startsWith("0")) {
        // Se inizia con 0, assumiamo sia un numero italiano e aggiungiamo +39
        formattedNumber = "+39" + formattedNumber;
      } else {
        // Altrimenti aggiungiamo semplicemente +
        formattedNumber = "+" + formattedNumber;
      }
    }

    return formattedNumber;
  }

  async sendAppointmentConfirmation(
    appointment: Appointment,
    phoneNumber: string,
  ): Promise<boolean> {
    const message = `Gentile paziente, confermiamo il suo appuntamento per il ${new Date(appointment.date).toLocaleDateString()} alle ${appointment.time}. Risponda "OK" per confermare o "NO" per annullare. Grazie!`;
    return this.sendNotification(
      appointment,
      phoneNumber,
      message,
      "confirmation",
    );
  }

  async sendAppointmentReminder(
    appointment: Appointment,
    phoneNumber: string,
  ): Promise<boolean> {
    const message = `Gentile paziente, le ricordiamo il suo appuntamento per domani ${new Date(appointment.date).toLocaleDateString()} alle ${appointment.time}. A presto!`;
    return this.sendNotification(appointment, phoneNumber, message, "reminder");
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
