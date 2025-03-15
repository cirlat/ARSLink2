import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Save, Plus, AlertCircle } from "lucide-react";
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

// Funzione per calcolare il carattere di controllo del codice fiscale
const calculateControlChar = (fiscalCode: string): string => {
  if (!fiscalCode || fiscalCode.length !== 15) return "X";

  const evenChars: { [key: string]: number } = {
    "0": 0,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    E: 4,
    F: 5,
    G: 6,
    H: 7,
    I: 8,
    J: 9,
    K: 10,
    L: 11,
    M: 12,
    N: 13,
    O: 14,
    P: 15,
    Q: 16,
    R: 17,
    S: 18,
    T: 19,
    U: 20,
    V: 21,
    W: 22,
    X: 23,
    Y: 24,
    Z: 25,
  };

  const oddChars: { [key: string]: number } = {
    "0": 1,
    "1": 0,
    "2": 5,
    "3": 7,
    "4": 9,
    "5": 13,
    "6": 15,
    "7": 17,
    "8": 19,
    "9": 21,
    A: 1,
    B: 0,
    C: 5,
    D: 7,
    E: 9,
    F: 13,
    G: 15,
    H: 17,
    I: 19,
    J: 21,
    K: 2,
    L: 4,
    M: 18,
    N: 20,
    O: 11,
    P: 3,
    Q: 6,
    R: 8,
    S: 12,
    T: 14,
    U: 16,
    V: 10,
    W: 22,
    X: 25,
    Y: 24,
    Z: 23,
  };

  let sum = 0;
  for (let i = 0; i < fiscalCode.length; i++) {
    const char = fiscalCode.charAt(i).toUpperCase();
    if (i % 2 === 0) {
      // Posizioni dispari (0-based index)
      sum += oddChars[char] || 0;
    } else {
      // Posizioni pari (0-based index)
      sum += evenChars[char] || 0;
    }
  }

  const remainder = sum % 26;
  return String.fromCharCode(65 + remainder); // A-Z
};

