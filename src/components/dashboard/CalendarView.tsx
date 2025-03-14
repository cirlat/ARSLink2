import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  addYears,
  getYear,
  getMonth,
  setMonth,
  setYear,
} from "date-fns";
import { it } from "date-fns/locale";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Check,
  AlertCircle,
} from "lucide-react";
import AppointmentForm from "../appointments/AppointmentForm";
import { AppointmentCard } from "../appointments/AppointmentCard";

interface Appointment {
  id: string;
  patientName: string;
  date: Date;
  time: string;
  duration: number;
  type: string;
  synced: boolean;
  notified: boolean;
}

const CalendarView = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carica gli appuntamenti dal database
  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoading(true);
      try {
        const { AppointmentModel } = await import("@/models/appointment");
        const appointmentModel = new AppointmentModel();

        // Ottieni tutti gli appuntamenti per il mese corrente
        const startDate = new Date();
        startDate.setDate(1); // Primo giorno del mese
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Ultimo giorno del mese
        endDate.setHours(23, 59, 59, 999);

        const result = await appointmentModel.findByDateRange(
          startDate,
          endDate,
        );

        if (result && result.length > 0) {
          // Formatta gli appuntamenti per l'uso nel componente
          const formattedAppointments = result.map((a) => ({
            id: a.id.toString(),
            patientName: a.patient_name || "Paziente",
            date: new Date(a.date),
            time: a.time.substring(0, 5), // Formato HH:MM
            duration: a.duration,
            type: a.appointment_type,
            synced: a.google_calendar_synced,
            notified: a.whatsapp_notification_sent,
          }));

          setAppointments(formattedAppointments);
        } else {
          // Nessun appuntamento trovato
          setAppointments([]);
        }
      } catch (error) {
        console.error("Errore nel caricamento degli appuntamenti:", error);
        // Fallback a dati vuoti in caso di errore
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, []);

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setIsDialogOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  // Funzione per ricaricare gli appuntamenti dopo una modifica
  const reloadAppointments = async () => {
    setIsLoading(true);
    try {
      const { AppointmentModel } = await import("@/models/appointment");
      const appointmentModel = new AppointmentModel();

      // Ottieni tutti gli appuntamenti per il mese corrente
      const startDate = new Date();
      startDate.setDate(1); // Primo giorno del mese
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Ultimo giorno del mese
      endDate.setHours(23, 59, 59, 999);

      const result = await appointmentModel.findByDateRange(startDate, endDate);

      if (result && result.length > 0) {
        // Formatta gli appuntamenti per l'uso nel componente
        const formattedAppointments = result.map((a) => ({
          id: a.id.toString(),
          patientName: a.patient_name || "Paziente",
          date: new Date(a.date),
          time: a.time.substring(0, 5), // Formato HH:MM
          duration: a.duration,
          type: a.appointment_type,
          synced: a.google_calendar_synced,
          notified: a.whatsapp_notification_sent,
        }));

        setAppointments(formattedAppointments);
      } else {
        // Nessun appuntamento trovato
        setAppointments([]);
      }
    } catch (error) {
      console.error("Errore nel caricamento degli appuntamenti:", error);
      // Fallback a dati vuoti in caso di errore
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAppointment = (id: string) => {
    // In un'app reale, questo eliminerebbe l'appuntamento
    console.log(`Elimina appuntamento ${id}`);
  };

  const navigatePrevious = () => {
    if (view === "day") {
      setDate(addDays(date, -1));
    } else if (view === "week") {
      setDate(addDays(date, -7));
    } else {
      // Vista mensile
      setDate(addMonths(date, -1));
    }
  };

  const navigateNext = () => {
    if (view === "day") {
      setDate(addDays(date, 1));
    } else if (view === "week") {
      setDate(addDays(date, 7));
    } else {
      // Vista mensile
      setDate(addMonths(date, 1));
    }
  };

  const handleMonthChange = (monthIndex: number) => {
    const newDate = new Date(date);
    setDate(setMonth(newDate, monthIndex));
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(date);
    setDate(setYear(newDate, year));
  };

  const renderDayView = () => {
    const dayAppointments = appointments
      .filter((app) => isSameDay(app.date, date))
      .sort((a, b) => a.time.localeCompare(b.time));

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {format(date, "EEEE, d MMMM yyyy", { locale: it })}
        </h2>
        {isLoading ? (
          <div className="text-center py-6">
            <div className="spinner mx-auto"></div>
            <p className="mt-2 text-muted-foreground">
              Caricamento appuntamenti...
            </p>
          </div>
        ) : dayAppointments.length > 0 ? (
          dayAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onEdit={handleEditAppointment}
              onDelete={handleDeleteAppointment}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Nessun appuntamento per questa giornata
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(date, { weekStartsOn: 1 }); // Inizia dal lunedì
    const endDate = endOfWeek(date, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {format(startDate, "d MMMM", { locale: it })} -{" "}
          {format(endDate, "d MMMM yyyy", { locale: it })}
        </h2>
        {isLoading ? (
          <div className="text-center py-6">
            <div className="spinner mx-auto"></div>
            <p className="mt-2 text-muted-foreground">
              Caricamento appuntamenti...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day, index) => {
              const dayAppointments = appointments.filter((app) =>
                isSameDay(app.date, day),
              );

              return (
                <div key={index} className="space-y-2">
                  <div className="text-center p-2 bg-muted rounded-md">
                    <div className="font-medium">
                      {format(day, "EEEE", { locale: it })}
                    </div>
                    <div>{format(day, "d")}</div>
                  </div>
                  <div className="space-y-2 h-[400px] overflow-y-auto">
                    {dayAppointments.length > 0 ? (
                      dayAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="p-2 bg-card border rounded-md text-sm cursor-pointer hover:bg-accent"
                          onClick={() => handleEditAppointment(appointment)}
                        >
                          <div className="font-medium">{appointment.time}</div>
                          <div className="truncate">
                            {appointment.patientName}
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            {appointment.synced ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                <Check className="h-3 w-3 mr-1" /> Sincronizzato
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-amber-700 border-amber-200"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" /> Non
                                sincronizzato
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-muted-foreground p-2">
                        Nessun appuntamento
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {format(date, "MMMM yyyy", { locale: it })}
          </h2>
          <div className="flex items-center space-x-2">
            <Select
              value={getMonth(date).toString()}
              onValueChange={(value) => handleMonthChange(parseInt(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Seleziona mese" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {format(new Date(2000, month, 1), "MMMM", { locale: it })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={getYear(date).toString()}
              onValueChange={(value) => handleYearChange(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Anno" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: 10 },
                  (_, i) => getYear(new Date()) - 5 + i,
                ).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          {isLoading ? (
            <div className="flex items-center justify-center h-[350px]">
              <div className="spinner mr-2"></div>
              <p>Caricamento calendario...</p>
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md border"
              locale={it}
              modifiers={{
                appointment: appointments.map((a) => a.date),
              }}
              modifiersClassNames={{
                appointment: "bg-primary text-primary-foreground font-bold",
              }}
            />
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              Appuntamenti per {format(date, "d MMMM yyyy", { locale: it })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">
                <div className="spinner mx-auto"></div>
                <p className="mt-2 text-muted-foreground">
                  Caricamento appuntamenti...
                </p>
              </div>
            ) : appointments.filter((app) => isSameDay(app.date, date)).length >
              0 ? (
              appointments
                .filter((app) => isSameDay(app.date, date))
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={handleEditAppointment}
                    onDelete={handleDeleteAppointment}
                  />
                ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Nessun appuntamento per questa data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="h-full bg-background p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Calendario Appuntamenti</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDate(new Date())}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "day" | "week" | "month")}
          >
            <TabsList>
              <TabsTrigger value="day">Giorno</TabsTrigger>
              <TabsTrigger value="week">Settimana</TabsTrigger>
              <TabsTrigger value="month">Mese</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleNewAppointment}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Appuntamento
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>Appuntamento</DialogTitle>
          <AppointmentForm
            onSubmit={() => {
              setIsDialogOpen(false);
              reloadAppointments();
            }}
            onCancel={() => setIsDialogOpen(false)}
            initialData={
              selectedAppointment
                ? {
                    patientId: "1", // This would need to be set correctly
                    date: selectedAppointment.date,
                    time: selectedAppointment.time,
                    duration: selectedAppointment.duration.toString(),
                    appointmentType: selectedAppointment.type,
                    notes: "",
                    sendWhatsAppNotification: selectedAppointment.notified,
                    googleCalendarSync: selectedAppointment.synced,
                  }
                : undefined
            }
            isEditing={!!selectedAppointment}
            appointment={
              selectedAppointment ? { id: selectedAppointment.id } : null
            }
          />
        </DialogContent>
      </Dialog>

      {view === "day" && renderDayView()}
      {view === "week" && renderWeekView()}
      {view === "month" && renderMonthView()}
    </div>
  );
};

export default CalendarView;
