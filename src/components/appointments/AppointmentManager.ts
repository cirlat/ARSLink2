/**
 * Gestore degli appuntamenti
 * Questo modulo fornisce funzioni per la gestione degli appuntamenti
 */

import { WhatsAppService } from "@/services/whatsapp.service";
import { GoogleCalendarService } from "@/services/googleCalendar.service";
import { LicenseModel } from "@/models/license";

export interface Appointment {
  id: string;
  patient_id: string;
  date: string;
  time: string;
  duration: number;
  appointment_type: string;
  notes?: string;
  google_calendar_synced?: boolean;
  google_event_id?: string;
  whatsapp_notification_sent?: boolean;
  whatsapp_notification_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

/**
 * Crea un nuovo appuntamento
 * @param appointment Dati dell'appuntamento
 * @param patient Dati del paziente
 * @returns L'appuntamento creato
 */
export async function createAppointment(
  appointment: Appointment,
  patient: Patient,
): Promise<Appointment> {
  try {
    // Genera un ID univoco per l'appuntamento
    if (!appointment.id) {
      appointment.id = Date.now().toString();
    }

    // Imposta le date di creazione e aggiornamento
    appointment.created_at = new Date().toISOString();
    appointment.updated_at = new Date().toISOString();

    // In un'implementazione reale, qui salveremmo l'appuntamento nel database
    // Utilizziamo il modello AppointmentModel
    try {
      const { AppointmentModel } = await import("@/models/appointment");
      const appointmentModel = new AppointmentModel();
      await appointmentModel.create(appointment);
      console.log(`Appuntamento ${appointment.id} creato nel database`);
    } catch (dbError) {
      console.error("Errore nel salvataggio nel database:", dbError);
      // Continuiamo con il salvataggio in localStorage come fallback
    }

    // Salva l'appuntamento in localStorage
    const appointments = JSON.parse(
      localStorage.getItem("appointments") || "[]",
    );
    appointments.push(appointment);
    localStorage.setItem("appointments", JSON.stringify(appointments));

    // Verifica se è necessario sincronizzare con Google Calendar
    const licenseModel = LicenseModel.getInstance();
    const isGoogleCalendarEnabled =
      await licenseModel.isGoogleCalendarEnabled();

    if (isGoogleCalendarEnabled) {
      try {
        const googleCalendarService = GoogleCalendarService.getInstance();
        const isAuthenticated =
          await googleCalendarService.isServiceAuthenticated();

        if (isAuthenticated) {
          const syncResult =
            await googleCalendarService.syncAppointment(appointment);

          if (syncResult) {
            console.log(
              `Appuntamento ${appointment.id} sincronizzato con Google Calendar`,
            );
            appointment.google_calendar_synced = true;

            // Aggiorna l'appuntamento in localStorage
            const updatedAppointments = appointments.map((a) =>
              a.id === appointment.id ? appointment : a,
            );
            localStorage.setItem(
              "appointments",
              JSON.stringify(updatedAppointments),
            );
          }
        }
      } catch (error) {
        console.error(
          "Errore nella sincronizzazione con Google Calendar:",
          error,
        );
      }
    }

    // Verifica se è necessario inviare una notifica WhatsApp
    const isWhatsAppEnabled = await licenseModel.isWhatsAppEnabled();

    if (isWhatsAppEnabled && patient.phone) {
      try {
        const whatsAppService = WhatsAppService.getInstance();
        const isAuthenticated = await whatsAppService.isServiceAuthenticated();

        if (isAuthenticated) {
          // Ottieni il template per la conferma dell'appuntamento
          const templates = JSON.parse(
            localStorage.getItem("whatsappTemplates") || "[]",
          );
          const confirmationTemplate = templates.find(
            (t) => t.type === "appointment",
          ) || {
            content:
              "Gentile {paziente}, confermiamo il suo appuntamento per il {data} alle {ora}. Risponda 'OK' per confermare.",
          };

          // Formatta la data e l'ora
          const formattedDate = new Date(appointment.date).toLocaleDateString(
            "it-IT",
          );

          // Sostituisci i segnaposto nel template
          let message = confirmationTemplate.content
            .replace("{paziente}", patient.name)
            .replace("{data}", formattedDate)
            .replace("{ora}", appointment.time);

          // Invia la notifica
          const sendResult = await whatsAppService.sendNotification(
            appointment,
            patient.phone,
            message,
          );

          if (sendResult) {
            console.log(
              `Notifica WhatsApp inviata per l'appuntamento ${appointment.id}`,
            );
            appointment.whatsapp_notification_sent = true;
            appointment.whatsapp_notification_time = new Date().toISOString();

            // Aggiorna l'appuntamento in localStorage
            const updatedAppointments = appointments.map((a) =>
              a.id === appointment.id ? appointment : a,
            );
            localStorage.setItem(
              "appointments",
              JSON.stringify(updatedAppointments),
            );
          }
        }
      } catch (error) {
        console.error("Errore nell'invio della notifica WhatsApp:", error);
      }
    }

    return appointment;
  } catch (error) {
    console.error("Errore nella creazione dell'appuntamento:", error);
    throw error;
  }
}

/**
 * Aggiorna un appuntamento esistente
 * @param appointment Dati dell'appuntamento aggiornato
 * @param patient Dati del paziente
 * @param sendNotification Se inviare una notifica di aggiornamento
 * @returns L'appuntamento aggiornato
 */
export async function updateAppointment(
  appointment: Appointment,
  patient: Patient,
  sendNotification: boolean = false,
): Promise<Appointment> {
  try {
    // Verifica che l'appuntamento esista
    const appointments = JSON.parse(
      localStorage.getItem("appointments") || "[]",
    );
    const existingAppointment = appointments.find(
      (a) => a.id === appointment.id,
    );

    if (!existingAppointment) {
      throw new Error(`Appuntamento ${appointment.id} non trovato`);
    }

    // Aggiorna la data di modifica
    appointment.updated_at = new Date().toISOString();

    // In un'implementazione reale, qui aggiorneremmo l'appuntamento nel database
    // Utilizziamo il modello AppointmentModel
    try {
      const { AppointmentModel } = await import("@/models/appointment");
      const appointmentModel = new AppointmentModel();
      await appointmentModel.update(parseInt(appointment.id), appointment);
      console.log(`Appuntamento ${appointment.id} aggiornato nel database`);
    } catch (dbError) {
      console.error("Errore nell'aggiornamento nel database:", dbError);
      // Continuiamo con l'aggiornamento in localStorage come fallback
    }

    // Aggiorna l'appuntamento in localStorage
    const updatedAppointments = appointments.map((a) =>
      a.id === appointment.id ? appointment : a,
    );
    localStorage.setItem("appointments", JSON.stringify(updatedAppointments));

    // Verifica se è necessario sincronizzare con Google Calendar
    const licenseModel = LicenseModel.getInstance();
    const isGoogleCalendarEnabled =
      await licenseModel.isGoogleCalendarEnabled();

    if (isGoogleCalendarEnabled) {
      try {
        const googleCalendarService = GoogleCalendarService.getInstance();
        const isAuthenticated =
          await googleCalendarService.isServiceAuthenticated();

        if (isAuthenticated) {
          // Se l'appuntamento era già sincronizzato, elimina l'evento precedente
          if (
            existingAppointment.google_calendar_synced &&
            existingAppointment.google_event_id
          ) {
            await googleCalendarService.deleteAppointment(existingAppointment);
          }

          // Crea un nuovo evento
          const syncResult =
            await googleCalendarService.syncAppointment(appointment);

          if (syncResult) {
            console.log(
              `Appuntamento ${appointment.id} sincronizzato con Google Calendar`,
            );
            appointment.google_calendar_synced = true;

            // Aggiorna l'appuntamento in localStorage
            const reUpdatedAppointments = updatedAppointments.map((a) =>
              a.id === appointment.id ? appointment : a,
            );
            localStorage.setItem(
              "appointments",
              JSON.stringify(reUpdatedAppointments),
            );
          }
        }
      } catch (error) {
        console.error(
          "Errore nella sincronizzazione con Google Calendar:",
          error,
        );
      }
    }

    // Verifica se è necessario inviare una notifica WhatsApp
    const isWhatsAppEnabled = await licenseModel.isWhatsAppEnabled();

    if (isWhatsAppEnabled && patient.phone && sendNotification) {
      try {
        const whatsAppService = WhatsAppService.getInstance();
        const isAuthenticated = await whatsAppService.isServiceAuthenticated();

        if (isAuthenticated) {
          // Ottieni il template per l'aggiornamento dell'appuntamento
          const templates = JSON.parse(
            localStorage.getItem("whatsappTemplates") || "[]",
          );
          const updateTemplate = templates.find((t) => t.type === "update") || {
            content:
              "Gentile {paziente}, il suo appuntamento è stato modificato. La nuova data è {data} alle {ora}. Risponda 'OK' per confermare.",
          };

          // Formatta la data e l'ora
          const formattedDate = new Date(appointment.date).toLocaleDateString(
            "it-IT",
          );

          // Sostituisci i segnaposto nel template
          let message = updateTemplate.content
            .replace("{paziente}", patient.name)
            .replace("{data}", formattedDate)
            .replace("{ora}", appointment.time);

          // Invia la notifica
          const sendResult = await whatsAppService.sendNotification(
            appointment,
            patient.phone,
            message,
          );

          if (sendResult) {
            console.log(
              `Notifica WhatsApp di aggiornamento inviata per l'appuntamento ${appointment.id}`,
            );
            appointment.whatsapp_notification_sent = true;
            appointment.whatsapp_notification_time = new Date().toISOString();

            // Aggiorna l'appuntamento in localStorage
            const reUpdatedAppointments = updatedAppointments.map((a) =>
              a.id === appointment.id ? appointment : a,
            );
            localStorage.setItem(
              "appointments",
              JSON.stringify(reUpdatedAppointments),
            );
          }
        }
      } catch (error) {
        console.error("Errore nell'invio della notifica WhatsApp:", error);
      }
    }

    return appointment;
  } catch (error) {
    console.error("Errore nell'aggiornamento dell'appuntamento:", error);
    throw error;
  }
}

/**
 * Elimina un appuntamento
 * @param appointmentId ID dell'appuntamento da eliminare
 * @param patient Dati del paziente
 * @param sendNotification Se inviare una notifica di cancellazione
 * @returns true se l'eliminazione è riuscita, false altrimenti
 */
export async function deleteAppointment(
  appointmentId: string,
  patient: Patient,
  sendNotification: boolean = false,
): Promise<boolean> {
  try {
    // Verifica che l'appuntamento esista
    const appointments = JSON.parse(
      localStorage.getItem("appointments") || "[]",
    );
    const appointmentToDelete = appointments.find(
      (a) => a.id === appointmentId,
    );

    if (!appointmentToDelete) {
      throw new Error(`Appuntamento ${appointmentId} non trovato`);
    }

    // In un'implementazione reale, qui elimineremmo l'appuntamento dal database
    // Utilizziamo il modello AppointmentModel
    try {
      const { AppointmentModel } = await import("@/models/appointment");
      const appointmentModel = new AppointmentModel();
      await appointmentModel.delete(parseInt(appointmentId));
      console.log(`Appuntamento ${appointmentId} eliminato dal database`);
    } catch (dbError) {
      console.error("Errore nell'eliminazione dal database:", dbError);
      // Continuiamo con l'eliminazione da localStorage come fallback
    }

    // Verifica se è necessario eliminare l'evento da Google Calendar
    const licenseModel = LicenseModel.getInstance();
    const isGoogleCalendarEnabled =
      await licenseModel.isGoogleCalendarEnabled();

    if (isGoogleCalendarEnabled && appointmentToDelete.google_calendar_synced) {
      try {
        const googleCalendarService = GoogleCalendarService.getInstance();
        const isAuthenticated =
          await googleCalendarService.isServiceAuthenticated();

        if (isAuthenticated) {
          await googleCalendarService.deleteAppointment(appointmentToDelete);
          console.log(
            `Evento Google Calendar per l'appuntamento ${appointmentId} eliminato`,
          );
        }
      } catch (error) {
        console.error(
          "Errore nell'eliminazione dell'evento da Google Calendar:",
          error,
        );
      }
    }

    // Verifica se è necessario inviare una notifica WhatsApp
    const isWhatsAppEnabled = await licenseModel.isWhatsAppEnabled();

    if (isWhatsAppEnabled && patient.phone && sendNotification) {
      try {
        const whatsAppService = WhatsAppService.getInstance();
        const isAuthenticated = await whatsAppService.isServiceAuthenticated();

        if (isAuthenticated) {
          // Ottieni il template per la cancellazione dell'appuntamento
          const templates = JSON.parse(
            localStorage.getItem("whatsappTemplates") || "[]",
          );
          const cancelTemplate = templates.find((t) => t.type === "cancel") || {
            content:
              "Gentile {paziente}, il suo appuntamento del {data} alle {ora} è stato cancellato. La preghiamo di contattarci per maggiori informazioni.",
          };

          // Formatta la data e l'ora
          const formattedDate = new Date(
            appointmentToDelete.date,
          ).toLocaleDateString("it-IT");

          // Sostituisci i segnaposto nel template
          let message = cancelTemplate.content
            .replace("{paziente}", patient.name)
            .replace("{data}", formattedDate)
            .replace("{ora}", appointmentToDelete.time);

          // Invia la notifica
          await whatsAppService.sendNotification(
            appointmentToDelete,
            patient.phone,
            message,
          );

          console.log(
            `Notifica WhatsApp di cancellazione inviata per l'appuntamento ${appointmentId}`,
          );
        }
      } catch (error) {
        console.error("Errore nell'invio della notifica WhatsApp:", error);
      }
    }

    // Elimina l'appuntamento da localStorage
    const updatedAppointments = appointments.filter(
      (a) => a.id !== appointmentId,
    );
    localStorage.setItem("appointments", JSON.stringify(updatedAppointments));

    return true;
  } catch (error) {
    console.error("Errore nell'eliminazione dell'appuntamento:", error);
    return false;
  }
}
