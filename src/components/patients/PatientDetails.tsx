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
  files?: string[];
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

          // Load medical records from database
          try {
            const { MedicalRecordModel } = await import(
              "@/models/medicalRecord"
            );
            const medicalRecordModel = new MedicalRecordModel();
            const patientRecords = await medicalRecordModel.findByPatientId(
              parseInt(id || "0"),
            );

            if (patientRecords && patientRecords.length > 0) {
              const formattedRecords = patientRecords.map((record) => ({
                id: record.id?.toString() || "",
                date: record.date
                  ? new Date(record.date).toISOString().split("T")[0]
                  : "",
                title: record.title || "",
                doctor: record.doctor || "",
                description: record.description || "",
                files: record.files || [],
              }));
              setMedicalRecords(formattedRecords);
            } else {
              setMedicalRecords([]);
            }
          } catch (recordsError) {
            console.error("Error loading medical records:", recordsError);
            setMedicalRecords([]);
          }

          // Load communications from database (notifications)
          try {
            const { NotificationModel } = await import("@/models/notification");
            const notificationModel = new NotificationModel();
            const patientNotifications =
              await notificationModel.findByPatientId(parseInt(id || "0"));

            if (patientNotifications && patientNotifications.length > 0) {
              const formattedCommunications = patientNotifications.map(
                (notification) => ({
                  id: notification.id?.toString() || "",
                  date: notification.created_at
                    ? new Date(notification.created_at).toISOString()
                    : new Date().toISOString(),
                  type: "whatsapp", // Assuming all notifications are WhatsApp for now
                  message: notification.message || "",
                  status: notification.status || "sent",
                }),
              );
              setCommunications(formattedCommunications);
            } else {
              setCommunications([]);
            }
          } catch (notificationsError) {
            console.error("Error loading communications:", notificationsError);
            setCommunications([]);
          }
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
          <div className="mt-4 text-muted-foreground">
            Caricamento dati paziente...
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="w-full h-full bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Paziente non trovato</h2>
          <div className="text-muted-foreground">
            Il paziente richiesto non è stato trovato nel database.
          </div>
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
                <div className="text-sm">{patient.address}</div>
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
                          <input id="doc-file" type="file" class="w-full p-2 border rounded-md" multiple />
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
                            // Ottieni i file selezionati
                            const fileInput = document.getElementById(
                              "doc-file",
                            ) as HTMLInputElement;
                            const files = fileInput?.files;

                            try {
                              // Assicurati che la directory esista
                              const { createDirectoryIfNotExists } =
                                await import("@/utils/fileUtils");

                              // Create patient directory
                              const documentsPath =
                                localStorage.getItem("documentsPath") ||
                                "C:\\ProgramData\\PatientAppointmentSystem\\Documents";
                              const patientDir = `${documentsPath}/patient_${parseInt(patient.id)}`;
                              await createDirectoryIfNotExists(patientDir);

                              // Salva i file su disco
                              const { saveFiles } = await import(
                                "@/utils/fileUtils"
                              );

                              let filePaths = [];
                              if (files && files.length > 0) {
                                try {
                                  filePaths = await saveFiles(
                                    files,
                                    parseInt(patient.id),
                                  );
                                } catch (fileError) {
                                  console.error(
                                    "Error saving files:",
                                    fileError,
                                  );
                                  alert(
                                    `Errore nel salvataggio dei file: ${fileError.message}. I file non saranno allegati al documento.`,
                                  );
                                  filePaths = [];
                                }
                              }

                              // Salva il documento nel database
                              const { MedicalRecordModel } = await import(
                                "@/models/medicalRecord"
                              );
                              const medicalRecordModel =
                                new MedicalRecordModel();

                              const newRecordData = {
                                patient_id: parseInt(patient.id),
                                date: new Date(date),
                                title,
                                doctor,
                                description,
                                files: filePaths.length > 0 ? filePaths : [],
                              };

                              const savedRecord =
                                await medicalRecordModel.create(newRecordData);

                              if (savedRecord) {
                                // Aggiorna la lista locale
                                const newRecord = {
                                  id:
                                    savedRecord.id?.toString() ||
                                    `rec${Date.now()}`,
                                  date,
                                  title,
                                  doctor,
                                  description,
                                  files: filePaths,
                                };

                                setMedicalRecords([
                                  newRecord,
                                  ...medicalRecords,
                                ]);

                                // Chiudi il form
                                document.body.removeChild(dialog);

                                // Mostra un messaggio di successo
                                alert("Documento aggiunto con successo!");
                              } else {
                                throw new Error(
                                  "Errore nel salvataggio del documento",
                                );
                              }
                            } catch (error) {
                              console.error(
                                "Errore durante il salvataggio del documento:",
                                error,
                              );
                              alert(
                                `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                              );
                            }
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Implementazione della visualizzazione del documento
                            const documentContent = record.description;
                            const documentTitle = record.title;

                            // Crea un modal per visualizzare il documento
                            const modal = document.createElement("div");
                            modal.className =
                              "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                            modal.innerHTML = `
                            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
                              <div class="flex justify-between items-center mb-4">
                                <h2 class="text-xl font-bold">${documentTitle}</h2>
                                <button id="close-doc-modal" class="p-1 rounded-full hover:bg-gray-200">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                              </div>
                              <div class="border-t pt-4">
                                <p class="text-sm text-gray-500 mb-2">Data: ${new Date(record.date).toLocaleDateString()}</p>
                                <p class="text-sm text-gray-500 mb-4">Medico: ${record.doctor}</p>
                                <div class="bg-gray-50 p-4 rounded-md">
                                  ${documentContent}
                                </div>
                                ${
                                  record.files && record.files.length > 0
                                    ? `
                                <div class="mt-4">
                                  <h3 class="text-sm font-medium text-gray-700 mb-2">File allegati:</h3>
                                  <div class="space-y-2">
                                    ${
                                      Array.isArray(record.files)
                                        ? record.files
                                            .map(
                                              (file, index) => `
                                      <div class="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                                        <span class="text-sm truncate max-w-[300px]">${file.split("/").pop() || file.split("\\").pop()}</span>
                                        <button id="open-file-${index}" class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Apri</button>
                                      </div>
                                    `,
                                            )
                                            .join("")
                                        : ""
                                    }
                                  </div>
                                </div>
                                `
                                    : ""
                                }
                              </div>
                            </div>
                          `;
                            document.body.appendChild(modal);

                            // Gestisci la chiusura del modal
                            document
                              .getElementById("close-doc-modal")
                              ?.addEventListener("click", () => {
                                document.body.removeChild(modal);
                              });

                            // Add event listeners for file open buttons
                            if (record.files && Array.isArray(record.files)) {
                              record.files.forEach((file, index) => {
                                document
                                  .getElementById(`open-file-${index}`)
                                  ?.addEventListener("click", async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const { openFile } = await import(
                                        "@/utils/fileUtils"
                                      );
                                      const success = await openFile(file);
                                      if (success) {
                                        alert(
                                          "Impossibile aprire il file. Verificare che esista e che sia accessibile.",
                                        );
                                      }
                                    } catch (error) {
                                      console.error(
                                        "Errore nell'apertura del file:",
                                        error,
                                      );
                                      alert(
                                        `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                                      );
                                    }
                                  });
                              });
                            }
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Visualizza Documento
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Implementazione della modifica del documento
                            const modal = document.createElement("div");
                            modal.className =
                              "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                            modal.innerHTML = `
                            <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
                              <div class="space-y-4">
                                <h2 class="text-xl font-bold">Modifica Documento Medico</h2>
                                <div class="space-y-2">
                                  <label class="text-sm font-medium">Titolo</label>
                                  <input id="edit-doc-title" type="text" class="w-full p-2 border rounded-md" value="${record.title}" />
                                </div>
                                <div class="space-y-2">
                                  <label class="text-sm font-medium">Data</label>
                                  <input id="edit-doc-date" type="date" class="w-full p-2 border rounded-md" value="${record.date}" />
                                </div>
                                <div class="space-y-2">
                                  <label class="text-sm font-medium">Medico</label>
                                  <input id="edit-doc-doctor" type="text" class="w-full p-2 border rounded-md" value="${record.doctor}" />
                                </div>
                                <div class="space-y-2">
                                  <label class="text-sm font-medium">Descrizione</label>
                                  <textarea id="edit-doc-description" class="w-full p-2 border rounded-md h-32">${record.description}</textarea>
                                </div>
                                <div class="space-y-2">
                                  <label class="text-sm font-medium">File allegati</label>
                                  ${
                                    record.files &&
                                    Array.isArray(record.files) &&
                                    record.files.length > 0
                                      ? `
                                  <div class="mb-2">
                                    <p class="text-sm text-gray-500">File esistenti:</p>
                                    <div class="space-y-1 mt-1">
                                      ${record.files
                                        .map(
                                          (file, index) => `
                                        <div class="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                                          <span class="text-sm truncate max-w-[300px]">${file.split("/").pop() || file.split("\\").pop()}</span>
                                          <button id="remove-file-${index}" class="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Rimuovi</button>
                                        </div>
                                      `,
                                        )
                                        .join("")}
                                    </div>
                                  </div>
                                  `
                                      : ""
                                  }
                                  <div>
                                    <p class="text-sm text-gray-500 mb-1">Aggiungi nuovi file:</p>
                                    <input id="edit-doc-files" type="file" class="w-full p-2 border rounded-md" multiple />
                                  </div>
                                </div>
                                <div class="flex justify-end space-x-2 pt-4">
                                  <button id="cancel-edit-doc" class="px-4 py-2 border border-gray-300 rounded-md">Annulla</button>
                                  <button id="save-edit-doc" class="px-4 py-2 bg-blue-600 text-white rounded-md">Salva Modifiche</button>
                                </div>
                              </div>
                            </div>
                          `;
                            document.body.appendChild(modal);

                            // Gestisci la chiusura del form
                            document
                              .getElementById("cancel-edit-doc")
                              ?.addEventListener("click", () => {
                                document.body.removeChild(modal);
                              });

                            // Add event listeners for file removal buttons
                            if (record.files && Array.isArray(record.files)) {
                              record.files.forEach((file, index) => {
                                document
                                  .getElementById(`remove-file-${index}`)
                                  ?.addEventListener("click", (e) => {
                                    e.stopPropagation();
                                    // Mark file for removal by adding a class
                                    const fileElement = document
                                      .getElementById(`remove-file-${index}`)
                                      ?.closest("div");
                                    if (fileElement) {
                                      fileElement.classList.add(
                                        "to-be-removed",
                                      );
                                      fileElement.style.opacity = "0.5";
                                      fileElement.querySelector(
                                        "button",
                                      ).textContent = "Annullato";
                                    }
                                  });
                              });
                            }

                            document
                              .getElementById("save-edit-doc")
                              ?.addEventListener("click", async () => {
                                const title = (
                                  document.getElementById(
                                    "edit-doc-title",
                                  ) as HTMLInputElement
                                )?.value;
                                const date = (
                                  document.getElementById(
                                    "edit-doc-date",
                                  ) as HTMLInputElement
                                )?.value;
                                const doctor = (
                                  document.getElementById(
                                    "edit-doc-doctor",
                                  ) as HTMLInputElement
                                )?.value;
                                const description = (
                                  document.getElementById(
                                    "edit-doc-description",
                                  ) as HTMLTextAreaElement
                                )?.value;
                                const newFiles = (
                                  document.getElementById(
                                    "edit-doc-files",
                                  ) as HTMLInputElement
                                )?.files;

                                if (
                                  !title ||
                                  !date ||
                                  !doctor ||
                                  !description
                                ) {
                                  alert("Compila tutti i campi obbligatori");
                                  return;
                                }

                                try {
                                  // Get files to keep (not marked for removal)
                                  const filesToKeep = [];
                                  if (
                                    record.files &&
                                    Array.isArray(record.files)
                                  ) {
                                    for (
                                      let i = 0;
                                      i < record.files.length;
                                      i++
                                    ) {
                                      const fileElement = document
                                        .getElementById(`remove-file-${i}`)
                                        ?.closest("div");
                                      if (
                                        fileElement &&
                                        !fileElement.classList.contains(
                                          "to-be-removed",
                                        )
                                      ) {
                                        filesToKeep.push(record.files[i]);
                                      }
                                    }
                                  }

                                  // Save new files
                                  let newFilePaths = [];
                                  if (newFiles && newFiles.length > 0) {
                                    const { saveFiles } = await import(
                                      "@/utils/fileUtils"
                                    );
                                    newFilePaths = await saveFiles(
                                      newFiles,
                                      parseInt(patient.id),
                                    );
                                  }

                                  // Combine existing and new files
                                  const allFiles = [
                                    ...filesToKeep,
                                    ...newFilePaths,
                                  ];

                                  // Update record in database
                                  const { MedicalRecordModel } = await import(
                                    "@/models/medicalRecord"
                                  );
                                  const medicalRecordModel =
                                    new MedicalRecordModel();

                                  const updatedRecordData = {
                                    title,
                                    date: new Date(date),
                                    doctor,
                                    description,
                                    files: allFiles,
                                  };

                                  // If it's a real database record (has numeric ID)
                                  if (
                                    record.id &&
                                    !isNaN(parseInt(record.id))
                                  ) {
                                    const savedRecord =
                                      await medicalRecordModel.update(
                                        parseInt(record.id),
                                        updatedRecordData,
                                      );

                                    if (!savedRecord) {
                                      throw new Error(
                                        "Errore nell'aggiornamento del documento",
                                      );
                                    }
                                  }

                                  // Update local record
                                  const updatedRecord = {
                                    ...record,
                                    title,
                                    date,
                                    doctor,
                                    description,
                                    files: allFiles,
                                  };

                                  // Update medical records list
                                  const updatedRecords = medicalRecords.map(
                                    (r) =>
                                      r.id === record.id ? updatedRecord : r,
                                  );

                                  setMedicalRecords(updatedRecords);

                                  // Close form
                                  document.body.removeChild(modal);

                                  // Show success message
                                  alert("Documento aggiornato con successo!");
                                } catch (error) {
                                  console.error(
                                    "Errore durante l'aggiornamento del documento:",
                                    error,
                                  );
                                  alert(
                                    `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                                  );
                                }
                              });
                          }}
                        >
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
                          <label class="text-sm font-medium">Messaggio</label>
                          <textarea id="message-text" class="w-full p-2 border rounded-md h-32" placeholder="Scrivi il messaggio da inviare"></textarea>
                        </div>
                        <div class="flex justify-end space-x-2 pt-4">
                          <button id="cancel-message" class="px-4 py-2 border border-gray-300 rounded-md">Annulla</button>
                          <button id="send-message" class="px-4 py-2 bg-blue-600 text-white rounded-md">Invia</button>
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
                        .getElementById("cancel-message")
                        ?.addEventListener("click", () => {
                          document.body.removeChild(dialog);
                        });

                      // Gestisci l'invio del messaggio
                      document
                        .getElementById("send-message")
                        ?.addEventListener("click", async () => {
                          const messageText = (
                            document.getElementById(
                              "message-text",
                            ) as HTMLTextAreaElement
                          )?.value;

                          if (!messageText) {
                            alert("Inserisci un messaggio da inviare");
                            return;
                          }

                          try {
                            // Invia il messaggio WhatsApp
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
                              alert(
                                "Il servizio WhatsApp non è abilitato o autenticato. Verifica le impostazioni.",
                              );
                              document.body.removeChild(dialog);
                              return;
                            }

                            // Crea un appuntamento fittizio per l'invio del messaggio
                            const dummyAppointment = {
                              id: 0,
                              patient_id: parseInt(patient.id),
                              date: new Date(),
                              time: "00:00",
                              duration: 0,
                              appointment_type: "custom",
                              notes: "Messaggio manuale",
                            };

                            // Invia il messaggio
                            const result =
                              await whatsAppService.sendNotification(
                                dummyAppointment,
                                patient.phone,
                                messageText,
                                "custom",
                              );

                            if (result) {
                              // Aggiorna la lista delle comunicazioni
                              const newCommunication = {
                                id: `comm${Date.now()}`,
                                date: new Date().toISOString(),
                                type: "whatsapp",
                                message: messageText,
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
                            } else {
                              throw new Error(
                                "Errore nell'invio del messaggio",
                              );
                            }
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
                {communications.length > 0 ? (
                  communications.map((comm) => (
                    <Card key={comm.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">
                            {comm.type === "whatsapp"
                              ? "Messaggio WhatsApp"
                              : comm.type === "email"
                                ? "Email"
                                : "Telefonata"}
                          </CardTitle>
                          <Badge
                            variant={
                              comm.status === "sent"
                                ? "default"
                                : comm.status === "pending"
                                  ? "secondary"
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
                            {new Date(comm.date).toLocaleDateString()}{" "}
                            {new Date(comm.date).toLocaleTimeString()}
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{comm.message}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nessuna comunicazione registrata per questo paziente.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
