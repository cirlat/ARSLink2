import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, getMonth, getYear } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarIcon,
  Save,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertCircle,
  Building,
  Plus,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Importa la lista dei comuni italiani dal file JSON
import comuniItalianiData from "@/data/comuni-italiani.json";

// Converte il formato dei dati per l'uso nel componente
const italianCities = comuniItalianiData.map((comune) => ({
  name: comune.nome,
  code: comune.codice,
}));

// Funzione per aggiungere un nuovo comune
const addCity = (name: string, code: string) => {
  italianCities.push({ name, code });
  // In un'implementazione reale, qui salveresti i dati in localStorage o in un database
};

// Schema di validazione del form
const formSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "Il nome deve contenere almeno 2 caratteri." }),
  lastName: z
    .string()
    .min(2, { message: "Il cognome deve contenere almeno 2 caratteri." }),
  gender: z.string(),
  dateOfBirth: z.date(),
  birthPlace: z
    .string()
    .min(1, { message: "La città di nascita è obbligatoria." }),
  email: z
    .string()
    .email({ message: "Inserisci un indirizzo email valido." })
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .min(5, { message: "Inserisci un numero di telefono valido." }),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  fiscalCode: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  notes: z.string().optional(),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: "Devi accettare l'informativa sulla privacy.",
  }),
  marketingConsent: z.boolean().optional(),
});

type PatientFormValues = z.infer<typeof formSchema>;

interface PatientFormProps {
  patient?: PatientFormValues;
  onSubmit?: (data: PatientFormValues) => void;
}

const PatientForm = ({ patient, onSubmit }: PatientFormProps = {}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");

  // Valori predefiniti per il form
  const defaultValues: Partial<PatientFormValues> = {
    firstName: "",
    lastName: "",
    gender: "male",
    dateOfBirth: new Date(1990, 0, 1),
    birthPlace: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    fiscalCode: "",
    medicalHistory: "",
    allergies: "",
    medications: "",
    notes: "",
    privacyConsent: false,
    marketingConsent: false,
    ...patient,
  };

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmit = (data: PatientFormValues) => {
    // Genera il Codice Fiscale se non fornito
    if (!data.fiscalCode) {
      // In un'implementazione reale, questa funzione genererebbe il codice
      // basato su nome, data di nascita, genere e luogo di nascita
      data.fiscalCode = "CODICE_FISCALE_GENERATO_AUTOMATICAMENTE";
    }

    if (onSubmit) {
      onSubmit(data);
    } else {
      console.log("Form inviato:", data);
    }

    // Torna alla lista pazienti dopo il salvataggio
    navigate("/patients");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white">
      <CardHeader>
        <CardTitle className="text-2xl">Informazioni Paziente</CardTitle>
        <CardDescription>
          Aggiungi un nuovo paziente o modifica le informazioni di un paziente
          esistente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="personal">
                  Informazioni Personali
                </TabsTrigger>
                <TabsTrigger value="medical">Informazioni Mediche</TabsTrigger>
              </TabsList>

              {/* Tab Informazioni Personali */}
              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Mario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cognome</FormLabel>
                        <FormControl>
                          <Input placeholder="Rossi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genere</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona genere" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Maschio</SelectItem>
                            <SelectItem value="female">Femmina</SelectItem>
                            <SelectItem value="other">Altro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data di Nascita</FormLabel>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="date"
                              value={
                                field.value
                                  ? format(field.value, "yyyy-MM-dd")
                                  : ""
                              }
                              onChange={(e) => {
                                const date = e.target.value
                                  ? new Date(e.target.value)
                                  : new Date();
                                field.onChange(date);
                              }}
                              className="w-full"
                            />
                          </div>

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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                locale={it}
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="birthPlace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Città di Nascita</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleziona città di nascita" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[200px] overflow-y-auto">
                                {italianCities.map((city) => (
                                  <SelectItem key={city.code} value={city.code}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              // Qui potresti aprire un modale per aggiungere una nuova città
                              const name = prompt(
                                "Inserisci il nome della città",
                              );
                              const code = prompt(
                                "Inserisci il codice catastale",
                              );
                              if (name && code) {
                                addCity(name, code);
                                field.onChange(code);
                              }
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Puoi aggiungere nuovi comuni cliccando sul pulsante +
                        </p>
                      </div>
                      <FormDescription>
                        Necessaria per la generazione del codice fiscale.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numero di Telefono</FormLabel>
                        <FormControl>
                          <Input placeholder="+39 123 456 7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="mario.rossi@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indirizzo</FormLabel>
                        <FormControl>
                          <Input placeholder="Via Roma 123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Città</FormLabel>
                        <FormControl>
                          <Input placeholder="Roma" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CAP</FormLabel>
                        <FormControl>
                          <Input placeholder="00100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fiscalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice Fiscale</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Verrà generato automaticamente se lasciato vuoto"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Il codice fiscale verrà generato automaticamente se
                        lasciato vuoto.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Consensi & Privacy */}
                <div className="space-y-4 mt-6 pt-4 border-t">
                  <h3 className="text-lg font-medium">Consensi & Privacy</h3>

                  <div className="bg-muted p-4 rounded-md mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h4 className="font-medium">
                          Informazioni sulla Privacy
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          I seguenti consensi sono necessari per il trattamento
                          dei dati del paziente in conformità con il GDPR e le
                          leggi italiane sulla privacy.
                        </p>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="privacyConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Consenso Privacy{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormDescription>
                            Acconsento al trattamento dei miei dati personali
                            per finalità sanitarie come descritto
                            nell'informativa sulla privacy.
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marketingConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Comunicazioni</FormLabel>
                          <FormDescription>
                            Acconsento a ricevere promemoria per appuntamenti,
                            follow-up e altre comunicazioni relative alla mia
                            assistenza sanitaria.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Tab Informazioni Mediche */}
              <TabsContent value="medical" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="medicalHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storia Clinica</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Inserisci la storia clinica rilevante..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergie</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Elenca eventuali allergie..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farmaci Attuali</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Elenca i farmaci attuali..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Aggiuntive</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Eventuali note o osservazioni aggiuntive..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <CardFooter className="px-0 pt-6 flex justify-between">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate("/patients")}
              >
                Annulla
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Salva Paziente
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PatientForm;
