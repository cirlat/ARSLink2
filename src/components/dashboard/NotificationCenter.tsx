import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import {
  Search,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Plus,
  Calendar,
} from "lucide-react";

interface NotificationProps {
  initialNotifications?: {
    id: string;
    patientName: string;
    appointmentDate: string;
    appointmentTime: string;
    status: "sent" | "failed" | "pending";
    type: "confirmation" | "reminder";
    message: string;
    sentAt?: string;
  }[];
}

const NotificationCenter = ({
  initialNotifications = [],
}: NotificationProps) => {
  // Carica le notifiche dal database all'avvio del componente
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [notifications, setNotifications] = useState<
    {
      id: string;
      patientName: string;
      appointmentDate: string;
      appointmentTime: string;
      status: "sent" | "failed" | "pending";
      type: "confirmation" | "reminder";
      message: string;
      sentAt?: string;
    }[]
  >([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { NotificationModel } = await import("@/models/notification");
        const notificationModel = new NotificationModel();
        const result = await notificationModel.findAll(50, 0); // Carica le prime 50 notifiche

        if (result && result.notifications && result.notifications.length > 0) {
          // Formatta le notifiche per l'uso nel componente
          const formattedNotifications = result.notifications.map((n) => ({
            id: n.id?.toString() || "",
            patientName: n.patient_name || "",
            appointmentDate: n.appointment_date
              ? new Date(n.appointment_date).toISOString().split("T")[0]
              : "",
            appointmentTime: n.appointment_time || "",
            status: n.status as "sent" | "failed" | "pending",
            type: n.type as "confirmation" | "reminder",
            message: n.message || "",
            sentAt: n.sent_at ? new Date(n.sent_at).toISOString() : undefined,
          }));

          setNotifications(formattedNotifications);
        }
      } catch (error) {
        console.error("Errore nel caricamento delle notifiche:", error);
      }
    };

    loadNotifications();
  }, []);

  // Filter notifications based on search query and filters
  const filteredNotifications = notifications.filter((notification) => {
    // Search filter
    const matchesSearch =
      notification.patientName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || notification.status === statusFilter;

    // Type filter
    const matchesType =
      typeFilter === "all" || notification.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Filter notifications by tab
  const getTabNotifications = (tab: string) => {
    if (tab === "all") return filteredNotifications;
    if (tab === "pending")
      return filteredNotifications.filter((n) => n.status === "pending");
    if (tab === "sent")
      return filteredNotifications.filter((n) => n.status === "sent");
    if (tab === "failed")
      return filteredNotifications.filter((n) => n.status === "failed");
    return filteredNotifications;
  };

  const handleResendNotification = async (notification: any) => {
    try {
      // Carica il servizio WhatsApp
      const { WhatsAppService } = await import("@/services/whatsapp.service");
      const whatsAppService = WhatsAppService.getInstance();

      // Verifica se il servizio è abilitato e autenticato
      const isEnabled = await whatsAppService.isServiceEnabled();
      const isAuthenticated = await whatsAppService.isServiceAuthenticated();

      if (!isEnabled || !isAuthenticated) {
        if (!isEnabled) {
          alert(
            "Il servizio WhatsApp non è abilitato. Verifica la tua licenza.",
          );
        } else {
          const confirmAuth = confirm(
            "WhatsApp Web non è autenticato. Vuoi aprire WhatsApp Web per autenticarti?",
          );
          if (confirmAuth) {
            const authResult = await whatsAppService.authenticate();
            if (!authResult) {
              throw new Error(
                "Errore durante l'autenticazione di WhatsApp Web.",
              );
            }
            alert(
              "WhatsApp Web autenticato con successo! Riprova a inviare la notifica.",
            );
            return;
          }
        }
        return;
      }

      // Carica i dettagli della notifica dal database
      const { NotificationModel } = await import("@/models/notification");
      const notificationModel = new NotificationModel();
      const notificationDetails = await notificationModel.findById(
        parseInt(notification.id),
      );

      if (!notificationDetails) {
        throw new Error("Notifica non trovata nel database");
      }

      // Carica i dettagli del paziente
      const { PatientModel } = await import("@/models/patient");
      const patientModel = new PatientModel();
      const patient = await patientModel.findById(
        notificationDetails.patient_id,
      );

      if (!patient) {
        throw new Error("Paziente non trovato nel database");
      }

      // Crea un oggetto appuntamento fittizio per la funzione sendNotification
      const dummyAppointment = {
        id: notificationDetails.id,
        patient_id: notificationDetails.patient_id,
        date: notificationDetails.appointment_date || new Date(),
        time:
          notificationDetails.appointment_time ||
          new Date().toTimeString().substring(0, 5),
        duration: 30,
        appointment_type: notificationDetails.type,
        notes: "",
      };

      // Invia la notifica
      const sent = await whatsAppService.sendNotification(
        dummyAppointment,
        patient.phone,
        notificationDetails.message,
        notificationDetails.type as any,
      );

      // Aggiorna lo stato della notifica nel database
      if (sent) {
        await notificationModel.updateStatus(
          notificationDetails.id!,
          "sent",
          new Date(),
        );

        // Aggiorna la UI
        window.location.reload();

        // Mostra un messaggio di successo
        alert("Notifica inviata con successo!");
      } else {
        throw new Error("Errore nell'invio della notifica WhatsApp");
      }
    } catch (error) {
      console.error("Errore durante l'invio della notifica:", error);
      alert(
        `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800">Inviato</Badge>;
      case "failed":
        return <Badge variant="destructive">Fallito</Badge>;
      case "pending":
        return <Badge variant="secondary">In attesa</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-white p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Centro Notifiche WhatsApp</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                // Carica le notifiche da localStorage
                const savedNotifications = JSON.parse(
                  localStorage.getItem("whatsappNotifications") || "[]",
                );

                // In un'implementazione reale, qui caricheremmo le notifiche dal database
                try {
                  // Carica le notifiche dal database
                  const { WhatsAppService } = await import(
                    "@/services/whatsapp.service"
                  );
                  const whatsAppService = WhatsAppService.getInstance();

                  // Verifica se il servizio è abilitato e autenticato
                  const isEnabled = await whatsAppService.isServiceEnabled();
                  const isAuthenticated =
                    await whatsAppService.isServiceAuthenticated();

                  if (isEnabled && isAuthenticated) {
                    // Processa le notifiche in attesa
                    const result =
                      await whatsAppService.processPendingNotifications();
                    console.log(
                      `Notifiche processate: ${result.success} successo, ${result.failed} fallite`,
                    );
                  }
                } catch (serviceError) {
                  console.error(
                    "Errore nel caricamento delle notifiche dal servizio:",
                    serviceError,
                  );
                }

                // Aggiorna la pagina per mostrare le notifiche aggiornate
                window.location.reload();

                // Mostra un messaggio di conferma
                alert(
                  `Notifiche aggiornate: ${savedNotifications.length} notifiche trovate`,
                );
              } catch (error) {
                console.error(
                  "Errore durante l'aggiornamento delle notifiche:",
                  error,
                );
                alert(
                  "Si è verificato un errore durante l'aggiornamento delle notifiche: " +
                    error.message,
                );
              }
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              try {
                // Carica i pazienti dal database prima di creare il modale
                const { PatientModel } = await import("@/models/patient");
                const patientModel = new PatientModel();
                const result = await patientModel.findAll();

                // Crea un modale per la nuova notifica
                const modal = document.createElement("div");
                modal.className =
                  "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

                // Genera le opzioni per i pazienti
                let patientOptions =
                  '<option value="">Seleziona paziente...</option>';

                if (result && result.patients && result.patients.length > 0) {
                  patientOptions += result.patients
                    .map(
                      (patient) =>
                        `<option value="${patient.id}" data-phone="${patient.phone || ""}">${patient.name}</option>`,
                    )
                    .join("");
                } else {
                  // Fallback a opzioni di esempio se non ci sono pazienti
                  patientOptions += `
                    <option value="1">Marco Rossi</option>
                    <option value="2">Giulia Bianchi</option>
                    <option value="3">Luca Verdi</option>
                  `;
                }

                modal.innerHTML = `
              <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 class="text-lg font-medium mb-4">Invia Nuova Notifica</h3>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Paziente</label>
                    <select id="notification-patient" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                      ${patientOptions}
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium mb-1">Tipo Notifica</label>
                    <select id="notification-type" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="confirmation">Conferma Appuntamento</option>
                      <option value="reminder">Promemoria</option>
                      <option value="custom">Messaggio Personalizzato</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium mb-1">Messaggio</label>
                    <textarea id="notification-message" class="w-full px-3 py-2 border border-gray-300 rounded-md h-24" 
                      placeholder="Inserisci il messaggio da inviare..."></textarea>
                  </div>
                </div>
                
                <div class="flex justify-end space-x-2 mt-6">
                  <button id="cancel-notification" class="px-4 py-2 border border-gray-300 rounded-md">Annulla</button>
                  <button id="send-notification" class="px-4 py-2 bg-blue-600 text-white rounded-md">Invia</button>
                </div>
              </div>`;
                document.body.appendChild(modal);

                // Gestisci la chiusura del modale
                document
                  .getElementById("cancel-notification")
                  ?.addEventListener("click", () => {
                    document.body.removeChild(modal);
                  });

                // Gestisci il caricamento dei pazienti dal database
                document
                  .getElementById("load-patients")
                  ?.addEventListener("click", async () => {
                    try {
                      // Disabilita il pulsante durante il caricamento
                      const loadButton =
                        document.getElementById("load-patients");
                      if (loadButton) {
                        loadButton.textContent = "Caricamento...";
                        loadButton.setAttribute("disabled", "true");
                      }

                      // Carica i pazienti dal database
                      const { PatientModel } = await import("@/models/patient");
                      const patientModel = new PatientModel();
                      const result = await patientModel.findAll();

                      if (
                        result &&
                        result.patients &&
                        result.patients.length > 0
                      ) {
                        // Aggiorna il select con i pazienti dal database
                        const patientSelect = document.getElementById(
                          "notification-patient",
                        );
                        if (patientSelect) {
                          // Rimuovi tutte le opzioni tranne la prima (placeholder)
                          while (patientSelect.options.length > 1) {
                            patientSelect.remove(1);
                          }

                          // Aggiungi i pazienti dal database
                          result.patients.forEach((patient) => {
                            const option = document.createElement("option");
                            option.value = patient.id.toString();
                            option.text = patient.name;
                            patientSelect.add(option);
                          });

                          if (loadButton) {
                            loadButton.textContent = "Pazienti caricati!";
                            setTimeout(() => {
                              if (loadButton)
                                loadButton.textContent = "Aggiorna pazienti";
                              loadButton.removeAttribute("disabled");
                            }, 2000);
                          }
                        }
                      } else {
                        if (loadButton) {
                          loadButton.textContent = "Nessun paziente trovato";
                          setTimeout(() => {
                            if (loadButton) loadButton.textContent = "Riprova";
                            loadButton.removeAttribute("disabled");
                          }, 2000);
                        }
                      }
                    } catch (error) {
                      console.error(
                        "Errore nel caricamento dei pazienti:",
                        error,
                      );
                      const loadButton =
                        document.getElementById("load-patients");
                      if (loadButton) {
                        loadButton.textContent = "Errore nel caricamento";
                        setTimeout(() => {
                          if (loadButton) loadButton.textContent = "Riprova";
                          loadButton.removeAttribute("disabled");
                        }, 2000);
                      }
                    }
                  });

                // Gestisci l'invio della notifica
                document
                  .getElementById("send-notification")
                  ?.addEventListener("click", async () => {
                    const patientSelect = document.getElementById(
                      "notification-patient",
                    ) as HTMLSelectElement;
                    const patientId = patientSelect.value;
                    const notificationType = (
                      document.getElementById(
                        "notification-type",
                      ) as HTMLSelectElement
                    ).value;
                    const message = (
                      document.getElementById(
                        "notification-message",
                      ) as HTMLTextAreaElement
                    ).value;

                    if (!patientId) {
                      alert("Seleziona un paziente");
                      return;
                    }

                    if (!message) {
                      alert("Inserisci un messaggio");
                      return;
                    }

                    try {
                      // Cambia lo stato del pulsante
                      const sendButton = document.getElementById(
                        "send-notification",
                      ) as HTMLButtonElement;
                      sendButton.textContent = "Invio in corso...";
                      sendButton.disabled = true;

                      // Ottieni il numero di telefono del paziente
                      const selectedOption =
                        patientSelect.options[patientSelect.selectedIndex];
                      const patientPhone =
                        selectedOption.getAttribute("data-phone");
                      const patientName = selectedOption.text;

                      if (!patientPhone) {
                        throw new Error(
                          "Numero di telefono del paziente non disponibile",
                        );
                      }

                      // Crea la notifica nel database
                      const { NotificationModel } = await import(
                        "@/models/notification"
                      );
                      const notificationModel = new NotificationModel();

                      const notificationData = {
                        patient_id: parseInt(patientId),
                        patient_name: patientName,
                        message: message,
                        status: "pending" as "pending" | "sent" | "failed",
                        type: notificationType as
                          | "confirmation"
                          | "reminder"
                          | "custom",
                        appointment_date: new Date(),
                        appointment_time: new Date()
                          .toTimeString()
                          .substring(0, 5),
                      };

                      // Salva la notifica nel database
                      const savedNotification =
                        await notificationModel.create(notificationData);

                      if (!savedNotification || !savedNotification.id) {
                        throw new Error(
                          "Errore nel salvataggio della notifica",
                        );
                      }

                      // Invia la notifica tramite WhatsApp
                      const { WhatsAppService } = await import(
                        "@/services/whatsapp.service"
                      );
                      const whatsAppService = WhatsAppService.getInstance();

                      // Verifica se il servizio è abilitato e autenticato
                      const isEnabled =
                        await whatsAppService.isServiceEnabled();
                      const isAuthenticated =
                        await whatsAppService.isServiceAuthenticated();

                      if (!isEnabled || !isAuthenticated) {
                        // Mostra un popup di errore con opzione per aprire WhatsApp
                        if (!isEnabled) {
                          throw new Error(
                            "Il servizio WhatsApp non è abilitato. Verifica la tua licenza.",
                          );
                        } else {
                          const confirmAuth = confirm(
                            "WhatsApp Web non è autenticato. Vuoi aprire WhatsApp Web per autenticarti?",
                          );

                          if (confirmAuth) {
                            const authResult =
                              await whatsAppService.authenticate();
                            if (!authResult) {
                              throw new Error(
                                "Errore durante l'autenticazione di WhatsApp Web.",
                              );
                            }

                            alert(
                              "WhatsApp Web autenticato con successo! Riprova a inviare la notifica.",
                            );
                            sendButton.textContent = "Invia";
                            sendButton.disabled = false;
                            return;
                          } else {
                            throw new Error(
                              "WhatsApp Web non è autenticato. La notifica è stata salvata ma non inviata.",
                            );
                          }
                        }
                      }

                      // Crea un oggetto appuntamento fittizio per la funzione sendNotification
                      const dummyAppointment = {
                        id: savedNotification.id,
                        patient_id: parseInt(patientId),
                        date: new Date(),
                        time: new Date().toTimeString().substring(0, 5),
                        duration: 30,
                        appointment_type: "custom",
                        notes: "",
                      };

                      // Invia la notifica
                      const sent = await whatsAppService.sendNotification(
                        dummyAppointment,
                        patientPhone,
                        message,
                        notificationType as
                          | "confirmation"
                          | "reminder"
                          | "custom",
                      );

                      // Aggiorna lo stato della notifica nel database
                      if (sent) {
                        await notificationModel.updateStatus(
                          savedNotification.id,
                          "sent",
                          new Date(),
                        );

                        // Chiudi il modale
                        document.body.removeChild(modal);

                        // Mostra un messaggio di successo
                        alert("Notifica inviata con successo!");

                        // Ricarica le notifiche
                        const result = await notificationModel.findAll(10, 0);

                        if (result && result.notifications) {
                          // Formatta le notifiche per l'uso nel componente
                          const formattedNotifications =
                            result.notifications.map((n) => ({
                              id: n.id?.toString() || "",
                              patientName: n.patient_name || "",
                              appointmentDate: n.appointment_date
                                ? new Date(n.appointment_date)
                                    .toISOString()
                                    .split("T")[0]
                                : "",
                              appointmentTime: n.appointment_time || "",
                              status: n.status as "sent" | "failed" | "pending",
                              type: n.type as "confirmation" | "reminder",
                              message: n.message || "",
                              sentAt: n.sent_at
                                ? new Date(n.sent_at).toISOString()
                                : undefined,
                            }));

                          setNotifications(formattedNotifications);
                        }
                      } else {
                        await notificationModel.updateStatus(
                          savedNotification.id,
                          "failed",
                        );
                        throw new Error(
                          "Errore nell'invio della notifica WhatsApp",
                        );
                      }
                    } catch (error) {
                      console.error(
                        "Errore durante l'invio della notifica:",
                        error,
                      );
                      alert(
                        `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                      );

                      const sendButton = document.getElementById(
                        "send-notification",
                      ) as HTMLButtonElement;
                      if (sendButton) {
                        sendButton.textContent = "Invia";
                        sendButton.disabled = false;
                      }
                    }
                  });

                // Aggiorna il messaggio in base al tipo di notifica selezionato
                document
                  .getElementById("notification-type")
                  ?.addEventListener("change", (e) => {
                    const type = (e.target as HTMLSelectElement).value;
                    const messageField = document.getElementById(
                      "notification-message",
                    ) as HTMLTextAreaElement;
                    const patientSelect = document.getElementById(
                      "notification-patient",
                    ) as HTMLSelectElement;
                    const patientName =
                      patientSelect.options[patientSelect.selectedIndex]
                        ?.text || "paziente";

                    if (type === "confirmation") {
                      messageField.value = `Gentile ${patientName}, confermiamo il suo appuntamento per il ${new Date().toLocaleDateString("it-IT")} alle ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, "0")}. Risponda "OK" per confermare.`;
                    } else if (type === "reminder") {
                      messageField.value = `Gentile ${patientName}, le ricordiamo il suo appuntamento per domani ${new Date(Date.now() + 86400000).toLocaleDateString("it-IT")} alle ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, "0")}. A presto!`;
                    } else {
                      messageField.value = "";
                    }
                  });

                // Aggiorna il messaggio quando cambia il paziente selezionato
                document
                  .getElementById("notification-patient")
                  ?.addEventListener("change", () => {
                    const typeSelect = document.getElementById(
                      "notification-type",
                    ) as HTMLSelectElement;
                    typeSelect.dispatchEvent(new Event("change"));
                  });
              } catch (error) {
                console.error("Errore nel caricamento dei pazienti:", error);
                // Fallback con modale senza pazienti reali
                const modal = document.createElement("div");
                modal.className =
                  "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                modal.innerHTML = `
              <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 class="text-lg font-medium mb-4">Invia Nuova Notifica</h3>
                
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Paziente</label>
                    <select id="notification-patient" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="">Seleziona paziente...</option>
                      <option value="1">Marco Rossi</option>
                      <option value="2">Giulia Bianchi</option>
                      <option value="3">Luca Verdi</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium mb-1">Tipo Notifica</label>
                    <select id="notification-type" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="confirmation">Conferma Appuntamento</option>
                      <option value="reminder">Promemoria</option>
                      <option value="custom">Messaggio Personalizzato</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium mb-1">Messaggio</label>
                    <textarea id="notification-message" class="w-full px-3 py-2 border border-gray-300 rounded-md h-24" 
                      placeholder="Inserisci il messaggio da inviare..."></textarea>
                  </div>
                </div>
                
                <div class="flex justify-end space-x-2 mt-6">
                  <button id="cancel-notification" class="px-4 py-2 border border-gray-300 rounded-md">Annulla</button>
                  <button id="send-notification" class="px-4 py-2 bg-blue-600 text-white rounded-md">Invia</button>
                </div>
              </div>
            `;
                document.body.appendChild(modal);

                // Gestisci la chiusura del modale
                let modalElement = modal;
                document
                  .getElementById("cancel-notification")
                  ?.addEventListener("click", () => {
                    document.body.removeChild(modalElement);
                  });

                // Gestisci l'invio della notifica
                document
                  .getElementById("send-notification")
                  ?.addEventListener("click", async () => {
                    const patientSelect = document.getElementById(
                      "notification-patient",
                    ) as HTMLSelectElement;
                    const patientId = patientSelect.value;
                    const notificationType = (
                      document.getElementById(
                        "notification-type",
                      ) as HTMLSelectElement
                    ).value;
                    const message = (
                      document.getElementById(
                        "notification-message",
                      ) as HTMLTextAreaElement
                    ).value;

                    if (!patientId) {
                      alert("Seleziona un paziente");
                      return;
                    }

                    if (!message) {
                      alert("Inserisci un messaggio");
                      return;
                    }

                    try {
                      // Cambia lo stato del pulsante
                      const sendButton = document.getElementById(
                        "send-notification",
                      ) as HTMLButtonElement;
                      sendButton.textContent = "Invio in corso...";
                      sendButton.disabled = true;

                      // Ottieni il numero di telefono del paziente
                      const selectedOption =
                        patientSelect.options[patientSelect.selectedIndex];
                      const patientPhone =
                        selectedOption.getAttribute("data-phone");
                      const patientName = selectedOption.text;

                      if (!patientPhone) {
                        throw new Error(
                          "Numero di telefono del paziente non disponibile",
                        );
                      }

                      // Crea la notifica nel database
                      const { NotificationModel } = await import(
                        "@/models/notification"
                      );
                      const notificationModel = new NotificationModel();

                      const notificationData = {
                        patient_id: parseInt(patientId),
                        patient_name: patientName,
                        message: message,
                        status: "pending" as "pending" | "sent" | "failed",
                        type: notificationType as
                          | "confirmation"
                          | "reminder"
                          | "custom",
                        appointment_date: new Date(),
                        appointment_time: new Date()
                          .toTimeString()
                          .substring(0, 5),
                      };

                      // Salva la notifica nel database
                      const savedNotification =
                        await notificationModel.create(notificationData);

                      if (!savedNotification || !savedNotification.id) {
                        throw new Error(
                          "Errore nel salvataggio della notifica",
                        );
                      }

                      // Invia la notifica tramite WhatsApp
                      const { WhatsAppService } = await import(
                        "@/services/whatsapp.service"
                      );
                      const whatsAppService = WhatsAppService.getInstance();

                      // Verifica se il servizio è abilitato e autenticato
                      const isEnabled =
                        await whatsAppService.isServiceEnabled();
                      const isAuthenticated =
                        await whatsAppService.isServiceAuthenticated();

                      if (!isEnabled || !isAuthenticated) {
                        // Mostra un popup di errore con opzione per aprire WhatsApp
                        if (!isEnabled) {
                          throw new Error(
                            "Il servizio WhatsApp non è abilitato. Verifica la tua licenza.",
                          );
                        } else {
                          const confirmAuth = confirm(
                            "WhatsApp Web non è autenticato. Vuoi aprire WhatsApp Web per autenticarti?",
                          );

                          if (confirmAuth) {
                            const authResult =
                              await whatsAppService.authenticate();
                            if (!authResult) {
                              throw new Error(
                                "Errore durante l'autenticazione di WhatsApp Web.",
                              );
                            }

                            alert(
                              "WhatsApp Web autenticato con successo! Riprova a inviare la notifica.",
                            );
                            sendButton.textContent = "Invia";
                            sendButton.disabled = false;
                            return;
                          } else {
                            throw new Error(
                              "WhatsApp Web non è autenticato. La notifica è stata salvata ma non inviata.",
                            );
                          }
                        }
                      }

                      // Crea un oggetto appuntamento fittizio per la funzione sendNotification
                      const dummyAppointment = {
                        id: savedNotification.id,
                        patient_id: parseInt(patientId),
                        date: new Date(),
                        time: new Date().toTimeString().substring(0, 5),
                        duration: 30,
                        appointment_type: "custom",
                        notes: "",
                      };

                      // Invia la notifica
                      const sent = await whatsAppService.sendNotification(
                        dummyAppointment,
                        patientPhone,
                        message,
                        notificationType as
                          | "confirmation"
                          | "reminder"
                          | "custom",
                      );

                      // Aggiorna lo stato della notifica nel database
                      if (sent) {
                        await notificationModel.updateStatus(
                          savedNotification.id,
                          "sent",
                          new Date(),
                        );

                        // Chiudi il modale
                        document.body.removeChild(modal);

                        // Mostra un messaggio di successo
                        alert("Notifica inviata con successo!");

                        // Ricarica le notifiche
                        const result = await notificationModel.findAll(10, 0);

                        if (result && result.notifications) {
                          // Formatta le notifiche per l'uso nel componente
                          const formattedNotifications =
                            result.notifications.map((n) => ({
                              id: n.id?.toString() || "",
                              patientName: n.patient_name || "",
                              appointmentDate: n.appointment_date
                                ? new Date(n.appointment_date)
                                    .toISOString()
                                    .split("T")[0]
                                : "",
                              appointmentTime: n.appointment_time || "",
                              status: n.status as "sent" | "failed" | "pending",
                              type: n.type as "confirmation" | "reminder",
                              message: n.message || "",
                              sentAt: n.sent_at
                                ? new Date(n.sent_at).toISOString()
                                : undefined,
                            }));

                          setNotifications(formattedNotifications);
                        }
                      } else {
                        await notificationModel.updateStatus(
                          savedNotification.id,
                          "failed",
                        );
                        throw new Error(
                          "Errore nell'invio della notifica WhatsApp",
                        );
                      }
                    } catch (error) {
                      console.error(
                        "Errore durante l'invio della notifica:",
                        error,
                      );
                      alert(
                        `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                      );

                      const sendButton = document.getElementById(
                        "send-notification",
                      ) as HTMLButtonElement;
                      if (sendButton) {
                        sendButton.textContent = "Invia";
                        sendButton.disabled = false;
                      }
                    }
                  });

                // Aggiorna il messaggio in base al tipo di notifica selezionato
                document
                  .getElementById("notification-type")
                  ?.addEventListener("change", (e) => {
                    const type = (e.target as HTMLSelectElement).value;
                    const messageField = document.getElementById(
                      "notification-message",
                    ) as HTMLTextAreaElement;
                    const patientSelect = document.getElementById(
                      "notification-patient",
                    ) as HTMLSelectElement;
                    const patientName =
                      patientSelect.options[patientSelect.selectedIndex]
                        ?.text || "paziente";

                    if (type === "confirmation") {
                      messageField.value = `Gentile ${patientName}, confermiamo il suo appuntamento per il ${new Date().toLocaleDateString("it-IT")} alle ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, "0")}. Risponda "OK" per confermare.`;
                    } else if (type === "reminder") {
                      messageField.value = `Gentile ${patientName}, le ricordiamo il suo appuntamento per domani ${new Date(Date.now() + 86400000).toLocaleDateString("it-IT")} alle ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, "0")}. A presto!`;
                    } else {
                      messageField.value = "";
                    }
                  });

                // Aggiorna il messaggio quando cambia il paziente selezionato
                document
                  .getElementById("notification-patient")
                  ?.addEventListener("change", () => {
                    const typeSelect = document.getElementById(
                      "notification-type",
                    ) as HTMLSelectElement;
                    typeSelect.dispatchEvent(new Event("change"));
                  });
              }
            }}
          >
            <Send className="h-4 w-4 mr-2" />
            Invia Notifica
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totale Notifiche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inviate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {notifications.filter((n) => n.status === "sent").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Attesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {notifications.filter((n) => n.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fallite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notifications.filter((n) => n.status === "failed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {notifications.filter((n) => n.status === "failed").length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Attenzione</AlertTitle>
          <AlertDescription>
            Ci sono {notifications.filter((n) => n.status === "failed").length}{" "}
            notifiche che non sono state inviate correttamente. Controlla la
            connessione WhatsApp e riprova.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca paziente o messaggio..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="w-40">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="sent">Inviati</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="failed">Falliti</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                <SelectItem value="confirmation">Conferma</SelectItem>
                <SelectItem value="reminder">Promemoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setTypeFilter("all");
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            Tutte ({filteredNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            In Attesa (
            {filteredNotifications.filter((n) => n.status === "pending").length}
            )
          </TabsTrigger>
          <TabsTrigger value="sent">
            Inviate (
            {filteredNotifications.filter((n) => n.status === "sent").length})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Fallite (
            {filteredNotifications.filter((n) => n.status === "failed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {getTabNotifications("all").length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stato</TableHead>
                  <TableHead>Paziente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Messaggio</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getTabNotifications("all").map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(notification.status)}
                        <span className="ml-2">
                          {notification.status === "sent"
                            ? "Inviato"
                            : notification.status === "pending"
                              ? "In attesa"
                              : "Fallito"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{notification.patientName}</TableCell>
                    <TableCell>
                      {notification.appointmentDate
                        ? `${notification.appointmentDate} ${notification.appointmentTime}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {notification.type === "confirmation"
                        ? "Conferma"
                        : notification.type === "reminder"
                          ? "Promemoria"
                          : "Personalizzato"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {notification.message}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Mostra i dettagli della notifica
                            alert(
                              `Dettagli Notifica:\n\nID: ${notification.id}\nPaziente: ${notification.patientName}\nStato: ${notification.status}\nTipo: ${notification.type}\nData: ${notification.appointmentDate || "N/A"}\nOra: ${notification.appointmentTime || "N/A"}\nMessaggio: ${notification.message}\nInviato il: ${notification.sentAt ? new Date(notification.sentAt).toLocaleString() : "Non inviato"}`,
                            );
                          }}
                        >
                          Dettagli
                        </Button>
                        {notification.status !== "sent" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleResendNotification(notification)
                            }
                          >
                            Re-invia
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                Nessuna notifica trovata. Usa il pulsante "Invia Notifica" per
                creare una nuova notifica.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {getTabNotifications("pending").length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stato</TableHead>
                  <TableHead>Paziente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Messaggio</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getTabNotifications("pending").map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="ml-2">In attesa</span>
                      </div>
                    </TableCell>
                    <TableCell>{notification.patientName}</TableCell>
                    <TableCell>
                      {notification.appointmentDate
                        ? `${notification.appointmentDate} ${notification.appointmentTime}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {notification.type === "confirmation"
                        ? "Conferma"
                        : notification.type === "reminder"
                          ? "Promemoria"
                          : "Personalizzato"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {notification.message}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Mostra i dettagli della notifica
                            alert(
                              `Dettagli Notifica:\n\nID: ${notification.id}\nPaziente: ${notification.patientName}\nStato: ${notification.status}\nTipo: ${notification.type}\nData: ${notification.appointmentDate || "N/A"}\nOra: ${notification.appointmentTime || "N/A"}\nMessaggio: ${notification.message}\nInviato il: ${notification.sentAt ? new Date(notification.sentAt).toLocaleString() : "Non inviato"}`,
                            );
                          }}
                        >
                          Dettagli
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendNotification(notification)}
                        >
                          Re-invia
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                Nessuna notifica in attesa.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {getTabNotifications("sent").length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stato</TableHead>
                  <TableHead>Paziente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Messaggio</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getTabNotifications("sent").map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="ml-2">Inviato</span>
                      </div>
                    </TableCell>
                    <TableCell>{notification.patientName}</TableCell>
                    <TableCell>
                      {notification.appointmentDate
                        ? `${notification.appointmentDate} ${notification.appointmentTime}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {notification.type === "confirmation"
                        ? "Conferma"
                        : notification.type === "reminder"
                          ? "Promemoria"
                          : "Personalizzato"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {notification.message}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Mostra i dettagli della notifica
                          alert(
                            `Dettagli Notifica:\n\nID: ${notification.id}\nPaziente: ${notification.patientName}\nStato: ${notification.status}\nTipo: ${notification.type}\nData: ${notification.appointmentDate || "N/A"}\nOra: ${notification.appointmentTime || "N/A"}\nMessaggio: ${notification.message}\nInviato il: ${notification.sentAt ? new Date(notification.sentAt).toLocaleString() : "Non inviato"}`,
                          );
                        }}
                      >
                        Dettagli
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Nessuna notifica inviata.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          {getTabNotifications("failed").length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stato</TableHead>
                  <TableHead>Paziente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Messaggio</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getTabNotifications("failed").map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="ml-2">Fallito</span>
                      </div>
                    </TableCell>
                    <TableCell>{notification.patientName}</TableCell>
                    <TableCell>
                      {notification.appointmentDate
                        ? `${notification.appointmentDate} ${notification.appointmentTime}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {notification.type === "confirmation"
                        ? "Conferma"
                        : notification.type === "reminder"
                          ? "Promemoria"
                          : "Personalizzato"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {notification.message}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Mostra i dettagli della notifica
                            alert(
                              `Dettagli Notifica:\n\nID: ${notification.id}\nPaziente: ${notification.patientName}\nStato: ${notification.status}\nTipo: ${notification.type}\nData: ${notification.appointmentDate || "N/A"}\nOra: ${notification.appointmentTime || "N/A"}\nMessaggio: ${notification.message}\nInviato il: ${notification.sentAt ? new Date(notification.sentAt).toLocaleString() : "Non inviato"}`,
                            );
                          }}
                        >
                          Dettagli
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendNotification(notification)}
                        >
                          Re-invia
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Nessuna notifica fallita.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationCenter;
