import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Database,
  Download,
  Key,
  Lock,
  Server,
  Settings,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Importazioni dinamiche per evitare errori di riferimento
import { verifyLicenseKey } from "@/utils/licenseUtils";

const SetupWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const totalSteps = 7;

  // Database configuration
  const [dbConfig, setDbConfig] = useState({
    host: "localhost",
    port: "5432",
    username: "postgres",
    password: "",
    dbName: "patient_appointment_system",
  });

  // Admin user
  const [adminUser, setAdminUser] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
  });

  // License
  const [licenseType, setLicenseType] = useState("basic");
  const [licenseKey, setLicenseKey] = useState("");
  const [detectedLicenseType, setDetectedLicenseType] = useState<string | null>(
    null,
  );

  // Google Calendar
  const [googleConfig, setGoogleConfig] = useState({
    clientId: "",
    clientSecret: "",
    redirectUri: "http://localhost:3000/auth/google/callback",
  });

  // WhatsApp
  const [whatsappConfig, setWhatsappConfig] = useState({
    enabled: false,
    browserPath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    dataPath: "C:\\ProgramData\\PatientAppointmentSystem\\WhatsApp",
  });

  // Server settings
  const [serverConfig, setServerConfig] = useState({
    port: "3000",
    autoStart: true,
    startWithWindows: true,
  });

  // Impostazioni generali
  const [clinicName, setClinicName] = useState("Studio Medico Dr. Rossi");
  const [address, setAddress] = useState("Via Roma 123, 00100 Roma");
  const [email, setEmail] = useState("info@studiomedico.it");
  const [phone, setPhone] = useState("+39 06 12345678");
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("it");

  // Impostazioni backup
  const [backupPath, setBackupPath] = useState(
    "C:\\ProgramData\\PatientAppointmentSystem\\Backups",
  );
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");

  // Utente assistente
  const [createAssistant, setCreateAssistant] = useState(false);
  const [assistantName, setAssistantName] = useState("");
  const [assistantUsername, setAssistantUsername] = useState("");
  const [assistantPassword, setAssistantPassword] = useState("");
  const [assistantEmail, setAssistantEmail] = useState("");

  const handleDbConfigChange = (field: string, value: string) => {
    setDbConfig({ ...dbConfig, [field]: value });
  };

  const handleAdminUserChange = (field: string, value: string) => {
    setAdminUser({ ...adminUser, [field]: value });
  };

  const handleGoogleConfigChange = (field: string, value: string) => {
    setGoogleConfig({ ...googleConfig, [field]: value });
  };

  const handleWhatsappConfigChange = (
    field: string,
    value: string | boolean,
  ) => {
    setWhatsappConfig({ ...whatsappConfig, [field]: value });
  };

  const handleServerConfigChange = (field: string, value: string | boolean) => {
    setServerConfig({ ...serverConfig, [field]: value });
  };

  const isLicenseWithGoogle = () => {
    if (detectedLicenseType) {
      return detectedLicenseType === "google" || detectedLicenseType === "full";
    }
    return false;
  };

  const isLicenseWithWhatsApp = () => {
    if (detectedLicenseType) {
      return (
        detectedLicenseType === "whatsapp" || detectedLicenseType === "full"
      );
    }
    return false;
  };

  const handleNextStep = () => {
    if (currentStep < 7) {
      // Aumentato il numero di step
      setCurrentStep(currentStep + 1);
      setProgress(Math.floor(((currentStep + 1) * 100) / 7)); // Aggiornato il calcolo del progresso
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setProgress(Math.floor(((currentStep - 1) * 100) / 7)); // Aggiornato il calcolo del progresso
    }
  };

  const handleFinish = () => {
    // Salva le impostazioni generali
    const generalSettings = {
      clinicName,
      address,
      email,
      phone,
      darkMode,
      language,
    };
    localStorage.setItem("generalSettings", JSON.stringify(generalSettings));

    // Salva le impostazioni di backup
    const backupSettings = {
      autoBackup,
      backupFrequency,
      backupPath,
    };
    localStorage.setItem("backupSettings", JSON.stringify(backupSettings));

    // Crea l'utente admin
    localStorage.setItem("setupCompleted", "true");
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        username: adminUser.username,
        full_name: adminUser.fullName,
        email: adminUser.email,
        role: "Medico",
      }),
    );

    // Salva gli utenti nel localStorage
    const users = [
      {
        id: 1,
        username: adminUser.username,
        password: adminUser.password, // In un'app reale, questa password sarebbe hashata
        full_name: adminUser.fullName,
        email: adminUser.email,
        role: "Medico",
      },
    ];

    // Aggiungi l'utente assistente se richiesto
    if (
      createAssistant &&
      assistantName &&
      assistantUsername &&
      assistantPassword &&
      assistantEmail
    ) {
      users.push({
        id: 2,
        username: assistantUsername,
        password: assistantPassword,
        full_name: assistantName,
        email: assistantEmail,
        role: "Assistente",
      });
    }

    localStorage.setItem("users", JSON.stringify(users));

    // Salva la licenza
    localStorage.setItem("licenseKey", licenseKey);
    localStorage.setItem("licenseType", "full"); // Per scopi dimostrativi
    localStorage.setItem(
      "licenseExpiry",
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    ); // 1 anno

    // Applica la modalità scura se selezionata
    if (darkMode) {
      document.documentElement.classList.add("dark");
    }

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Setup Wizard</h1>
          <p className="text-muted-foreground">
            Configurazione iniziale del Sistema di Gestione Appuntamenti
          </p>
        </div>

        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Passo {currentStep} di {totalSteps}
          </span>
          <span>{Math.round(progress)}% completato</span>
        </div>

        <Card>
          <CardContent className="pt-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4">
                  Configurazione Database
                </h2>
                <p className="text-muted-foreground mb-6">
                  Configura la connessione al database PostgreSQL
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="db-host">Host</Label>
                    <Input
                      id="db-host"
                      value={dbConfig.host}
                      onChange={(e) =>
                        handleDbConfigChange("host", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="db-port">Porta</Label>
                    <Input
                      id="db-port"
                      value={dbConfig.port}
                      onChange={(e) =>
                        handleDbConfigChange("port", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="db-username">Nome Utente</Label>
                    <Input
                      id="db-username"
                      value={dbConfig.username}
                      onChange={(e) =>
                        handleDbConfigChange("username", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="db-password">Password</Label>
                    <Input
                      id="db-password"
                      type="password"
                      value={dbConfig.password}
                      onChange={(e) =>
                        handleDbConfigChange("password", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="db-name">Nome Database</Label>
                    <Input
                      id="db-name"
                      value={dbConfig.dbName}
                      onChange={(e) =>
                        handleDbConfigChange("dbName", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4">
                  Utente Amministratore
                </h2>
                <p className="text-muted-foreground mb-6">
                  Crea l'utente amministratore per il sistema
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-fullname">Nome Completo</Label>
                    <Input
                      id="admin-fullname"
                      value={adminUser.fullName}
                      onChange={(e) =>
                        handleAdminUserChange("fullName", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-username">Nome Utente</Label>
                    <Input
                      id="admin-username"
                      value={adminUser.username}
                      onChange={(e) =>
                        handleAdminUserChange("username", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminUser.email}
                      onChange={(e) =>
                        handleAdminUserChange("email", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminUser.password}
                      onChange={(e) =>
                        handleAdminUserChange("password", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-confirm-password">
                      Conferma Password
                    </Label>
                    <Input
                      id="admin-confirm-password"
                      type="password"
                      value={adminUser.confirmPassword}
                      onChange={(e) =>
                        handleAdminUserChange("confirmPassword", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4">Licenza</h2>
                <p className="text-muted-foreground mb-6">
                  Inserisci la chiave di licenza per attivare il software
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="license-key">Chiave di Licenza</Label>
                    <Input
                      id="license-key"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo di Licenza</Label>
                    <RadioGroup
                      value={licenseType}
                      onValueChange={(value) => setLicenseType(value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="basic" id="license-basic" />
                        <Label htmlFor="license-basic">Base</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="google" id="license-google" />
                        <Label htmlFor="license-google">Google Calendar</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="whatsapp"
                          id="license-whatsapp"
                        />
                        <Label htmlFor="license-whatsapp">WhatsApp</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full" id="license-full" />
                        <Label htmlFor="license-full">Completa</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4">Integrazioni</h2>
                <p className="text-muted-foreground mb-6">
                  Configura le integrazioni con servizi esterni
                </p>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Google Calendar</h3>
                    <div className="space-y-2">
                      <Label htmlFor="google-client-id">Client ID</Label>
                      <Input
                        id="google-client-id"
                        value={googleConfig.clientId}
                        onChange={(e) =>
                          handleGoogleConfigChange("clientId", e.target.value)
                        }
                        disabled={!isLicenseWithGoogle()}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="google-client-secret">
                        Client Secret
                      </Label>
                      <Input
                        id="google-client-secret"
                        type="password"
                        value={googleConfig.clientSecret}
                        onChange={(e) =>
                          handleGoogleConfigChange(
                            "clientSecret",
                            e.target.value,
                          )
                        }
                        disabled={!isLicenseWithGoogle()}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="google-redirect-uri">Redirect URI</Label>
                      <Input
                        id="google-redirect-uri"
                        value={googleConfig.redirectUri}
                        onChange={(e) =>
                          handleGoogleConfigChange(
                            "redirectUri",
                            e.target.value,
                          )
                        }
                        disabled={!isLicenseWithGoogle()}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">WhatsApp</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="whatsapp-enabled"
                        checked={whatsappConfig.enabled}
                        onCheckedChange={(checked) =>
                          handleWhatsappConfigChange(
                            "enabled",
                            checked === true,
                          )
                        }
                        disabled={!isLicenseWithWhatsApp()}
                      />
                      <Label htmlFor="whatsapp-enabled">
                        Abilita Integrazione WhatsApp
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-browser-path">
                        Percorso Browser
                      </Label>
                      <Input
                        id="whatsapp-browser-path"
                        value={whatsappConfig.browserPath}
                        onChange={(e) =>
                          handleWhatsappConfigChange(
                            "browserPath",
                            e.target.value,
                          )
                        }
                        disabled={
                          !isLicenseWithWhatsApp() || !whatsappConfig.enabled
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-data-path">
                        Percorso Dati WhatsApp
                      </Label>
                      <Input
                        id="whatsapp-data-path"
                        value={whatsappConfig.dataPath}
                        onChange={(e) =>
                          handleWhatsappConfigChange("dataPath", e.target.value)
                        }
                        disabled={
                          !isLicenseWithWhatsApp() || !whatsappConfig.enabled
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4">
                  Impostazioni Generali
                </h2>
                <p className="text-muted-foreground mb-6">
                  Configura le informazioni generali dello studio medico
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinic-name">Nome Studio Medico</Label>
                    <Input
                      id="clinic-name"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Indirizzo</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dark-mode"
                      checked={darkMode}
                      onCheckedChange={(checked) =>
                        setDarkMode(checked === true)
                      }
                    />
                    <Label htmlFor="dark-mode">Modalità Scura</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Lingua</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Seleziona lingua" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4">Backup e Ripristino</h2>
                <p className="text-muted-foreground mb-6">
                  Configura le impostazioni di backup automatico
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-backup"
                      checked={autoBackup}
                      onCheckedChange={(checked) =>
                        setAutoBackup(checked === true)
                      }
                    />
                    <Label htmlFor="auto-backup">
                      Abilita Backup Automatico
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backup-frequency">Frequenza Backup</Label>
                    <Select
                      value={backupFrequency}
                      onValueChange={setBackupFrequency}
                      disabled={!autoBackup}
                    >
                      <SelectTrigger id="backup-frequency">
                        <SelectValue placeholder="Seleziona frequenza" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Giornaliero</SelectItem>
                        <SelectItem value="weekly">Settimanale</SelectItem>
                        <SelectItem value="monthly">Mensile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backup-path">Percorso Backup</Label>
                    <Input
                      id="backup-path"
                      value={backupPath}
                      onChange={(e) => setBackupPath(e.target.value)}
                      disabled={!autoBackup}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4">
                  Utente Assistente (Opzionale)
                </h2>
                <p className="text-muted-foreground mb-6">
                  Crea un utente assistente per il sistema
                </p>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create-assistant"
                      checked={createAssistant}
                      onCheckedChange={(checked) =>
                        setCreateAssistant(checked === true)
                      }
                    />
                    <Label htmlFor="create-assistant">
                      Crea Utente Assistente
                    </Label>
                  </div>

                  {createAssistant && (
                    <div className="space-y-4 pl-6 border-l-2 border-slate-200">
                      <div className="space-y-2">
                        <Label htmlFor="assistant-name">Nome Completo</Label>
                        <Input
                          id="assistant-name"
                          value={assistantName}
                          onChange={(e) => setAssistantName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="assistant-username">Nome Utente</Label>
                        <Input
                          id="assistant-username"
                          value={assistantUsername}
                          onChange={(e) => setAssistantUsername(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="assistant-email">Email</Label>
                        <Input
                          id="assistant-email"
                          type="email"
                          value={assistantEmail}
                          onChange={(e) => setAssistantEmail(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="assistant-password">Password</Label>
                        <Input
                          id="assistant-password"
                          type="password"
                          value={assistantPassword}
                          onChange={(e) => setAssistantPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t p-4">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Indietro
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNextStep}>
                Avanti
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish}>
                Completa Setup
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SetupWizard;
