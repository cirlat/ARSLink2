import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Users, Bell, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentPatients, setRecentPatients] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carica i dati dal database
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Carica i pazienti recenti
        const { PatientModel } = await import("@/models/patient");
        const patientModel = new PatientModel();
        const patientsResult = await patientModel.findAll();

        if (patientsResult.patients && patientsResult.patients.length > 0) {
          // Ordina i pazienti per data di creazione (più recenti prima)
          const sortedPatients = [...patientsResult.patients].sort((a, b) => {
            return (
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime()
            );
          });

          // Prendi i primi 3 pazienti
          const recentPatientsList = sortedPatients.slice(0, 3).map((p) => ({
            id: p.id.toString(),
            name: p.name,
            date: new Date(p.created_at || Date.now()).toLocaleDateString(),
            reason: "Nuovo paziente",
          }));

          setRecentPatients(recentPatientsList);
        } else {
          // Fallback a dati di esempio se non ci sono pazienti
          setRecentPatients([
            {
              id: "1",
              name: "Maria Rossi",
              date: "10/05/2023",
              reason: "Visita di controllo",
            },
            {
              id: "2",
              name: "Giuseppe Verdi",
              date: "15/05/2023",
              reason: "Consulto",
            },
            {
              id: "3",
              name: "Francesca Bianchi",
              date: "18/05/2023",
              reason: "Procedura medica",
            },
          ]);
        }

        // Carica gli appuntamenti
        const { AppointmentModel } = await import("@/models/appointment");
        const appointmentModel = new AppointmentModel();

        // Appuntamenti di oggi
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayAppointmentsResult =
          await appointmentModel.findByDate(today);

        if (todayAppointmentsResult && todayAppointmentsResult.length > 0) {
          const formattedTodayAppointments = todayAppointmentsResult.map(
            (a) => ({
              id: a.id.toString(),
              patientName: a.patient_name || "Paziente",
              time: a.time.substring(0, 5), // Formato HH:MM
              type: a.appointment_type,
            }),
          );

          // Ordina per orario
          formattedTodayAppointments.sort((a, b) =>
            a.time.localeCompare(b.time),
          );

          setTodayAppointments(formattedTodayAppointments);
        } else {
          // Fallback a dati di esempio se non ci sono appuntamenti oggi
          setTodayAppointments([]);
        }

        // Prossimi appuntamenti (escluso oggi)
        const upcomingAppointmentsResult =
          await appointmentModel.findUpcoming(6);

        if (
          upcomingAppointmentsResult &&
          upcomingAppointmentsResult.length > 0
        ) {
          // Filtra per escludere gli appuntamenti di oggi
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);

          const futureAppointments = upcomingAppointmentsResult.filter((a) => {
            const appointmentDate = new Date(a.date);
            return appointmentDate >= tomorrow;
          });

          const formattedUpcomingAppointments = futureAppointments
            .slice(0, 3)
            .map((a) => ({
              id: a.id.toString(),
              patientName: a.patient_name || "Paziente",
              date: new Date(a.date).toLocaleDateString(),
              time: a.time.substring(0, 5), // Formato HH:MM
              type: a.appointment_type,
            }));

          setUpcomingAppointments(formattedUpcomingAppointments);
        } else {
          // Fallback a dati di esempio se non ci sono appuntamenti futuri
          setUpcomingAppointments([]);
        }
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
        // Fallback a dati di esempio in caso di errore
        setRecentPatients([
          {
            id: "1",
            name: "Maria Rossi",
            date: "10/05/2023",
            reason: "Visita di controllo",
          },
          {
            id: "2",
            name: "Giuseppe Verdi",
            date: "15/05/2023",
            reason: "Consulto",
          },
          {
            id: "3",
            name: "Francesca Bianchi",
            date: "18/05/2023",
            reason: "Procedura medica",
          },
        ]);

        setTodayAppointments([
          {
            id: "1",
            patientName: "Lucia Ferrari",
            time: "10:00",
            type: "Visita di controllo",
          },
          {
            id: "2",
            patientName: "Roberto Esposito",
            time: "11:30",
            type: "Consulto",
          },
        ]);

        setUpcomingAppointments([
          {
            id: "1",
            patientName: "Marco Rossi",
            date: "15/06/2023",
            time: "09:30",
            type: "Visita di controllo",
          },
          {
            id: "2",
            patientName: "Giulia Bianchi",
            date: "16/06/2023",
            time: "11:00",
            type: "Consulto",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="p-6 bg-white h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate("/calendar")}
            className="flex items-center"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Calendario
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/patients")}
            className="flex items-center"
          >
            <Users className="mr-2 h-4 w-4" />
            Pazienti
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/notifications")}
            className="flex items-center"
          >
            <Bell className="mr-2 h-4 w-4" />
            Notifiche
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Appuntamenti di Oggi */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              Appuntamenti di Oggi
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/calendar")}
            >
              Vedi tutti
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">
                <div className="spinner mx-auto"></div>
                <p className="mt-2 text-muted-foreground">
                  Caricamento appuntamenti...
                </p>
              </div>
            ) : todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{appointment.time}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                        onClick={async () => {
                          try {
                            // Carica i dettagli dell'appuntamento
                            const { AppointmentModel } = await import(
                              "@/models/appointment"
                            );
                            const appointmentModel = new AppointmentModel();
                            const appointmentDetails =
                              await appointmentModel.findById(
                                parseInt(appointment.id),
                              );

                            if (!appointmentDetails) {
                              alert(
                                "Impossibile trovare i dettagli dell'appuntamento.",
                              );
                              return;
                            }

                            // Mostra i dettagli in un modale
                            const modal = document.createElement("div");
                            modal.className =
                              "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                            modal.innerHTML = `
                              <div class="bg-white rounded-lg p-6 w-full max-w-lg">
                                <h3 class="text-xl font-medium mb-4">Dettagli Appuntamento</h3>
                                
                                <div class="space-y-4">
                                  <div class="grid grid-cols-2 gap-4">
                                    <div>
                                      <p class="text-sm font-medium text-gray-500">Paziente</p>
                                      <p class="font-medium">${appointmentDetails.patient_name || appointment.patientName}</p>
                                    </div>
                                    <div>
                                      <p class="text-sm font-medium text-gray-500">Data e Ora</p>
                                      <p class="font-medium">${new Date(appointmentDetails.date).toLocaleDateString()} ${appointmentDetails.time}</p>
                                    </div>
                                  </div>
                                  
                                  <div class="grid grid-cols-2 gap-4">
                                    <div>
                                      <p class="text-sm font-medium text-gray-500">Tipo</p>
                                      <p class="font-medium">${appointmentDetails.appointment_type}</p>
                                    </div>
                                    <div>
                                      <p class="text-sm font-medium text-gray-500">Durata</p>
                                      <p class="font-medium">${appointmentDetails.duration} minuti</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p class="text-sm font-medium text-gray-500">Note</p>
                                    <p class="mt-1 p-2 bg-gray-50 rounded">${appointmentDetails.notes || "Nessuna nota"}</p>
                                  </div>
                                  
                                  <div class="grid grid-cols-2 gap-4">
                                    <div>
                                      <p class="text-sm font-medium text-gray-500">Sincronizzato con Google Calendar</p>
                                      <p class="font-medium">${appointmentDetails.google_calendar_synced ? "Sì" : "No"}</p>
                                    </div>
                                    <div>
                                      <p class="text-sm font-medium text-gray-500">Notifica WhatsApp inviata</p>
                                      <p class="font-medium">${appointmentDetails.whatsapp_notification_sent ? "Sì" : "No"}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div class="flex justify-between mt-6">
                                  <div>
                                    <button id="edit-appointment" class="px-4 py-2 bg-blue-600 text-white rounded-md mr-2">Modifica</button>
                                    <button id="delete-appointment" class="px-4 py-2 bg-red-600 text-white rounded-md">Elimina</button>
                                  </div>
                                  <button id="close-modal" class="px-4 py-2 border border-gray-300 rounded-md">Chiudi</button>
                                </div>
                              </div>
                            `;
                            document.body.appendChild(modal);

                            // Gestisci la chiusura del modale
                            document
                              .getElementById("close-modal")
                              .addEventListener("click", () => {
                                document.body.removeChild(modal);
                              });

                            // Gestisci la modifica dell'appuntamento
                            document
                              .getElementById("edit-appointment")
                              .addEventListener("click", () => {
                                document.body.removeChild(modal);
                                // Apri il form di modifica dell'appuntamento
                                const dialog = document.createElement("div");
                                dialog.className =
                                  "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                                dialog.innerHTML = `<div id="appointment-form-container" class="bg-white rounded-lg p-6 w-full max-w-2xl"></div>`;
                                document.body.appendChild(dialog);

                                // Renderizza il form di modifica
                                const {
                                  createRoot,
                                } = require("react-dom/client");
                                const AppointmentForm =
                                  require("@/components/appointments/AppointmentForm").default;
                                const root = createRoot(
                                  document.getElementById(
                                    "appointment-form-container",
                                  ),
                                );
                                root.render(
                                  React.createElement(AppointmentForm, {
                                    appointment: appointmentDetails,
                                    isEditing: true,
                                    onClose: () => {
                                      document.body.removeChild(dialog);
                                      window.location.reload();
                                    },
                                  }),
                                );
                              });

                            // Gestisci l'eliminazione dell'appuntamento
                            document
                              .getElementById("delete-appointment")
                              .addEventListener("click", async () => {
                                if (
                                  confirm(
                                    "Sei sicuro di voler eliminare questo appuntamento?",
                                  )
                                ) {
                                  try {
                                    const result =
                                      await appointmentModel.delete(
                                        parseInt(appointment.id),
                                      );
                                    if (result) {
                                      alert(
                                        "Appuntamento eliminato con successo!",
                                      );
                                      document.body.removeChild(modal);
                                      window.location.reload();
                                    } else {
                                      alert(
                                        "Impossibile eliminare l'appuntamento.",
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Errore durante l'eliminazione dell'appuntamento:",
                                      error,
                                    );
                                    alert(
                                      `Si è verificato un errore durante l'eliminazione: ${error.message || "Errore sconosciuto"}`,
                                    );
                                  }
                                }
                              });
                          } catch (error) {
                            console.error(
                              "Errore durante il caricamento dei dettagli dell'appuntamento:",
                              error,
                            );
                            alert(
                              `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                            );
                          }
                        }}
                      >
                        Dettagli
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  Nessun appuntamento per oggi
                </p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => navigate("/calendar")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi Appuntamento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ultimi Pazienti Inseriti */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              Ultimi Pazienti Inseriti
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/patients")}
            >
              Vedi tutti
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">
                <div className="spinner mx-auto"></div>
                <p className="mt-2 text-muted-foreground">
                  Caricamento pazienti...
                </p>
              </div>
            ) : recentPatients.length > 0 ? (
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.reason}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {patient.date}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-800 p-0 h-auto"
                        onClick={() => {
                          // Implementare la visualizzazione dei dettagli del paziente
                          navigate(`/patients/${patient.id}`);
                        }}
                      >
                        Dettagli
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">Nessun paziente recente</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => navigate("/patients/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi Paziente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prossimi Appuntamenti */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              Prossimi Appuntamenti
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/calendar")}
            >
              Vedi tutti
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">
                <div className="spinner mx-auto"></div>
                <p className="mt-2 text-muted-foreground">
                  Caricamento appuntamenti futuri...
                </p>
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center mb-2">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <p className="text-sm font-medium">
                          {appointment.date}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.time}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={async () => {
                          try {
                            // Carica i dettagli dell'appuntamento
                            const { AppointmentModel } = await import(
                              "@/models/appointment"
                            );
                            const appointmentModel = new AppointmentModel();
                            const appointmentDetails =
                              await appointmentModel.findById(
                                parseInt(appointment.id),
                              );

                            if (!appointmentDetails) {
                              alert(
                                "Impossibile trovare i dettagli dell'appuntamento.",
                              );
                              return;
                            }

                            // Mostra i dettagli in un modale
                            const modal = document.createElement("div");
                            modal.className =
                              "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                            modal.innerHTML = `
                              <div class="bg-white rounded-lg p-6 w-full max-w-lg">
                                <h3 class="text-xl font-medium mb-4">Dettagli Appuntamento</h3>
                                
                                <div class="space-y-4">
                                  <div class="grid grid-cols-2 gap-4">
                                    <div>
                                      <p class="text-sm font-medium text-gray-500">Paziente</p>
                                      <p class="font-medium">${appointmentDetails.patient_name || appointment.patientName}</p>
                                    </div>
                                    <div>
                                      <p class="text-sm font-medium text-gray-500">Data e Ora</p>
                                      <p class="font-medium">${new Date(appointmentDetails.date).toLocaleDateString()} ${appointmentDetails.time}</p>
                                    </div>
                                  </div>
                                  
                                  <div class="grid grid-cols-2 gap-4">
                                    <div>
                                      <p class="text-sm font-medium text-gray-500">Tipo</p>
                                      <p class="font-medium">${appointmentDetails.appointment_type}</p>
                                    </div>
                                    <div>
                                      <p class="text-sm font-medium text-gray-500">Durata</p>
                                      <p class="font-medium">${appointmentDetails.duration} minuti</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p class="text-sm font-medium text-gray-500">Note</p>
                                    <p class="mt-1 p-2 bg-gray-50 rounded">${appointmentDetails.notes || "Nessuna nota"}</p>
                                  </div>
                                  
                                  <div class="grid grid-cols-2 gap-4">
                                    <div>
                                      <p class="text-sm font-medium text-gray-500">Sincronizzato con Google Calendar</p>
                                      <p class="font-medium">${appointmentDetails.google_calendar_synced ? "Sì" : "No"}</p>
                                    </div>
                                    <div>
                                      <p class="text-sm font-medium text-gray-500">Notifica WhatsApp inviata</p>
                                      <p class="font-medium">${appointmentDetails.whatsapp_notification_sent ? "Sì" : "No"}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div class="flex justify-between mt-6">
                                  <div>
                                    <button id="edit-appointment" class="px-4 py-2 bg-blue-600 text-white rounded-md mr-2">Modifica</button>
                                    <button id="delete-appointment" class="px-4 py-2 bg-red-600 text-white rounded-md">Elimina</button>
                                  </div>
                                  <button id="close-modal" class="px-4 py-2 border border-gray-300 rounded-md">Chiudi</button>
                                </div>
                              </div>
                            `;
                            document.body.appendChild(modal);

                            // Gestisci la chiusura del modale
                            document
                              .getElementById("close-modal")
                              .addEventListener("click", () => {
                                document.body.removeChild(modal);
                              });

                            // Gestisci la modifica dell'appuntamento
                            document
                              .getElementById("edit-appointment")
                              .addEventListener("click", () => {
                                document.body.removeChild(modal);
                                // Apri il form di modifica dell'appuntamento
                                const dialog = document.createElement("div");
                                dialog.className =
                                  "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                                dialog.innerHTML = `<div id="appointment-form-container" class="bg-white rounded-lg p-6 w-full max-w-2xl"></div>`;
                                document.body.appendChild(dialog);

                                // Renderizza il form di modifica
                                const {
                                  createRoot,
                                } = require("react-dom/client");
                                const AppointmentForm =
                                  require("@/components/appointments/AppointmentForm").default;
                                const root = createRoot(
                                  document.getElementById(
                                    "appointment-form-container",
                                  ),
                                );
                                root.render(
                                  React.createElement(AppointmentForm, {
                                    appointment: appointmentDetails,
                                    isEditing: true,
                                    onClose: () => {
                                      document.body.removeChild(dialog);
                                      window.location.reload();
                                    },
                                  }),
                                );
                              });

                            // Gestisci l'eliminazione dell'appuntamento
                            document
                              .getElementById("delete-appointment")
                              .addEventListener("click", async () => {
                                if (
                                  confirm(
                                    "Sei sicuro di voler eliminare questo appuntamento?",
                                  )
                                ) {
                                  try {
                                    const result =
                                      await appointmentModel.delete(
                                        parseInt(appointment.id),
                                      );
                                    if (result) {
                                      alert(
                                        "Appuntamento eliminato con successo!",
                                      );
                                      document.body.removeChild(modal);
                                      window.location.reload();
                                    } else {
                                      alert(
                                        "Impossibile eliminare l'appuntamento.",
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Errore durante l'eliminazione dell'appuntamento:",
                                      error,
                                    );
                                    alert(
                                      `Si è verificato un errore durante l'eliminazione: ${error.message || "Errore sconosciuto"}`,
                                    );
                                  }
                                }
                              });
                          } catch (error) {
                            console.error(
                              "Errore durante il caricamento dei dettagli dell'appuntamento:",
                              error,
                            );
                            alert(
                              `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                            );
                          }
                        }}
                      >
                        Dettagli
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  Nessun appuntamento programmato
                </p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => navigate("/calendar")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi Appuntamento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
