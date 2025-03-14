import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Clock, Save, X } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AppointmentFormProps {
  onSubmit?: (data: AppointmentFormData) => void;
  onCancel?: () => void;
  initialData?: AppointmentFormData;
  isEditing?: boolean;
  onClose?: () => void;
  appointment?: any;
}

interface AppointmentFormData {
  patientId: string;
  date: Date;
  time: string;
  duration: string;
  appointmentType: string;
  notes: string;
  sendWhatsAppNotification: boolean;
  googleCalendarSync: boolean;
}

const appointmentTypes = [
  { value: "checkup", label: "Visita di controllo" },
  { value: "followup", label: "Visita di follow-up" },
  { value: "consultation", label: "Consulto" },
  { value: "procedure", label: "Procedura medica" },
  { value: "emergency", label: "Emergenza" },
];

const durationOptions = [
  { value: "15", label: "15 minuti" },
  { value: "30", label: "30 minuti" },
  { value: "45", label: "45 minuti" },
  { value: "60", label: "1 ora" },
  { value: "90", label: "1.5 ore" },
  { value: "120", label: "2 ore" },
];

// Inizializzazione vuota, verrà popolata dal database
const mockPatients: { id: string; name: string }[] = [];

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  onSubmit = () => {},
  onCancel = () => {},
  onClose = () => {},
  initialData = {
    patientId: "1",
    date: new Date(),
    time: "09:00",
    duration: "30",
    appointmentType: "checkup",
    notes: "",
    sendWhatsAppNotification: true,
    googleCalendarSync: true,
  },
  isEditing = false,
  appointment = null,
}) => {
  const [date, setDate] = useState<Date | undefined>(initialData.date);
  const [patients, setPatients] = useState(mockPatients);

  // Carica i pazienti dal database
  useEffect(() => {
    const loadPatients = async () => {
      try {
        // Carica i pazienti dal database
        const { PatientModel } = await import("@/models/patient");
        const patientModel = new PatientModel();

        // Ottieni tutti i pazienti
        const result = await patientModel.findAll();

        if (result.patients && result.patients.length > 0) {
          // Converti i dati dal formato del database al formato richiesto dal componente
          const formattedPatients = result.patients.map((p: any) => ({
            id: p.id.toString(),
            name: p.name,
          }));
          setPatients(formattedPatients);
        } else {
          // Fallback a localStorage
          try {
            const storedPatients = JSON.parse(
              localStorage.getItem("patients") || "[]",
            );
            if (storedPatients.length > 0) {
              // Converti i dati dal formato di storage al formato richiesto dal componente
              const formattedPatients = storedPatients.map((p: any) => ({
                id: p.id || String(Date.now()),
                name:
                  p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
              }));
              setPatients(formattedPatients);
            } else {
              // Usa dati di fallback
              setPatients([
                { id: "1", name: "Maria Rossi" },
                { id: "2", name: "Giuseppe Verdi" },
                { id: "3", name: "Francesca Bianchi" },
                { id: "4", name: "Alessandro Romano" },
                { id: "5", name: "Lucia Ferrari" },
              ]);
            }
          } catch (localStorageError) {
            console.error(
              "Errore nel caricamento dei pazienti da localStorage:",
              localStorageError,
            );
            // Usa dati di fallback
            setPatients([
              { id: "1", name: "Maria Rossi" },
              { id: "2", name: "Giuseppe Verdi" },
              { id: "3", name: "Francesca Bianchi" },
              { id: "4", name: "Alessandro Romano" },
              { id: "5", name: "Lucia Ferrari" },
            ]);
          }
        }
      } catch (error) {
        console.error("Errore nel caricamento dei pazienti:", error);
        // Usa dati di fallback
        setPatients([
          { id: "1", name: "Maria Rossi" },
          { id: "2", name: "Giuseppe Verdi" },
          { id: "3", name: "Francesca Bianchi" },
          { id: "4", name: "Alessandro Romano" },
          { id: "5", name: "Lucia Ferrari" },
        ]);
      }
    };

    loadPatients();
  }, []);

  const form = useForm<AppointmentFormData>({
    defaultValues: initialData,
  });

  const handleSubmit = async (data: AppointmentFormData) => {
    try {
      // Salva l'appuntamento nel database
      const { AppointmentModel } = await import("@/models/appointment");
      const appointmentModel = new AppointmentModel();

      // Prepara i dati per il salvataggio
      const appointmentData = {
        patient_id: parseInt(data.patientId),
        date: data.date.toISOString().split("T")[0],
        time: data.time,
        duration: parseInt(data.duration),
        appointment_type: data.appointmentType,
        notes: data.notes || "",
        google_calendar_synced: data.googleCalendarSync,
        whatsapp_notification_sent: false,
      };

      // Salva l'appuntamento
      let savedAppointment;
      if (isEditing && appointment?.id) {
        console.log(
          "Updating appointment with ID:",
          appointment.id,
          "with data:",
          appointmentData,
        );
        // Crea una copia dei dati senza updated_at che verrà gestito dal database
        const updateData = { ...appointmentData };
        savedAppointment = await appointmentModel.update(
          parseInt(appointment.id),
          updateData,
        );

        if (!savedAppointment) {
          throw new Error(
            "Impossibile aggiornare l'appuntamento. Verifica che l'ID sia valido.",
          );
      } else {
        savedAppointment = await appointmentModel.create(appointmentData);
      }

      if (savedAppointment) {
        console.log("Appuntamento salvato con successo:", savedAppointment);

        // Invia notifica WhatsApp se richiesto
        if (data.sendWhatsAppNotification) {
          try {
            const { WhatsAppService } = await import(
              "@/services/whatsapp.service"
            );
            const whatsAppService = WhatsAppService.getInstance();

            // Verifica se il servizio è abilitato e autenticato
            const isEnabled = await whatsAppService.isServiceEnabled();
            const isAuthenticated =
              await whatsAppService.isServiceAuthenticated();

            if (isEnabled && isAuthenticated) {
              // Trova il paziente per ottenere il numero di telefono
              const patient = patients.find((p) => p.id === data.patientId);
              if (patient) {
                await whatsAppService.sendAppointmentConfirmation(
                  savedAppointment.id,
                  patient.name,
                  data.date,
                  data.time,
                );
                console.log("Notifica WhatsApp inviata con successo");
              }
            }
          } catch (whatsappError) {
            console.error(
              "Errore nell'invio della notifica WhatsApp:",
              whatsappError,
            );
          }
        }

        // Sincronizza con Google Calendar se richiesto
        if (data.googleCalendarSync) {
          try {
            const { GoogleCalendarService } = await import(
              "@/services/googleCalendar.service"
            );
            const googleCalendarService = GoogleCalendarService.getInstance();

            // Verifica se il servizio è abilitato e autenticato
            const isEnabled = await googleCalendarService.isServiceEnabled();
            const isAuthenticated =
              await googleCalendarService.isServiceAuthenticated();

            if (isEnabled && isAuthenticated) {
              // Trova il paziente per ottenere il nome
              const patient = patients.find((p) => p.id === data.patientId);
              if (patient) {
                await googleCalendarService.syncAppointment(
                  savedAppointment.id,
                  patient.name,
                  data.date,
                  data.time,
                  parseInt(data.duration),
                  data.appointmentType,
                  data.notes || "",
                );
                console.log("Appuntamento sincronizzato con Google Calendar");
              }
            }
          } catch (googleError) {
            console.error(
              "Errore nella sincronizzazione con Google Calendar:",
              googleError,
            );
          }
        }

        // Salva anche in localStorage per il caso in cui il DB non sia disponibile
        try {
          const storedAppointments = JSON.parse(
            localStorage.getItem("appointments") || "[]",
          );
          const newAppointment = {
            id: savedAppointment.id || Date.now().toString(),
            patientId: data.patientId,
            patientName:
              patients.find((p) => p.id === data.patientId)?.name || "Paziente",
            date: data.date.toISOString(),
            time: data.time,
            duration: data.duration,
            type: data.appointmentType,
            notes: data.notes,
            synced: data.googleCalendarSync,
            notified: data.sendWhatsAppNotification,
          };

          if (isEditing && appointment?.id) {
            // Aggiorna l'appuntamento esistente
            const updatedAppointments = storedAppointments.map((a: any) =>
              a.id === appointment.id ? newAppointment : a,
            );
            localStorage.setItem(
              "appointments",
              JSON.stringify(updatedAppointments),
            );
          } else {
            // Aggiungi il nuovo appuntamento
            storedAppointments.push(newAppointment);
            localStorage.setItem(
              "appointments",
              JSON.stringify(storedAppointments),
            );
          }
        } catch (localStorageError) {
          console.error(
            "Errore nel salvataggio in localStorage:",
            localStorageError,
          );
        }

        // Chiudi il form e aggiorna la vista
        alert(
          isEditing
            ? "Appuntamento aggiornato con successo"
            : "Appuntamento creato con successo",
        );
        onSubmit(data);
        onClose();
      } else {
        throw new Error("Errore nel salvataggio dell'appuntamento");
      }
    } catch (error) {
      console.error("Errore durante il salvataggio dell'appuntamento:", error);
      alert(
        `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {isEditing ? "Modifica Appuntamento" : "Nuovo Appuntamento"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Selezione Paziente */}
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paziente</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un paziente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Seleziona il paziente per questo appuntamento
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Selettore Data */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: it })
                        ) : (
                          <span>Seleziona una data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={it}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ora e Durata */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ora</FormLabel>
                  <div className="flex items-center">
                    <FormControl>
                      <Input type="time" {...field} className="flex-1" />
                    </FormControl>
                    <Clock className="ml-2 h-4 w-4 text-gray-400" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durata</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona durata" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tipo di Appuntamento */}
          <FormField
            control={form.control}
            name="appointmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo di Appuntamento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona tipo di appuntamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Note */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Aggiungi note rilevanti per questo appuntamento"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Opzioni di Notifica */}
          <div className="space-y-4">
            <h3 className="text-md font-medium">Opzioni di Notifica</h3>
            <div className="space-y-2">
              {/* Verifica se l'utente ha una licenza che include WhatsApp */}
              {(localStorage.getItem("licenseType") === "whatsapp" ||
                localStorage.getItem("licenseType") === "full") && (
                <FormField
                  control={form.control}
                  name="sendWhatsAppNotification"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Notifica WhatsApp</FormLabel>
                        <FormDescription>
                          Invia conferma appuntamento via WhatsApp
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {/* Verifica se l'utente ha una licenza che include Google Calendar */}
              {(localStorage.getItem("licenseType") === "google" ||
                localStorage.getItem("licenseType") === "full") && (
                <FormField
                  control={form.control}
                  name="googleCalendarSync"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Sincronizzazione Google Calendar</FormLabel>
                        <FormDescription>
                          Sincronizza questo appuntamento con Google Calendar
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          {/* Azioni del Form */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Aggiorna" : "Salva"} Appuntamento
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AppointmentForm;
