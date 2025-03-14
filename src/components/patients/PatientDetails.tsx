import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Calendar,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  User,
} from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  time: string;
  type: string;
  status: "completed" | "upcoming" | "cancelled";
  notes?: string;
}

interface MedicalRecord {
  id: string;
  date: string;
  title: string;
  doctor: string;
  description: string;
}

interface Communication {
  id: string;
  date: string;
  type: "whatsapp" | "email" | "phone";
  message: string;
  status: "sent" | "failed" | "pending";
}

interface PatientDetailsProps {
  patient?: {
    id: string;
    name: string;
    codiceFiscale: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    address: string;
    profileImage?: string;
  };
  appointments?: Appointment[];
  medicalRecords?: MedicalRecord[];
  communications?: Communication[];
}

const PatientDetails = (props: PatientDetailsProps) => {
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const loadPatientData = async () => {
      setIsLoading(true);
      try {
        // Load patient details
        const { PatientModel } = await import("@/models/patient");
        const patientModel = new PatientModel();
        const patientData = await patientModel.findById(parseInt(id || "0"));

        if (patientData) {
          // Format patient data
          const formattedPatient = {
            id: patientData.id.toString(),
            name: patientData.name,
            codiceFiscale: patientData.codice_fiscale,
            dateOfBirth: patientData.date_of_birth,
            gender: patientData.gender,
            email: patientData.email || "",
            phone: patientData.phone,
            address:
              `${patientData.address || ""}, ${patientData.city || ""} ${patientData.postal_code || ""}`.trim(),
            profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(patientData.name)}`,
          };
          setPatient(formattedPatient);

          // Load patient appointments
          const { AppointmentModel } = await import("@/models/appointment");
          const appointmentModel = new AppointmentModel();
          const patientAppointments = await appointmentModel.findByPatientId(
            parseInt(id || "0"),
          );

          if (patientAppointments && patientAppointments.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const formattedAppointments = patientAppointments.map((app) => {
              const appDate = new Date(app.date);
              let status: "completed" | "upcoming" | "cancelled" = "upcoming";

              if (appDate < today) {
                status = "completed";
              }

              return {
                id: app.id!.toString(),
                date: app.date.toString(),
                time: app.time.substring(0, 5),
                type: app.appointment_type,
                status,
                notes: app.notes,
              };
            });

            setAppointments(formattedAppointments);
          } else {
            setAppointments([]);
          }

          // For medical records and communications, we'll use mock data for now
          // as these features might be implemented in future versions
          setMedicalRecords([
            {
              id: "rec1",
              date: "2023-06-15",
              title: "Annual Check-up Results",
              doctor: "Dr. Bianchi",
              description: "All tests normal. Recommended annual follow-up.",
            },
            {
              id: "rec2",
              date: "2023-09-22",
              title: "Blood Test Results",
              doctor: "Dr. Verdi",
              description:
                "Cholesterol slightly elevated. Dietary changes recommended.",
            },
          ]);

          setCommunications([
            {
              id: "comm1",
              date: "2023-12-20",
              type: "whatsapp",
              message:
                "Reminder for your appointment on January 10th at 11:15.",
              status: "sent",
            },
            {
              id: "comm2",
              date: "2023-12-25",
              type: "email",
              message:
                "Happy Holidays from our clinic! Our holiday hours are...",
              status: "sent",
            },
            {
              id: "comm3",
              date: "2024-01-05",
              type: "whatsapp",
              message: "Your appointment is in 5 days. Please confirm.",
              status: "pending",
            },
          ]);
        } else {
          // If patient not found, use default values
          setPatient({
            id: id || "0",
            name: "Paziente non trovato",
            codiceFiscale: "",
            dateOfBirth: new Date().toISOString(),
            gender: "",
            email: "",
            phone: "",
            address: "",
            profileImage:
              "https://api.dicebear.com/7.x/avataaars/svg?seed=NotFound",
          });
          setAppointments([]);
        }
      } catch (error) {
        console.error("Error loading patient data:", error);
        // Use default values if there's an error
        setPatient({
          id: id || "0",
          name: "Errore nel caricamento",
          codiceFiscale: "",
          dateOfBirth: new Date().toISOString(),
          gender: "",
          email: "",
          phone: "",
          address: "",
          profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Error",
        });
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatientData();
  }, [id]);
  if (isLoading) {
    return (
      <div className="w-full h-full bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Caricamento dati paziente...
          </p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="w-full h-full bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Paziente non trovato</h2>
          <p className="text-muted-foreground">
            Il paziente richiesto non è stato trovato nel database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-background p-6">
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Patient Profile Card */}
        <Card className="w-full md:w-1/3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Profilo Paziente</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Naviga alla pagina di modifica del paziente
                  window.location.href = `/patients/${patient.id}/edit`;
                }}
              >
                <User className="h-4 w-4 mr-2" />
                Modifica
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-24 w-24 mb-2">
                <AvatarImage src={patient.profileImage} alt={patient.name} />
                <AvatarFallback>
                  {patient.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{patient.name}</h3>
              <Badge variant="outline" className="mt-1">
                {patient.codiceFiscale}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">
                  Nato il: {new Date(patient.dateOfBirth).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">
                  Genere:{" "}
                  {patient.gender === "male"
                    ? "Maschio"
                    : patient.gender === "female"
                      ? "Femmina"
                      : patient.gender}
                </span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{patient.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{patient.phone}</span>
              </div>
              <div className="flex items-start">
                <User className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                <span className="text-sm">{patient.address}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={async () => {
                try {
                  // Apri il form per un nuovo appuntamento
                  const dialog = document.createElement("div");
                  dialog.className =
                    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                  dialog.innerHTML = `<div id="appointment-form-container" class="bg-white rounded-lg p-6 w-full max-w-2xl"></div>`;
                  document.body.appendChild(dialog);

                  // Carica i dettagli del paziente
                  const { PatientModel } = await import("@/models/patient");
                  const patientModel = new PatientModel();
                  const patientDetails = await patientModel.findById(
                    parseInt(patient.id),
                  );

                  if (!patientDetails) {
                    alert("Impossibile trovare i dettagli del paziente.");
                    document.body.removeChild(dialog);
                    return;
                  }

                  // Renderizza il form per un nuovo appuntamento
                  const { createRoot } = await import("react-dom/client");
                  const AppointmentForm = (
                    await import("@/components/appointments/AppointmentForm")
                  ).default;
                  const root = createRoot(
                    document.getElementById("appointment-form-container"),
                  );
                  root.render(
                    React.createElement(AppointmentForm, {
                      initialData: {
                        patientId: patient.id,
                        date: new Date(),
                        time: "09:00",
                        duration: "30",
                        appointmentType: "checkup",
                        notes: "",
                        sendWhatsAppNotification: true,
                        googleCalendarSync: true,
                      },
                      onClose: () => {
                        document.body.removeChild(dialog);
                        window.location.reload();
                      },
                    }),
                  );
                } catch (error) {
                  console.error(
                    "Errore durante l'apertura del form per un nuovo appuntamento:",
                    error,
                  );
                  alert(
                    `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                  );
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Appuntamento
            </Button>
          </CardFooter>
        </Card>

        {/* Tabs Section */}
        <div className="w-full md:w-2/3">
          <Tabs defaultValue="appointments" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appointments">Appuntamenti</TabsTrigger>
              <TabsTrigger value="medical-records">
                Cartella Clinica
              </TabsTrigger>
              <TabsTrigger value="communications">Comunicazioni</TabsTrigger>
            </TabsList>

            {/* Appointments Tab */}
            <TabsContent value="appointments" className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Storico Appuntamenti</h3>
                <Button
                  onClick={async () => {
                    try {
                      // Apri il form per un nuovo appuntamento
                      const dialog = document.createElement("div");
                      dialog.className =
                        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                      dialog.innerHTML = `<div id="appointment-form-container" class="bg-white rounded-lg p-6 w-full max-w-2xl"></div>`;
                      document.body.appendChild(dialog);

                      // Carica i dettagli del paziente
                      const { PatientModel } = await import("@/models/patient");
                      const patientModel = new PatientModel();
                      const patientDetails = await patientModel.findById(
                        parseInt(patient.id),
                      );

                      if (!patientDetails) {
                        alert("Impossibile trovare i dettagli del paziente.");
                        document.body.removeChild(dialog);
                        return;
                      }

                      // Renderizza il form per un nuovo appuntamento
                      const { createRoot } = await import("react-dom/client");
                      const AppointmentForm = (
                        await import(
                          "@/components/appointments/AppointmentForm"
                        )
                      ).default;
                      const root = createRoot(
                        document.getElementById("appointment-form-container"),
                      );
                      root.render(
                        React.createElement(AppointmentForm, {
                          initialData: {
                            patientId: patient.id,
                            date: new Date(),
                            time: "09:00",
                            duration: "30",
                            appointmentType: "checkup",
                            notes: "",
                            sendWhatsAppNotification: true,
                            googleCalendarSync: true,
                          },
                          onClose: () => {
                            document.body.removeChild(dialog);
                            window.location.reload();
                          },
                        }),
                      );
                    } catch (error) {
                      console.error(
                        "Errore durante l'apertura del form per un nuovo appuntamento:",
                        error,
                      );
                      alert(
                        `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                      );
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Appuntamento
                </Button>
              </div>

              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          {appointment.type}
                        </CardTitle>
                        <Badge
                          variant={
                            appointment.status === "completed"
                              ? "secondary"
                              : appointment.status === "upcoming"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(appointment.date).toLocaleDateString()}
                          <Clock className="h-4 w-4 ml-3 mr-1" />
                          {appointment.time}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    {appointment.notes && (
                      <CardContent>
                        <p className="text-sm">{appointment.notes}</p>
                      </CardContent>
                    )}
                    <CardFooter className="pt-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
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

                              // Apri il form di modifica dell'appuntamento
                              const dialog = document.createElement("div");
                              dialog.className =
                                "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                              dialog.innerHTML = `<div id="appointment-form-container" class="bg-white rounded-lg p-6 w-full max-w-2xl"></div>`;
                              document.body.appendChild(dialog);

                              // Renderizza il form di modifica
                              const { createRoot } = await import(
                                "react-dom/client"
                              );
                              const AppointmentForm = (
                                await import(
                                  "@/components/appointments/AppointmentForm"
                                )
                              ).default;
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
                          Modifica
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (
                              confirm(
                                "Sei sicuro di voler eliminare questo appuntamento?",
                              )
                            ) {
                              try {
                                const { AppointmentModel } = await import(
                                  "@/models/appointment"
                                );
                                const appointmentModel = new AppointmentModel();
                                const result = await appointmentModel.delete(
                                  parseInt(appointment.id),
                                );
                                if (result) {
                                  alert("Appuntamento eliminato con successo!");
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
                          }}
                        >
                          Elimina
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Medical Records Tab */}
            <TabsContent
              value="medical-records"
              className="border rounded-md p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Cartella Clinica</h3>
                <Button
                  onClick={async () => {
                    try {
                      // Apri il form per aggiungere un nuovo documento
                      const dialog = document.createElement("div");
                      dialog.className =
                        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                      dialog.innerHTML = `<div id="medical-record-form-container" class="bg-white rounded-lg p-6 w-full max-w-2xl"></div>`;
                      document.body.appendChild(dialog);

                      // Crea il form per il nuovo documento
                      const formContent = `
                      <div class="space-y-4">
                        <h2 class="text-xl font-bold">Aggiungi Documento Medico</h2>
                        <div class="space-y-2">
                          <label class="text-sm font-medium">Titolo</label>
                          <input id="doc-title" type="text" class="w-full p-2 border rounded-md" placeholder="Titolo del documento" />
                        </div>
                        <div class="space-y-2">
                          <label class="text-sm font-medium">Data</label>
                          <input id="doc-date" type="date" class="w-full p-2 border rounded-md" value="${new Date().toISOString().split("T")[0]}" />
                        </div>
                        <div class="space-y-2">
                          <label class="text-sm font-medium">Medico</label>
                          <input id="doc-doctor" type="text" class="w-full p-2 border rounded-md" placeholder="Nome del medico" />
                        </div>
                        <div class="space-y-2">
                          <label class="text-sm font-medium">Descrizione</label>
                          <textarea id="doc-description" class="w-full p-2 border rounded-md h-32" placeholder="Descrizione o note"></textarea>
                        </div>
                        <div class="space-y-2">
                          <label class="text-sm font-medium">File (opzionale)</label>
                          <input id="doc-file" type="file" class="w-full p-2 border rounded-md" />
                        </div>
                        <div class="flex justify-end space-x-2 pt-4">
                          <button id="cancel-doc" class="px-4 py-2 border border-gray-300 rounded-md">Annulla</button>
                          <button id="save-doc" class="px-4 py-2 bg-blue-600 text-white rounded-md">Salva Documento</button>
                        </div>
                      </div>
                    `;

                      const formContainer = document.getElementById(
                        "medical-record-form-container",
                      );
                      if (formContainer) {
                        formContainer.innerHTML = formContent;
                      }

                      // Gestisci la chiusura del form
                      document
                        .getElementById("cancel-doc")
                        ?.addEventListener("click", () => {
                          document.body.removeChild(dialog);
                        });

                      // Gestisci il salvataggio del documento
                      document
                        .getElementById("save-doc")
                        ?.addEventListener("click", async () => {
                          const title = (
                            document.getElementById(
                              "doc-title",
                            ) as HTMLInputElement
                          )?.value;
                          const date = (
                            document.getElementById(
                              "doc-date",
                            ) as HTMLInputElement
                          )?.value;
                          const doctor = (
                            document.getElementById(
                              "doc-doctor",
                            ) as HTMLInputElement
                          )?.value;
                          const description = (
                            document.getElementById(
                              "doc-description",
                            ) as HTMLTextAreaElement
                          )?.value;

                          if (!title || !date || !doctor || !description) {
                            alert("Compila tutti i campi obbligatori");
                            return;
                          }

                          try {
                            // In un'implementazione reale, qui salveremmo il documento nel database
                            // Per ora, aggiungiamo il documento alla lista locale
                            const newRecord = {
                              id: `rec${Date.now()}`,
                              date,
                              title,
                              doctor,
                              description,
                            };

                            setMedicalRecords([newRecord, ...medicalRecords]);

                            // Chiudi il form
                            document.body.removeChild(dialog);

                            // Mostra un messaggio di successo
                            alert("Documento aggiunto con successo!");
                          } catch (error) {
                            console.error(
                              "Errore durante il salvataggio del documento:",
                              error,
                            );
                            alert(
                              `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                            );
                          }
                        });
                    } catch (error) {
                      console.error(
                        "Errore durante l'apertura del form per un nuovo documento:",
                        error,
                      );
                      alert(
                        `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                      );
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Documento
                </Button>
              </div>

              <div className="space-y-4">
                {medicalRecords.map((record) => (
                  <Card key={record.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          {record.title}
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {record.doctor}
                        </span>
                      </div>
                      <CardDescription>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{record.description}</p>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Visualizza Documento
                        </Button>
                        <Button variant="outline" size="sm">
                          Modifica
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Communications Tab */}
            <TabsContent
              value="communications"
              className="border rounded-md p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Storico Comunicazioni</h3>
                <Button
                  onClick={async () => {
                    try {
                      // Apri il form per inviare un nuovo messaggio
                      const dialog = document.createElement("div");
                      dialog.className =
                        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                      dialog.innerHTML = `<div id="message-form-container" class="bg-white rounded-lg p-6 w-full max-w-2xl"></div>`;
                      document.body.appendChild(dialog);

                      // Crea il form per il nuovo messaggio
                      const formContent = `
                      <div class="space-y-4">
                        <h2 class="text-xl font-bold">Invia Messaggio</h2>
                        <div class="space-y-2">
                          <label class="text-sm font-medium">Tipo di Comunicazione</label>
                          <select id="msg-type" class="w-full p-2 border rounded-md">
                            <option value="whatsapp">WhatsApp</option>
                            <option value="email">Email</option>
                            <option value="phone">Telefonata</option>
                          </select>
                        </div>
                        <div class="space-y-2">
                          <label class="text-sm font-medium">Destinatario</label>
                          <input id="msg-recipient" type="text" class="w-full p-2 border rounded-md" value="${patient?.phone || ""}" readonly />
                          <p class="text-xs text-gray-500">Numero di telefono del paziente</p>
                        </div>
                        <div class="space-y-2">
                          <label class="text-sm font-medium">Messaggio</label>
                          <textarea id="msg-content" class="w-full p-2 border rounded-md h-32" placeholder="Scrivi il tuo messaggio qui"></textarea>
                        </div>
                        <div class="flex justify-end space-x-2 pt-4">
                          <button id="cancel-msg" class="px-4 py-2 border border-gray-300 rounded-md">Annulla</button>
                          <button id="send-msg" class="px-4 py-2 bg-blue-600 text-white rounded-md">Invia Messaggio</button>
                        </div>
                      </div>
                    `;

                      const formContainer = document.getElementById(
                        "message-form-container",
                      );
                      if (formContainer) {
                        formContainer.innerHTML = formContent;
                      }

                      // Gestisci la chiusura del form
                      document
                        .getElementById("cancel-msg")
                        ?.addEventListener("click", () => {
                          document.body.removeChild(dialog);
                        });

                      // Gestisci l'invio del messaggio
                      document
                        .getElementById("send-msg")
                        ?.addEventListener("click", async () => {
                          const type = (
                            document.getElementById(
                              "msg-type",
                            ) as HTMLSelectElement
                          )?.value as "whatsapp" | "email" | "phone";
                          const recipient = (
                            document.getElementById(
                              "msg-recipient",
                            ) as HTMLInputElement
                          )?.value;
                          const content = (
                            document.getElementById(
                              "msg-content",
                            ) as HTMLTextAreaElement
                          )?.value;

                          if (!type || !recipient || !content) {
                            alert("Compila tutti i campi obbligatori");
                            return;
                          }

                          try {
                            // In un'implementazione reale, qui invieremmo il messaggio tramite il servizio appropriato
                            if (type === "whatsapp") {
                              // Invia messaggio WhatsApp
                              const { WhatsAppService } = await import(
                                "@/services/whatsapp.service"
                              );
                              const whatsAppService =
                                WhatsAppService.getInstance();

                              // Verifica se il servizio è abilitato e autenticato
                              const isEnabled =
                                await whatsAppService.isServiceEnabled();
                              const isAuthenticated =
                                await whatsAppService.isServiceAuthenticated();

                              if (!isEnabled || !isAuthenticated) {
                                throw new Error(
                                  "Il servizio WhatsApp non è abilitato o autenticato. Verifica le impostazioni.",
                                );
                              }

                              // Crea un oggetto appuntamento fittizio per la funzione sendNotification
                              const dummyAppointment = {
                                id: 0,
                                patient_id: parseInt(patient?.id || "0"),
                                date: new Date(),
                                time: "00:00",
                                duration: 0,
                                appointment_type: "custom",
                                notes: "",
                              };

                              // Invia il messaggio
                              await whatsAppService.sendNotification(
                                dummyAppointment,
                                recipient,
                                content,
                                "custom",
                              );
                            } else if (type === "email") {
                              // Simulazione invio email
                              console.log(
                                `Invio email a ${recipient}: ${content}`,
                              );
                            } else if (type === "phone") {
                              // Simulazione registrazione telefonata
                              console.log(
                                `Registrazione telefonata a ${recipient}: ${content}`,
                              );
                            }

                            // Aggiungi la comunicazione alla lista locale
                            const newCommunication = {
                              id: `comm${Date.now()}`,
                              date: new Date().toISOString(),
                              type,
                              message: content,
                              status: "sent",
                            };

                            setCommunications([
                              newCommunication,
                              ...communications,
                            ]);

                            // Chiudi il form
                            document.body.removeChild(dialog);

                            // Mostra un messaggio di successo
                            alert("Messaggio inviato con successo!");
                          } catch (error) {
                            console.error(
                              "Errore durante l'invio del messaggio:",
                              error,
                            );
                            alert(
                              `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                            );
                          }
                        });
                    } catch (error) {
                      console.error(
                        "Errore durante l'apertura del form per un nuovo messaggio:",
                        error,
                      );
                      alert(
                        `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                      );
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Invia Messaggio
                </Button>
              </div>

              <div className="space-y-4">
                {communications.map((comm) => (
                  <Card key={comm.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          {comm.type === "whatsapp" && (
                            <MessageSquare className="h-4 w-4 mr-2 text-green-500" />
                          )}
                          {comm.type === "email" && (
                            <Mail className="h-4 w-4 mr-2 text-blue-500" />
                          )}
                          {comm.type === "phone" && (
                            <Phone className="h-4 w-4 mr-2 text-orange-500" />
                          )}
                          <CardTitle className="text-base capitalize">
                            {comm.type === "whatsapp"
                              ? "WhatsApp"
                              : comm.type === "email"
                                ? "Email"
                                : "Telefono"}
                          </CardTitle>
                        </div>
                        <Badge
                          variant={
                            comm.status === "sent"
                              ? "secondary"
                              : comm.status === "pending"
                                ? "outline"
                                : "destructive"
                          }
                        >
                          {comm.status === "sent"
                            ? "Inviato"
                            : comm.status === "pending"
                              ? "In attesa"
                              : "Fallito"}
                        </Badge>
                      </div>
                      <CardDescription>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(comm.date).toLocaleDateString()}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{comm.message}</p>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Reinvia
                        </Button>
                        <Button variant="outline" size="sm">
                          Dettagli
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
