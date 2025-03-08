import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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

  // Dati di esempio per gli appuntamenti
  const mockAppointments: Appointment[] = [
    {
      id: "1",
      patientName: "Marco Rossi",
      date: new Date(),
      time: "09:00",
      duration: 30,
      type: "Visita generale",
      synced: true,
      notified: true,
    },
    {
      id: "2",
      patientName: "Giulia Bianchi",
      date: new Date(),
      time: "10:30",
      duration: 45,
      type: "Controllo",
      synced: true,
      notified: false,
    },
    {
      id: "3",
      patientName: "Luca Verdi",
      date: addDays(new Date(), 1),
      time: "14:00",
      duration: 60,
      type: "Prima visita",
      synced: false,
      notified: false,
    },
  ];

  // Generazione degli anni per il selettore
  const currentYear = getYear(new Date());
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  // Generazione dei mesi per il selettore
  const months = Array.from({ length: 12 }, (_, i) => i);

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setIsDialogOpen(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
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
    const dayAppointments = mockAppointments
      .filter((app) => isSameDay(app.date, date))
      .sort((a, b) => a.time.localeCompare(b.time));

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {format(date, "EEEE, d MMMM yyyy", { locale: it })}
        </h2>
        {dayAppointments.length > 0 ? (
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
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const dayAppointments = mockAppointments.filter((app) =>
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
                {months.map((month) => (
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
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => newDate && setDate(newDate)}
            className="rounded-md border"
            locale={it}
            modifiers={{
              appointment: mockAppointments.map((a) => a.date),
            }}
            modifiersClassNames={{
              appointment: "bg-primary text-primary-foreground font-bold",
            }}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              Appuntamenti per {format(date, "d MMMM yyyy", { locale: it })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mockAppointments.filter((app) => isSameDay(app.date, date))
              .length > 0 ? (
              mockAppointments
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
        <div className="flex items-center space-x-4">
          <Select
            value={view}
            onValueChange={(value: "day" | "week" | "month") => setView(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleziona vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Giornaliera</SelectItem>
              <SelectItem value="week">Settimanale</SelectItem>
              <SelectItem value="month">Mensile</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewAppointment}>
                <Plus className="h-4 w-4 mr-2" /> Nuovo Appuntamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <AppointmentForm
                appointment={selectedAppointment}
                onClose={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs
        value={view}
        onValueChange={(value: "day" | "week" | "month") => setView(value)}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="day">Giornaliera</TabsTrigger>
          <TabsTrigger value="week">Settimanale</TabsTrigger>
          <TabsTrigger value="month">Mensile</TabsTrigger>
        </TabsList>
        <TabsContent value="day">{renderDayView()}</TabsContent>
        <TabsContent value="week">{renderWeekView()}</TabsContent>
        <TabsContent value="month">{renderMonthView()}</TabsContent>
      </Tabs>
    </div>
  );
};

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

const AppointmentCard = ({
  appointment,
  onEdit,
  onDelete,
}: AppointmentCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{appointment.time}</span>
              <span className="text-muted-foreground">
                ({appointment.duration} min)
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{appointment.patientName}</span>
            </div>
            <div className="mt-2">
              <Badge variant="secondary">{appointment.type}</Badge>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(appointment)}
            >
              Modifica
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => onDelete(appointment.id)}
            >
              Elimina
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4">
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
              <AlertCircle className="h-3 w-3 mr-1" /> Non sincronizzato
            </Badge>
          )}
          {appointment.notified ? (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              <Check className="h-3 w-3 mr-1" /> Notifica inviata
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-slate-50 text-slate-700 border-slate-200"
            >
              <AlertCircle className="h-3 w-3 mr-1" /> Notifica non inviata
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
