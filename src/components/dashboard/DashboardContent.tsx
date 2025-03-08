import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Plus, User, Calendar as CalendarIcon, Clock, Eye } from "lucide-react";

interface DashboardContentProps {}

const DashboardContent: React.FC<DashboardContentProps> = () => {
  const navigate = useNavigate();
  const [date, setDate] = React.useState<Date>(new Date());

  // Dati di esempio per gli ultimi pazienti
  const recentPatients = [
    {
      id: "1",
      name: "Marco Rossi",
      codiceFiscale: "RSSMRC80A01H501U",
      dateAdded: "2023-12-15",
    },
    {
      id: "2",
      name: "Giulia Bianchi",
      codiceFiscale: "BNCGLI85B42H501V",
      dateAdded: "2023-12-14",
    },
    {
      id: "3",
      name: "Luca Verdi",
      codiceFiscale: "VRDLCU75C03H501W",
      dateAdded: "2023-12-13",
    },
    {
      id: "4",
      name: "Sofia Esposito",
      codiceFiscale: "SPSSFO90D44H501X",
      dateAdded: "2023-12-12",
    },
    {
      id: "5",
      name: "Alessandro Romano",
      codiceFiscale: "RMNLSN82E05H501Y",
      dateAdded: "2023-12-11",
    },
  ];

  // Dati di esempio per gli ultimi appuntamenti
  const recentAppointments = [
    {
      id: "1",
      patientName: "Marco Rossi",
      date: new Date(),
      time: "09:00",
      type: "Visita generale",
    },
    {
      id: "2",
      patientName: "Giulia Bianchi",
      date: new Date(new Date().setDate(new Date().getDate() + 1)),
      time: "10:30",
      type: "Controllo",
    },
    {
      id: "3",
      patientName: "Luca Verdi",
      date: new Date(new Date().setDate(new Date().getDate() + 2)),
      time: "14:00",
      type: "Prima visita",
    },
    {
      id: "4",
      patientName: "Sofia Esposito",
      date: new Date(new Date().setDate(new Date().getDate() + 3)),
      time: "11:15",
      type: "Consulto",
    },
    {
      id: "5",
      patientName: "Alessandro Romano",
      date: new Date(new Date().setDate(new Date().getDate() + 4)),
      time: "16:30",
      type: "Controllo",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Calendario */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Calendario</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/calendar")}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Vista completa
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md border"
              locale={it}
              modifiers={{
                appointment: recentAppointments.map((a) => a.date),
              }}
              modifiersClassNames={{
                appointment: "bg-primary text-primary-foreground font-bold",
              }}
            />

            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium">
                Appuntamenti per {format(date, "d MMMM yyyy", { locale: it })}
              </h3>
              {recentAppointments.filter((app) => isSameDay(app.date, date))
                .length > 0 ? (
                <div className="space-y-2">
                  {recentAppointments
                    .filter((app) => isSameDay(app.date, date))
                    .map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex justify-between items-center p-2 border rounded-md hover:bg-muted"
                      >
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">
                            {appointment.time}
                          </span>
                          <span className="mx-2">-</span>
                          <span>{appointment.patientName}</span>
                        </div>
                        <Badge variant="secondary">{appointment.type}</Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nessun appuntamento per questa data
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ultimi pazienti inseriti */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Ultimi Pazienti Inseriti</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/patients")}
              >
                <User className="h-4 w-4 mr-2" />
                Tutti i pazienti
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex justify-between items-center p-2 border rounded-md hover:bg-muted"
                >
                  <div>
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {patient.codiceFiscale}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => navigate("/patients/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Paziente
            </Button>
          </CardContent>
        </Card>

        {/* Ultimi appuntamenti inseriti */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Prossimi Appuntamenti</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/calendar")}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendario
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex justify-between items-center p-2 border rounded-md hover:bg-muted"
                >
                  <div>
                    <div className="font-medium">{appointment.patientName}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(appointment.date, "d MMM yyyy", { locale: it })} -{" "}
                      {appointment.time}
                    </div>
                  </div>
                  <Badge variant="secondary">{appointment.type}</Badge>
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => navigate("/calendar")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Appuntamento
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardContent;