// Funzione per aggiungere un nuovo comune
const addCity = (name: string, code: string) => {
  // Aggiungi il nuovo comune all'array
  italianCities.push({ name, code });

  // Salva l'array aggiornato in localStorage
  try {
    const updatedCities = JSON.stringify(italianCities);
    localStorage.setItem("italianCities", updatedCities);

    // In un'implementazione reale, qui salveresti i dati nel database
    console.log(`Nuovo comune aggiunto: ${name} (${code})`);
  } catch (error) {
    console.error("Errore nel salvataggio dei comuni:", error);
  }
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

  // Carica i dati del paziente da sessionStorage se disponibili
  const [loadedPatient, setLoadedPatient] = useState<any>(null);

  useEffect(() => {
    // Check if we're in edit mode by looking at the URL
    const isEditMode = window.location.pathname.includes("/edit");

    if (isEditMode) {
      // Try to load patient data from sessionStorage
      const storedPatient = sessionStorage.getItem("editingPatient");
      if (storedPatient) {
        try {
          const patientData = JSON.parse(storedPatient);
          console.log("Loaded patient data from sessionStorage:", patientData);

          // Format the data for the form
          const formattedPatient = {
            firstName: patientData.name?.split(" ")[0] || "",
            lastName: patientData.name?.split(" ").slice(1).join(" ") || "",
            gender: patientData.gender || "male",
            dateOfBirth: patientData.date_of_birth
              ? new Date(patientData.date_of_birth)
              : new Date(1990, 0, 1),
            birthPlace: patientData.birth_place || "",
            email: patientData.email || "",
            phone: patientData.phone || "",
            address: patientData.address || "",
            city: patientData.city || "",
            postalCode: patientData.postal_code || "",
            fiscalCode: patientData.codice_fiscale || "",
            medicalHistory: patientData.medical_history || "",
            allergies: patientData.allergies || "",
            medications: patientData.medications || "",
            notes: patientData.notes || "",
            privacyConsent: patientData.privacy_consent || false,
            marketingConsent: patientData.marketing_consent || false,
          };

          setLoadedPatient(formattedPatient);

          // Update form values
          Object.keys(formattedPatient).forEach((key) => {
            form.setValue(key as any, formattedPatient[key]);
          });

          // Clear sessionStorage after loading
          sessionStorage.removeItem("editingPatient");
        } catch (error) {
          console.error(
            "Error parsing patient data from sessionStorage:",
            error,
          );
        }
      } else if (isEditMode) {
        // If we're in edit mode but don't have data in sessionStorage, try to load from URL
        const patientId = window.location.pathname
          .split("/")
          .filter(Boolean)
          .at(-2);
        if (patientId) {
          const loadPatientData = async () => {
            try {
              const { PatientModel } = await import("@/models/patient");
              const patientModel = new PatientModel();
              const patientData = await patientModel.findById(
                parseInt(patientId),
              );

              if (patientData) {
                // Format the data for the form
                const formattedPatient = {
                  firstName: patientData.name?.split(" ")[0] || "",
                  lastName:
                    patientData.name?.split(" ").slice(1).join(" ") || "",
                  gender: patientData.gender || "male",
                  dateOfBirth: patientData.date_of_birth
                    ? new Date(patientData.date_of_birth)
                    : new Date(1990, 0, 1),
                  birthPlace: patientData.birth_place || "",
                  email: patientData.email || "",
                  phone: patientData.phone || "",
                  address: patientData.address || "",
                  city: patientData.city || "",
                  postalCode: patientData.postal_code || "",
                  fiscalCode: patientData.codice_fiscale || "",
                  medicalHistory: patientData.medical_history || "",
                  allergies: patientData.allergies || "",
                  medications: patientData.medications || "",
                  notes: patientData.notes || "",
                  privacyConsent: patientData.privacy_consent || false,
                  marketingConsent: patientData.marketing_consent || false,
                };

                setLoadedPatient(formattedPatient);

                // Update form values
                Object.keys(formattedPatient).forEach((key) => {
                  form.setValue(key as any, formattedPatient[key]);
                });
              }
            } catch (error) {
              console.error("Error loading patient data from database:", error);
            }
          };

          loadPatientData();
        }
      }
    }
  }, []);

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
    ...loadedPatient,
  };

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Funzione per generare il codice fiscale
  const generateFiscalCode = (
    firstName: string,
    lastName: string,
    birthDate: Date,
    gender: string,
    birthPlace: string,
  ) => {
    try {
      // Trova il comune selezionato
      const selectedCity = italianCities.find(
        (city) => city.code === birthPlace,
      );
      if (!selectedCity) return "";

      // Estrai le consonanti dal cognome
      const lastNameConsonants = lastName
        .toUpperCase()
        .replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/g, "");
      // Estrai le vocali dal cognome
      const lastNameVowels = lastName.toUpperCase().replace(/[^AEIOU]/g, "");
      // Combina consonanti e vocali, prendi i primi 3 caratteri
      let lastNameCode = (
        lastNameConsonants +
        lastNameVowels +
        "XXX"
      ).substring(0, 3);

      // Estrai le consonanti dal nome
      const firstNameConsonants = firstName
        .toUpperCase()
        .replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/g, "");
      // Estrai le vocali dal nome
      const firstNameVowels = firstName.toUpperCase().replace(/[^AEIOU]/g, "");
      // Combina consonanti e vocali, prendi i primi 3 caratteri
      let firstNameCode;
      if (firstNameConsonants.length >= 4) {
        // Se ci sono almeno 4 consonanti, prendi la 1ª, 3ª e 4ª
        firstNameCode =
          firstNameConsonants[0] +
          firstNameConsonants[2] +
          firstNameConsonants[3];
      } else {
        // Altrimenti prendi le consonanti e aggiungi vocali se necessario
        firstNameCode = (
          firstNameConsonants +
          firstNameVowels +
          "XXX"
        ).substring(0, 3);
      }

      // Calcola il codice per la data di nascita e il genere
      const year = birthDate.getFullYear().toString().substring(2);
      const months = "ABCDEHLMPRST";
      const month = months.charAt(birthDate.getMonth());
      let day = birthDate.getDate().toString();
      if (gender === "female") {
        day = (birthDate.getDate() + 40).toString();
      }
      day = day.padStart(2, "0");

      // Codice del comune di nascita
      const birthPlaceCode = selectedCity.code;

      // Combina tutte le parti
      const fiscalCode = `${lastNameCode}${firstNameCode}${year}${month}${day}${birthPlaceCode}`;

      // Calcolo del carattere di controllo
      const controlChar = calculateControlChar(fiscalCode);
      return fiscalCode + controlChar;
    } catch (error) {
      console.error("Errore nella generazione del codice fiscale:", error);
      return "";
    }
  };

  // Carica i comuni da localStorage se disponibili
  useEffect(() => {
    const savedCities = localStorage.getItem("italianCities");
    if (savedCities) {
      try {
        const parsedCities = JSON.parse(savedCities);
        // Aggiorna l'array dei comuni con quelli salvati
        // Nota: in un'implementazione reale, dovresti gestire meglio questo aggiornamento
        // per evitare duplicati o problemi di concorrenza
        italianCities.length = 0; // Svuota l'array
        parsedCities.forEach((city: { name: string; code: string }) => {
          italianCities.push(city);
        });
      } catch (error) {
        console.error(
          "Errore nel caricamento dei comuni da localStorage:",
          error,
        );
      }
    }
  }, []);

  // Aggiorna il codice fiscale quando cambiano i campi rilevanti
  useEffect(() => {
    // Delay the execution slightly to ensure all form values are updated
    const timer = setTimeout(() => {
      const values = form.getValues();
      if (
        values.firstName &&
        values.lastName &&
        values.dateOfBirth &&
        values.gender &&
        values.birthPlace
      ) {
        console.log("Regenerating fiscal code with values:", {
          firstName: values.firstName,
          lastName: values.lastName,
          dateOfBirth: values.dateOfBirth,
          gender: values.gender,
          birthPlace: values.birthPlace,
        });

        const fiscalCode = generateFiscalCode(
          values.firstName,
          values.lastName,
          values.dateOfBirth,
          values.gender,
          values.birthPlace,
        );

        console.log("Generated fiscal code:", fiscalCode);
        form.setValue("fiscalCode", fiscalCode, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }, 100); // Small delay to ensure form values are updated

    return () => clearTimeout(timer);
  }, [
    form.watch("firstName"),
    form.watch("lastName"),
    form.watch("dateOfBirth"),
    form.watch("gender"),
    form.watch("birthPlace"),
  ]);

  const handleSubmit = async (data: PatientFormValues) => {
    // Genera il Codice Fiscale se non fornito
    if (!data.fiscalCode) {
      data.fiscalCode = generateFiscalCode(
        data.firstName,
        data.lastName,
        data.dateOfBirth,
        data.gender,
        data.birthPlace,
      );
    }

    if (onSubmit) {
      onSubmit(data);
    } else {
      console.log("Form inviato:", data);

      try {
        // Salva il paziente nel database
        const { PatientModel } = await import("@/models/patient");
        const patientModel = new PatientModel();

        // Converti i dati dal form al formato del modello
        const patientData = {
          name: `${data.firstName} ${data.lastName}`,
          codice_fiscale: data.fiscalCode || "",
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          email: data.email || "",
          phone: data.phone,
          address: data.address || "",
          city: data.city || "",
          postal_code: data.postalCode || "",
          medical_history: data.medicalHistory || "",
          allergies: data.allergies || "",
          medications: data.medications || "",
          notes: data.notes || "",
          privacy_consent: data.privacyConsent,
          marketing_consent: data.marketingConsent || false,
        };

        const savedPatient = await patientModel.create(patientData);
        console.log("Paziente salvato nel database:", savedPatient);
      } catch (error) {
        console.error(
          "Errore nel salvataggio del paziente nel database:",
          error,
        );
        alert(
          "Si è verificato un errore nel salvataggio del paziente. Riprova.",
        );
        return;
      }
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
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <FormControl>
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
                                    : null;
                                  if (date) {
                                    field.onChange(date);
                                  }
                                }}
                                max={format(new Date(), "yyyy-MM-dd")}
                                min="1900-01-01"
                              />
                            </FormControl>
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                size="icon"
                                type="button"
                              >
                                <CalendarIcon className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
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
                        <FormDescription>
                          Puoi inserire la data manualmente o utilizzare il
                          calendario
                        </FormDescription>
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
