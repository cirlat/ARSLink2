import React, { useState } from "react";
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

const mockPatients = [
  { id: "1", name: "Maria Rossi" },
  { id: "2", name: "Giuseppe Verdi" },
  { id: "3", name: "Francesca Bianchi" },
  { id: "4", name: "Alessandro Romano" },
  { id: "5", name: "Lucia Ferrari" },
];

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

  const form = useForm<AppointmentFormData>({
    defaultValues: initialData,
  });

  const handleSubmit = (data: AppointmentFormData) => {
    // In un'implementazione reale, questo gestirebbe l'invio del form
    // e potenzialmente le chiamate API per la sincronizzazione con Google Calendar
    onSubmit(data);
    onClose();
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
                    {mockPatients.map((patient) => (
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
