import React, { useState } from "react";
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

const SetupWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const totalSteps = 6;

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

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setProgress(((currentStep + 1) / totalSteps) * 100);
    } else {
      // Complete setup
      completeSetup();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setProgress(((currentStep - 1) / totalSteps) * 100);
    }
  };

  const completeSetup = async () => {
    try {
      // 1. Inizializza il database
      const database = Database.getInstance();
      await database.initializeDatabase();

      // 2. Crea l'utente amministratore
      const userModel = new UserModel();
      await userModel.create({
        username: adminUser.username,
        password: adminUser.password,
        full_name: adminUser.fullName,
        email: adminUser.email,
        role: "Medico",
      });

      // 3. Installa e valida la licenza
      if (licenseKey) {
        const { installLicense } = await import("@/utils/licenseUtils");
        const licenseResult = await installLicense(licenseKey);

        if (!licenseResult.success) {
          alert(`Errore con la licenza: ${licenseResult.message}`);
          return;
        }

        // Salva il tipo di licenza per l'uso nell'applicazione
        localStorage.setItem("licenseType", licenseResult.licenseType || "");
      } else {
        // Licenza base di default
        localStorage.setItem("licenseType", "basic");
      }

      // 4. Configura Google Calendar se necessario
      if (
        isLicenseWithGoogle() &&
        googleConfig.clientId &&
        googleConfig.clientSecret
      ) {
        localStorage.setItem("googleConfig", JSON.stringify(googleConfig));
      }

      // 5. Configura WhatsApp se necessario
      if (isLicenseWithWhatsApp() && whatsappConfig.enabled) {
        localStorage.setItem("whatsappConfig", JSON.stringify(whatsappConfig));
      }

      // 6. Salva le configurazioni del server
      localStorage.setItem("serverConfig", JSON.stringify(serverConfig));

      // 7. Salva le configurazioni del database
      localStorage.setItem("dbConfig", JSON.stringify(dbConfig));

      console.log("Setup completato con successo!");

      // Reindirizza alla pagina di login
      navigate("/");
    } catch (error) {
      console.error("Errore durante il setup:", error);
      alert(
        "Si è verificato un errore durante il setup. Controlla la console per i dettagli.",
      );
    }
  };

  const isLicenseWithGoogle = () => {
    return licenseType === "google" || licenseType === "full";
  };

  const isLicenseWithWhatsApp = () => {
    return licenseType === "whatsapp" || licenseType === "full";
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Configurazione Database
              </CardTitle>
              <CardDescription>
                Configura la connessione al database PostgreSQL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="db-host">Host</Label>
                <Input
                  id="db-host"
                  value={dbConfig.host}
                  onChange={(e) => handleDbConfigChange("host", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="db-port">Porta</Label>
                <Input
                  id="db-port"
                  value={dbConfig.port}
                  onChange={(e) => handleDbConfigChange("port", e.target.value)}
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

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(
                      "https://www.postgresql.org/download/",
                      "_blank",
                    )
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Scarica PostgreSQL
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    alert("Test connessione simulato: Connessione riuscita!")
                  }
                >
                  <Database className="mr-2 h-4 w-4" />
                  Testa Connessione
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Creazione Utente Amministratore
              </CardTitle>
              <CardDescription>
                Crea l'utente amministratore principale per il sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="mr-2 h-5 w-5" />
                Installazione Licenza
              </CardTitle>
              <CardDescription>
                Seleziona il tipo di licenza e inserisci la chiave
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Tipo di Licenza</Label>
                <RadioGroup
                  value={licenseType}
                  onValueChange={setLicenseType}
                  className="space-y-4"
                >
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <RadioGroupItem value="basic" id="license-basic" />
                    <div className="space-y-1 leading-none">
                      <Label
                        htmlFor="license-basic"
                        className="font-medium cursor-pointer"
                      >
                        Licenza Base
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Funzionalità di base senza sincronizzazione Google
                        Calendar o notifiche WhatsApp
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <RadioGroupItem value="google" id="license-google" />
                    <div className="space-y-1 leading-none">
                      <Label
                        htmlFor="license-google"
                        className="font-medium cursor-pointer"
                      >
                        Licenza Base + Google Calendar
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Include sincronizzazione con Google Calendar
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <RadioGroupItem value="whatsapp" id="license-whatsapp" />
                    <div className="space-y-1 leading-none">
                      <Label
                        htmlFor="license-whatsapp"
                        className="font-medium cursor-pointer"
                      >
                        Licenza Base + WhatsApp
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Include notifiche via WhatsApp
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                    <RadioGroupItem value="full" id="license-full" />
                    <div className="space-y-1 leading-none">
                      <Label
                        htmlFor="license-full"
                        className="font-medium cursor-pointer"
                      >
                        Licenza Completa
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Include sincronizzazione Google Calendar e notifiche
                        WhatsApp
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="license-key">Chiave di Licenza</Label>
                <Input
                  id="license-key"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                />
                <p className="text-sm text-muted-foreground">
                  La licenza ha validità di 1 anno dalla data di attivazione
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() =>
                  alert(
                    "Verifica licenza simulata: Licenza valida fino al " +
                      new Date(
                        new Date().setFullYear(new Date().getFullYear() + 1),
                      ).toLocaleDateString(),
                  )
                }
              >
                <Check className="mr-2 h-4 w-4" />
                Verifica Licenza
              </Button>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Configurazione Google Calendar
              </CardTitle>
              <CardDescription>
                {isLicenseWithGoogle()
                  ? "Configura l'integrazione con Google Calendar"
                  : "Questa funzionalità non è disponibile con la licenza selezionata"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLicenseWithGoogle() ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="google-client-id">Client ID</Label>
                    <Input
                      id="google-client-id"
                      value={googleConfig.clientId}
                      onChange={(e) =>
                        handleGoogleConfigChange("clientId", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google-client-secret">Client Secret</Label>
                    <Input
                      id="google-client-secret"
                      type="password"
                      value={googleConfig.clientSecret}
                      onChange={(e) =>
                        handleGoogleConfigChange("clientSecret", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google-redirect-uri">
                      URI di Reindirizzamento
                    </Label>
                    <Input
                      id="google-redirect-uri"
                      value={googleConfig.redirectUri}
                      onChange={(e) =>
                        handleGoogleConfigChange("redirectUri", e.target.value)
                      }
                    />
                  </div>

                  <div className="pt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Per ottenere le credenziali Google Calendar:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                      <li>Vai alla Console Google Cloud</li>
                      <li>Crea un nuovo progetto</li>
                      <li>Abilita l'API Google Calendar</li>
                      <li>Configura la schermata di consenso OAuth</li>
                      <li>Crea credenziali OAuth 2.0</li>
                    </ol>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() =>
                        window.open(
                          "https://console.cloud.google.com/",
                          "_blank",
                        )
                      }
                    >
                      Apri Google Cloud Console
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">
                    Funzionalità non disponibile
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    L'integrazione con Google Calendar è disponibile solo con le
                    licenze che includono questa funzionalità. Aggiorna la tua
                    licenza per sbloccare questa funzione.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setCurrentStep(3);
                      setProgress((3 / totalSteps) * 100);
                    }}
                  >
                    Torna alla selezione della licenza
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Configurazione WhatsApp
              </CardTitle>
              <CardDescription>
                {isLicenseWithWhatsApp()
                  ? "Configura l'integrazione con WhatsApp per le notifiche"
                  : "Questa funzionalità non è disponibile con la licenza selezionata"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLicenseWithWhatsApp() ? (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="whatsapp-enabled"
                      checked={whatsappConfig.enabled}
                      onCheckedChange={(checked) =>
                        handleWhatsappConfigChange("enabled", checked === true)
                      }
                    />
                    <Label htmlFor="whatsapp-enabled">
                      Abilita notifiche WhatsApp
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
                      disabled={!whatsappConfig.enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Percorso al browser Chrome/Chromium per l'automazione
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-data-path">Percorso Dati</Label>
                    <Input
                      id="whatsapp-data-path"
                      value={whatsappConfig.dataPath}
                      onChange={(e) =>
                        handleWhatsappConfigChange("dataPath", e.target.value)
                      }
                      disabled={!whatsappConfig.enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Percorso dove salvare i dati della sessione WhatsApp
                    </p>
                  </div>

                  <div className="pt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Nota: L'integrazione WhatsApp utilizza Selenium per
                      automatizzare WhatsApp Web. È necessario avere Chrome o
                      Chromium installato sul sistema.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Al primo avvio, sarà necessario scansionare il codice QR
                      con il telefono per autenticare WhatsApp Web.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">
                    Funzionalità non disponibile
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Le notifiche WhatsApp sono disponibili solo con le licenze
                    che includono questa funzionalità. Aggiorna la tua licenza
                    per sbloccare questa funzione.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setCurrentStep(3);
                      setProgress((3 / totalSteps) * 100);
                    }}
                  >
                    Torna alla selezione della licenza
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="mr-2 h-5 w-5" />
                Configurazione Server
              </CardTitle>
              <CardDescription>
                Configura le impostazioni del server dell'applicazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="server-port">Porta Server</Label>
                <Input
                  id="server-port"
                  value={serverConfig.port}
                  onChange={(e) =>
                    handleServerConfigChange("port", e.target.value)
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="server-autostart"
                  checked={serverConfig.autoStart}
                  onCheckedChange={(checked) =>
                    handleServerConfigChange("autoStart", checked === true)
                  }
                />
                <Label htmlFor="server-autostart">
                  Avvia automaticamente il server all'apertura dell'applicazione
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="server-windows-startup"
                  checked={serverConfig.startWithWindows}
                  onCheckedChange={(checked) =>
                    handleServerConfigChange(
                      "startWithWindows",
                      checked === true,
                    )
                  }
                />
                <Label htmlFor="server-windows-startup">
                  Avvia automaticamente all'avvio di Windows
                </Label>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">
                  Riepilogo Configurazione
                </h3>
                <div className="rounded-md bg-muted p-4 text-sm">
                  <p>
                    <strong>Database:</strong> {dbConfig.host}:{dbConfig.port}/
                    {dbConfig.dbName}
                  </p>
                  <p>
                    <strong>Utente Admin:</strong> {adminUser.username}
                  </p>
                  <p>
                    <strong>Tipo Licenza:</strong>{" "}
                    {licenseType === "basic"
                      ? "Base"
                      : licenseType === "google"
                        ? "Base + Google Calendar"
                        : licenseType === "whatsapp"
                          ? "Base + WhatsApp"
                          : "Completa"}
                  </p>
                  <p>
                    <strong>Google Calendar:</strong>{" "}
                    {isLicenseWithGoogle() ? "Configurato" : "Non disponibile"}
                  </p>
                  <p>
                    <strong>WhatsApp:</strong>{" "}
                    {isLicenseWithWhatsApp()
                      ? whatsappConfig.enabled
                        ? "Abilitato"
                        : "Disabilitato"
                      : "Non disponibile"}
                  </p>
                  <p>
                    <strong>Porta Server:</strong> {serverConfig.port}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
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

        {renderStep()}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>

          <Button onClick={nextStep}>
            {currentStep === totalSteps ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Completa Setup
              </>
            ) : (
              <>
                Avanti
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
