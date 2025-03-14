import React from "react";
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

const PatientDetails = ({
  patient = {
    id: "12345",
    name: "Maria Rossi",
    codiceFiscale: "RSSMRA80A01H501U",
    dateOfBirth: "1980-01-01",
    gender: "Female",
    email: "maria.rossi@example.com",
    phone: "+39 123 456 7890",
    address: "Via Roma 123, 00100 Roma, Italia",
    profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
  },
  appointments = [
    {
      id: "apt1",
      date: "2023-06-15",
      time: "10:00",
      type: "Check-up",
      status: "completed",
      notes: "Regular annual check-up. Blood pressure normal.",
    },
    {
      id: "apt2",
      date: "2023-09-22",
      time: "14:30",
      type: "Follow-up",
      status: "completed",
      notes: "Follow-up for previous treatment.",
    },
    {
      id: "apt3",
      date: "2024-01-10",
      time: "11:15",
      type: "Consultation",
      status: "upcoming",
    },
  ],
  medicalRecords = [
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
  ],
  communications = [
    {
      id: "comm1",
      date: "2023-12-20",
      type: "whatsapp",
      message: "Reminder for your appointment on January 10th at 11:15.",
      status: "sent",
    },
    {
      id: "comm2",
      date: "2023-12-25",
      type: "email",
      message: "Happy Holidays from our clinic! Our holiday hours are...",
      status: "sent",
    },
    {
      id: "comm3",
      date: "2024-01-05",
      type: "whatsapp",
      message: "Your appointment is in 5 days. Please confirm.",
      status: "pending",
    },
  ],
}: PatientDetailsProps) => {
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
                  const { createRoot } = require("react-dom/client");
                  const AppointmentForm =
                    require("@/components/appointments/AppointmentForm").default;
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
                      const { createRoot } = require("react-dom/client");
                      const AppointmentForm =
                        require("@/components/appointments/AppointmentForm").default;
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
                <Button>
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
                <Button>
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
