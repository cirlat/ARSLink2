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
  notes?: string;
  sendWhatsAppNotification?: boolean;
  googleCalendarSync?: boolean;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  onClose,
  appointment = null,
}) => {
  const [date, setDate] = useState<Date | undefined>(
    initialData?.date || new Date(),
  );
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<AppointmentFormData>({
    defaultValues: initialData || {
      patientId: "",
      date: new Date(),
      time: "09:00",
      duration: "30",
      appointmentType: "checkup",
      notes: "",
      sendWhatsAppNotification: true,
      googleCalendarSync: true,
    },
  });

  // Load patients from database
  useEffect(() => {
    const loadPatients = async () => {
      setIsLoading(true);
      try {
        const { PatientModel } = await import("@/models/patient");
        const patientModel = new PatientModel();
        const result = await patientModel.findAll();

        if (result && result.patients && result.patients.length > 0) {
          const formattedPatients = result.patients.map((p: any) => ({
            id: p.id.toString(),
            name: p.name,
          }));
          setPatients(formattedPatients);
        } else {
          // Fallback to example data
          setPatients([
            { id: "1", name: "Marco Rossi" },
            { id: "2", name: "Giulia Bianchi" },
            { id: "3", name: "Francesca Verdi" },
          ]);
        }
      } catch (error) {
        console.error("Error loading patients:", error);
        // Fallback to example data
        setPatients([
          { id: "1", name: "Marco Rossi" },
          { id: "2", name: "Giulia Bianchi" },
          { id: "3", name: "Francesca Verdi" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatients();
  }, []);

  const handleSubmit = async (data: AppointmentFormData) => {
    setIsSaving(true);
    try {
      // Ensure date is properly set
      if (!data.date) {
        data.date = date || new Date();
      }

      // Create or update appointment in database
      const { AppointmentModel } = await import("@/models/appointment");
      const appointmentModel = new AppointmentModel();

      // Format date to ensure it's a Date object
      const formattedDate = new Date(data.date);
      // Reset the time part to avoid timezone issues
      formattedDate.setHours(0, 0, 0, 0);

      const appointmentData = {
        patient_id: parseInt(data.patientId),
        date: formattedDate,
        time: data.time,
        duration: parseInt(data.duration),
        appointment_type: data.appointmentType,
        notes: data.notes || "",
        google_calendar_synced: data.googleCalendarSync || false,
        whatsapp_notification_sent: false,
      };

      let result;
      if (isEditing && appointment?.id) {
        // Update existing appointment
        result = await appointmentModel.update(
          parseInt(appointment.id),
          appointmentData,
        );
      } else {
        // Create new appointment
        result = await appointmentModel.create(appointmentData);
      }

      if (result) {
        // Send WhatsApp notification if enabled
        if (data.sendWhatsAppNotification) {
          try {
            // Get patient phone number
            const { PatientModel } = await import("@/models/patient");
            const patientModel = new PatientModel();
            const patient = await patientModel.findById(
              parseInt(data.patientId),
            );

            if (patient && patient.phone) {
              // Send WhatsApp notification
              const { WhatsAppService } = await import(
                "@/services/whatsapp.service"
              );
              const whatsAppService = WhatsAppService.getInstance();

              // Check if service is enabled and authenticated
              const isEnabled = await whatsAppService.isServiceEnabled();
              const isAuthenticated =
                await whatsAppService.isServiceAuthenticated();

              if (isEnabled && isAuthenticated) {
                if (isEditing) {
                  await whatsAppService.sendNotification(
                    result,
                    patient.phone,
                    `Il tuo appuntamento è stato modificato per il ${formattedDate.toLocaleDateString()} alle ${data.time}. Durata: ${data.duration} minuti.`,
                    "custom",
                  );
                } else {
                  await whatsAppService.sendAppointmentConfirmation(
                    result,
                    patient.phone,
                  );
                }
              }
            }
          } catch (notificationError) {
            console.error(
              "Error sending WhatsApp notification:",
              notificationError,
            );
          }
        }

        // Sync with Google Calendar if enabled
        if (data.googleCalendarSync) {
          try {
            const { GoogleCalendarService } = await import(
              "@/services/googleCalendar.service"
            );
            const googleCalendarService = GoogleCalendarService.getInstance();

            // Check if service is enabled and authenticated
            const isEnabled = await googleCalendarService.isServiceEnabled();
            const isAuthenticated =
              await googleCalendarService.isServiceAuthenticated();

            if (isEnabled && isAuthenticated) {
              if (isEditing && appointment?.id) {
                await googleCalendarService.updateEvent(
                  parseInt(appointment.id),
                );
              } else if (result.id) {
                await googleCalendarService.createEvent(result.id);
              }
            }
          } catch (calendarError) {
            console.error("Error syncing with Google Calendar:", calendarError);
          }
        }

        // Call onSubmit callback if provided
        if (onSubmit) {
          onSubmit(data);
        } else if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      alert(
        `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Selection */}
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paziente</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Appointment Type */}
          <FormField
            control={form.control}
            name="appointmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo di Appuntamento</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona il tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="checkup">Visita di controllo</SelectItem>
                    <SelectItem value="firstVisit">Prima visita</SelectItem>
                    <SelectItem value="followUp">
                      Visita di follow-up
                    </SelectItem>
                    <SelectItem value="procedure">Procedura medica</SelectItem>
                    <SelectItem value="consultation">Consulto</SelectItem>
                    <SelectItem value="emergency">Emergenza</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Picker */}
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
                          "pl-3 text-left font-normal",
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
                      onSelect={(date) => {
                        field.onChange(date);
                        setDate(date);
                      }}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                      locale={it}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Selection */}
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orario</FormLabel>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input type="time" className="pl-10" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duration */}
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durata (minuti)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona la durata" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="15">15 minuti</SelectItem>
                    <SelectItem value="30">30 minuti</SelectItem>
                    <SelectItem value="45">45 minuti</SelectItem>
                    <SelectItem value="60">1 ora</SelectItem>
                    <SelectItem value="90">1 ora e 30 minuti</SelectItem>
                    <SelectItem value="120">2 ore</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* WhatsApp Notification */}
          <FormField
            control={form.control}
            name="sendWhatsAppNotification"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Notifica WhatsApp</FormLabel>
                  <FormDescription>
                    Invia una notifica WhatsApp al paziente
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

          {/* Google Calendar Sync */}
          <FormField
            control={form.control}
            name="googleCalendarSync"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Sincronizza con Google Calendar</FormLabel>
                  <FormDescription>
                    Aggiungi l'appuntamento al tuo Google Calendar
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
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Inserisci eventuali note sull'appuntamento"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else if (onClose) {
                onClose();
              }
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Annulla
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Salvataggio..." : isEditing ? "Aggiorna" : "Salva"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AppointmentForm;
