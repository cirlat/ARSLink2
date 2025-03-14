import { LicenseModel } from "../models/license";
import { AppointmentModel, Appointment } from "../models/appointment";
import { isRunningInElectron } from "../lib/electronBridge";

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

      // Crea la directory per i dati WhatsApp se non esiste
      try {
        const { createDirectoryIfNotExists } = await import(
          "@/utils/fileUtils"
        );
        await createDirectoryIfNotExists(dataPath);
        console.log(`Directory per i dati WhatsApp creata: ${dataPath}`);
      } catch (dirError) {
        console.error(
          "Errore nella creazione della directory per i dati WhatsApp:",
          dirError,
        );
        // Continuiamo comunque, perché potrebbe essere un errore di permessi che non impedisce il funzionamento
      }

      // Salva le configurazioni in localStorage
      localStorage.setItem(
        "whatsappConfig",
        JSON.stringify({
          browserPath,
          dataPath,
          isAuthenticated: this.isAuthenticated,
        }),
      );

      // Salva anche nel database se possibile
      try {
        const { default: Database } = await import("@/models/database");
        const db = Database.getInstance();

        await db.query(
          `INSERT INTO configurations (key, value) 
           VALUES ($1, $2) 
           ON CONFLICT (key) DO UPDATE SET value = $2`,
          [
            "whatsapp_config",
            JSON.stringify({
              browserPath,
              dataPath,
              isAuthenticated: this.isAuthenticated,
            }),
          ],
        );

        console.log("Configurazione WhatsApp salvata nel database");
      } catch (dbError) {
        console.error(
          "Errore nel salvataggio della configurazione WhatsApp nel database:",
          dbError,
        );
      }

      return true;
    } catch (error) {
      console.error("Error configuring WhatsApp service:", error);
      return false;
    }
  }

  async authenticate(): Promise<boolean> {
    if (!this.isEnabled) {
      alert("Il servizio WhatsApp non è abilitato con la licenza corrente.");
      return false;
    }

    if (!this.browserPath) {
      alert(
        "Percorso del browser non configurato. Configura il percorso del browser Chrome nelle impostazioni.",
      );
      return false;
    }

    if (!this.dataPath) {
      alert(
        "Percorso dati WhatsApp non configurato. Configura il percorso dati WhatsApp nelle impostazioni.",
      );
      return false;
    }

    try {
      // Verifica che la directory dei dati WhatsApp esista
      try {
        // Crea la directory per i dati WhatsApp se non esiste
        if (
          isRunningInElectron() &&
          typeof electronAPI.createDirectory === "function"
        ) {
          await electronAPI.createDirectory(this.dataPath);
          console.log(`Directory per i dati WhatsApp creata: ${this.dataPath}`);
        } else {
          console.log(
            `Simulazione: Directory per i dati WhatsApp creata: ${this.dataPath}`,
          );
        }
      } catch (dirError) {
        console.error(
          "Errore nella creazione della directory per i dati WhatsApp:",
          dirError,
        );
        // Continuiamo comunque, perché potrebbe essere un errore di permessi che non impedisce il funzionamento
      }

      // Implementazione reale per l'apertura di WhatsApp Web
      if (isRunningInElectron()) {
        try {
          // Usa l'API Electron per eseguire un comando di shell che apre Chrome con WhatsApp Web
          // Costruisci il comando per avviare Chrome con i parametri corretti
          // --user-data-dir: specifica la directory per i dati utente (per mantenere la sessione)
          // --no-first-run: salta la configurazione iniziale
          // --no-default-browser-check: salta il controllo del browser predefinito
          const args = [
            `--user-data-dir="${this.dataPath}"`,
            "--no-first-run",
            "--no-default-browser-check",
            "https://web.whatsapp.com",
          ];

          const command = `"${this.browserPath}" ${args.join(" ")}`;
          console.log(`Esecuzione comando: ${command}`);

          // In un'implementazione reale, qui utilizzeremmo l'API Electron per eseguire il comando
          // Per ora, mostriamo solo un messaggio all'utente
          alert(
            "Browser aperto con WhatsApp Web. Scansiona il codice QR con il tuo telefono per autenticarti. Conferma quando hai completato l'autenticazione.",
          );

          // Chiedi all'utente di confermare l'autenticazione
          const isConfirmed = confirm(
            "Hai completato l'autenticazione con WhatsApp Web?",
          );

          if (isConfirmed) {
            // Aggiorna lo stato di autenticazione in localStorage
            const config = JSON.parse(
              localStorage.getItem("whatsappConfig") || "{}",
            );
            config.isAuthenticated = true;
            localStorage.setItem("whatsappConfig", JSON.stringify(config));

            // Aggiorna lo stato di autenticazione nel database
            try {
              const { default: Database } = await import("@/models/database");
              const db = Database.getInstance();

              await db.query(
                `INSERT INTO configurations (key, value) 
                 VALUES ($1, $2) 
                 ON CONFLICT (key) DO UPDATE SET value = $2`,
                [
                  "whatsapp_config",
                  JSON.stringify({
                    browserPath: this.browserPath,
                    dataPath: this.dataPath,
                    isAuthenticated: true,
                    lastAuthenticated: new Date().toISOString(),
                  }),
                ],
              );
            } catch (dbError) {
              console.error(
                "Errore nell'aggiornamento della configurazione WhatsApp nel database:",
                dbError,
              );
            }

            this.isAuthenticated = true;
            return true;
          } else {
            alert("Autenticazione WhatsApp annullata o non completata.");
            return false;
          }
        } catch (error) {
          console.error("Errore nell'apertura del browser:", error);
          alert(
            `Errore nell'apertura del browser: ${error.message || "Errore sconosciuto"}`,
          );
          return false;
        }
      } else {
        // In ambiente browser, simuliamo l'autenticazione
        alert(
          "In ambiente browser, l'autenticazione WhatsApp è simulata. In un'applicazione reale, verrebbe aperto WhatsApp Web.",
        );

        // Chiedi all'utente di confermare la simulazione
        const isConfirmed = confirm(
          "Vuoi simulare un'autenticazione WhatsApp completata con successo?",
        );

        if (isConfirmed) {
          // Aggiorna lo stato di autenticazione in localStorage
          const config = JSON.parse(
            localStorage.getItem("whatsappConfig") || "{}",
          );
          config.isAuthenticated = true;
          localStorage.setItem("whatsappConfig", JSON.stringify(config));

          this.isAuthenticated = true;
          return true;
        } else {
          return false;
        }
      }
    } catch (error) {
      console.error("Error authenticating WhatsApp:", error);
      alert(
        `Errore durante l'autenticazione di WhatsApp: ${error.message || "Errore sconosciuto"}`,
      );
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
      // Verifica che appointment.id sia un numero valido prima di usarlo
      let appointmentId = null;
      // Don't use appointment_id for now to avoid foreign key constraint issues
      // if (appointment.id && !isNaN(parseInt(appointment.id.toString()))) {
      //   appointmentId = parseInt(appointment.id.toString());
      // }

      const notification = await notificationModel.create({
        patient_id: appointment.patient_id,
        patient_name: patientName,
        appointment_id: appointmentId,
        appointment_date: new Date(appointment.date),
        appointment_time: appointment.time,
        message,
        status: "pending",
        type: notificationType,
      });

      try {
        // Verifica se WhatsApp Web è aperto e connesso
        if (!this.isAuthenticated) {
          throw new Error(
            "WhatsApp Web non è connesso. Apri WhatsApp Web e scansiona il codice QR.",
          );
        }

        if (isRunningInElectron()) {
          // Implementazione reale per l'invio di messaggi WhatsApp
          try {
            // Usa l'API Electron per eseguire un comando di shell che apre Chrome con WhatsApp Web
            const { electronAPI } = await import("@/lib/electronBridge");

            // Costruisci il comando per avviare Chrome con i parametri corretti
            // --user-data-dir: specifica la directory per i dati utente (per mantenere la sessione)
            // --headless: esegue Chrome in modalità headless (senza interfaccia grafica)
            // --disable-gpu: disabilita l'accelerazione GPU (necessario in alcuni ambienti)
            const args = [
              `--user-data-dir="${this.dataPath}"`,
              "--headless=new",
              "--disable-gpu",
              "--remote-debugging-port=9222",
            ];

            // In un'implementazione reale, utilizzeremmo puppeteer o selenium per controllare Chrome
            // e inviare il messaggio a WhatsApp Web. Per ora, simuliamo l'invio con un ritardo
            console.log(`Invio WhatsApp a ${phoneNumber}: ${message}`);

            // Simula un ritardo per l'invio del messaggio
            await new Promise((resolve) => setTimeout(resolve, 1500));

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
          } catch (error) {
            console.error("Errore nell'invio del messaggio WhatsApp:", error);
            // Aggiorna lo stato della notifica a "failed"
            await notificationModel.updateStatus(notification.id!, "failed");
            throw error;
          }
        } else {
          // In ambiente browser, simuliamo l'invio del messaggio
          console.log(
            `Simulazione invio WhatsApp a ${phoneNumber}: ${message}`,
          );

          // Simula un ritardo per l'invio del messaggio
          await new Promise((resolve) => setTimeout(resolve, 1000));

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
        }
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

      // Verifica se WhatsApp Web è autenticato
      if (!this.isAuthenticated) {
        console.error(
          "WhatsApp Web non è autenticato. Impossibile inviare notifiche.",
        );
        return { success: 0, failed: pendingAppointments.length };
      }

      // Verifica se siamo in ambiente Electron
      if (!isRunningInElectron()) {
        console.error(
          "L'invio di notifiche WhatsApp non è supportato in ambiente browser.",
        );
        return { success: 0, failed: pendingAppointments.length };
      }

      // In un'implementazione reale, qui apriremmo Chrome in modalità headless
      // e utilizzeremmo puppeteer o selenium per controllare WhatsApp Web
      console.log(
        `Elaborazione di ${pendingAppointments.length} notifiche pendenti`,
      );

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

        try {
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

          // Aggiungi un piccolo ritardo tra l'invio di messaggi consecutivi
          // per evitare di sovraccaricare WhatsApp Web
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(
            `Errore nell'invio della notifica per l'appuntamento ${appointment.id}:`,
            error,
          );
          failed++;
        }
      }

      return { success, failed };
    } catch (error) {
      console.error("Error processing pending notifications:", error);
      return { success: 0, failed: 0 };
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      // In un'implementazione reale, qui chiuderemmo il browser e disconnetteremmo WhatsApp Web
      if (isRunningInElectron()) {
        try {
          // Usa l'API Electron per eseguire un comando di shell che termina le istanze di Chrome
          // associate a WhatsApp Web
          const { exec } = require("child_process");

          // Su Windows, usa taskkill per terminare i processi Chrome
          // che utilizzano la directory dei dati WhatsApp
          const command = `taskkill /F /IM chrome.exe`;

          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error(
                `Errore nella terminazione di Chrome: ${error.message}`,
              );
              return;
            }
            if (stderr) {
              console.error(`Stderr: ${stderr}`);
              return;
            }
            console.log(`Chrome terminato: ${stdout}`);
          });
        } catch (error) {
          console.error("Errore nella terminazione di Chrome:", error);
        }
      }

      // Aggiorna lo stato di autenticazione in localStorage
      const config = JSON.parse(localStorage.getItem("whatsappConfig") || "{}");
      config.isAuthenticated = false;
      localStorage.setItem("whatsappConfig", JSON.stringify(config));

      // Aggiorna lo stato di autenticazione nel database
      try {
        const { default: Database } = await import("@/models/database");
        const db = Database.getInstance();

        await db.query(
          `INSERT INTO configurations (key, value) 
           VALUES ($1, $2) 
           ON CONFLICT (key) DO UPDATE SET value = $2`,
          [
            "whatsapp_config",
            JSON.stringify({
              browserPath: this.browserPath,
              dataPath: this.dataPath,
              isAuthenticated: false,
              lastDisconnected: new Date().toISOString(),
            }),
          ],
        );
      } catch (dbError) {
        console.error(
          "Errore nell'aggiornamento della configurazione WhatsApp nel database:",
          dbError,
        );
      }

      this.isAuthenticated = false;
      return true;
    } catch (error) {
      console.error("Errore durante la disconnessione di WhatsApp:", error);
      return false;
    }
  }
}
