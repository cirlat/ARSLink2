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
import { Switch } from "@/components/ui/switch";

// Importazioni dinamiche per evitare errori di riferimento
import { verifyLicenseKey } from "@/utils/licenseUtils";
import { electronAPI, isRunningInElectron } from "@/lib/electronBridge";
import {
  testDatabaseConnection,
  initializeDatabase,
  createTable,
} from "@/utils/dbUtils";

interface SetupWizardProps {}

const SetupWizard: React.FC<SetupWizardProps> = () => {
  // Fix per il problema del passo 7 vuoto
  useEffect(() => {
    // Assicuriamoci che il componente Switch sia correttamente importato e disponibile
    console.log("Setup Wizard montato, Switch disponibile:", !!Switch);
  }, []);

  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const totalSteps = 8;

  // Database configuration
  const [dbConfig, setDbConfig] = useState({
    host: "localhost",
    port: "5432",
    username: "postgres",
    password: "",
    dbName: "patient_appointment_system",
  });

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // Connection logs for detailed feedback
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);

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

  // Backup settings
  const [backupConfig, setBackupConfig] = useState({
    backupPath: "C:\\ProgramData\\PatientAppointmentSystem\\Backups",
    autoBackup: true,
    backupFrequency: "daily",
  });

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    clinicName: "Studio Medico Dr. Rossi",
    address: "Via Roma 123, 00100 Roma",
    email: "info@studiomedico.it",
    phone: "+39 06 12345678",
    darkMode: false,
    language: "it",
  });

  // Loading state for database operations
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [dbConnectionStatus, setDbConnectionStatus] = useState<{
    status: "idle" | "success" | "error";
    message: string;
  }>({
    status: "idle",
    message: "",
  });

  const handleDbConfigChange = (field: string, value: string) => {
    setDbConfig({ ...dbConfig, [field]: value });
    // Reset connection status when config changes
    setDbConnectionStatus({ status: "idle", message: "" });
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

  const handleBackupConfigChange = (field: string, value: string | boolean) => {
    setBackupConfig({ ...backupConfig, [field]: value });
  };

  const handleGeneralSettingsChange = (
    field: string,
    value: string | boolean,
  ) => {
    setGeneralSettings({ ...generalSettings, [field]: value });
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

  const addConnectionLog = (message: string) => {
    setConnectionLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testConnection = async () => {
    try {
      // Verifica che tutti i campi siano compilati
      if (
        !dbConfig.host ||
        !dbConfig.port ||
        !dbConfig.username ||
        !dbConfig.dbName
      ) {
        setDbConnectionStatus({
          status: "error",
          message: "Compila tutti i campi prima di testare la connessione",
        });
        return;
      }

      // Imposta lo stato di caricamento
      setIsDbLoading(true);
      setDbConnectionStatus({ status: "idle", message: "" });
      setConnectionLogs([]);
      addConnectionLog("Avvio test di connessione al database...");

      // Verifica se la porta è un numero valido
      const port = parseInt(dbConfig.port);
      if (isNaN(port) || port <= 0 || port > 65535) {
        setDbConnectionStatus({
          status: "error",
          message: "La porta deve essere un numero valido tra 1 e 65535",
        });
        addConnectionLog(
          "Errore: La porta deve essere un numero valido tra 1 e 65535",
        );
        setIsDbLoading(false);
        return;
      }

      // Verifica che l'host sia in un formato valido
      const hostRegex = /^[a-zA-Z0-9.-]+$/;
      if (!hostRegex.test(dbConfig.host)) {
        setDbConnectionStatus({
          status: "error",
          message: "Formato host non valido",
        });
        addConnectionLog("Errore: Formato host non valido");
        setIsDbLoading(false);
        return;
      }

      addConnectionLog(
        `Tentativo di connessione a ${dbConfig.host}:${dbConfig.port}...`,
      );

      // Save the database configuration to localStorage and Electron before connecting
      try {
        const configToSave = {
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password || "",
          dbName: dbConfig.dbName,
        };

        localStorage.setItem("dbConfig", JSON.stringify(configToSave));

        // Also save it to window object for immediate access
        window.dbConfigTemp = configToSave;

        // Save to Electron's storage if in Electron environment
        if (isRunningInElectron()) {
          try {
            if (typeof electronAPI.saveDbConfig === "function") {
              const saveResult = await electronAPI.saveDbConfig(configToSave);
              if (saveResult.success) {
                addConnectionLog(
                  "Configurazione salvata nel processo principale di Electron",
                );
              } else {
                addConnectionLog(
                  `Errore nel salvataggio in Electron: ${saveResult.error}`,
                );
              }
            } else {
              addConnectionLog(
                "Funzione saveDbConfig non disponibile, configurazione salvata solo in localStorage",
              );
            }
          } catch (electronError) {
            console.error("Error saving to Electron:", electronError);
            addConnectionLog(
              `Errore nel salvataggio in Electron: ${electronError.message}`,
            );
          }
        }

        // Log successful configuration save
        console.log("Database configuration saved successfully", configToSave);
      } catch (storageError) {
        console.error("Error saving database configuration:", storageError);
        addConnectionLog(
          `Errore nel salvataggio della configurazione: ${storageError.message}`,
        );
      }

      // Usa l'API Electron per testare la connessione
      const result = await electronAPI.connectDatabase({
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.username,
        password: dbConfig.password || "", // Ensure password is always a string
        dbName: dbConfig.dbName,
      });

      if (result.success) {
        addConnectionLog("Connessione al database riuscita!");
        addConnectionLog("Verifica delle tabelle in corso...");

        // Crea le tabelle necessarie
        const tables = [
          "users",
          "patients",
          "appointments",
          "license",
          "configurations",
        ];

        for (const table of tables) {
          addConnectionLog(`Creazione tabella ${table}...`);
          try {
            const tableResult = await createTable(dbConfig, table);
            if (tableResult) {
              addConnectionLog(
                `Tabella ${table} creata/verificata con successo`,
              );
            } else {
              addConnectionLog(`Errore nella creazione della tabella ${table}`);
            }
          } catch (tableError) {
            addConnectionLog(
              `Errore nella creazione della tabella ${table}: ${tableError.message}`,
            );
          }
        }

        setDbConnectionStatus({
          status: "success",
          message: "Connessione riuscita! " + (result.message || ""),
        });
        addConnectionLog("Setup database completato con successo");
      } else {
        setDbConnectionStatus({
          status: "error",
          message: result.error || "Errore di connessione al database",
        });
        addConnectionLog(
          `Errore di connessione: ${result.error || "Errore sconosciuto"}`,
        );
      }
    } catch (error) {
      setDbConnectionStatus({
        status: "error",
        message:
          error.message || "Errore sconosciuto durante il test di connessione",
      });
      addConnectionLog(
        `Errore: ${error.message || "Errore sconosciuto durante il test di connessione"}`,
      );
    } finally {
      setIsDbLoading(false);
    }
  };

  const nextStep = () => {
    // Validazione specifica per ogni step
    if (currentStep === 1) {
      // Validazione per lo step del database
      if (
        !dbConfig.host ||
        !dbConfig.port ||
        !dbConfig.username ||
        !dbConfig.dbName
      ) {
        alert("Compila tutti i campi del database prima di procedere.");
        return;
      }

      // Verifica se la porta è un numero valido
      const port = parseInt(dbConfig.port);
      if (isNaN(port) || port <= 0 || port > 65535) {
        alert("La porta deve essere un numero valido tra 1 e 65535");
        return;
      }

      // Se non è stato fatto un test di connessione con successo, chiedi conferma
      if (dbConnectionStatus.status !== "success") {
        const confirm = window.confirm(
          "Non hai testato la connessione al database o il test non è riuscito. Vuoi procedere comunque?",
        );
        if (!confirm) return;
      }
    } else if (currentStep === 2) {
      // Validazione per lo step dell'utente amministratore
      if (
        !adminUser.username ||
        !adminUser.password ||
        !adminUser.fullName ||
        !adminUser.email
      ) {
        alert("Compila tutti i campi obbligatori prima di procedere.");
        return;
      }

      // Verifica che le password corrispondano
      if (adminUser.password !== adminUser.confirmPassword) {
        alert("Le password non corrispondono. Verifica e riprova.");
        return;
      }
    } else if (currentStep === 3) {
      // Validazione per lo step della licenza
      if (licenseKey) {
        // Verifica la licenza se è stata inserita
        const verificationResult = verifyLicenseKey(licenseKey);

        if (!verificationResult.valid) {
          alert(
            `Licenza non valida: ${verificationResult.error || "Formato non riconosciuto"}`,
          );
          return;
        }

        // Aggiorna il tipo di licenza rilevato
        setDetectedLicenseType(verificationResult.licenseType || "basic");
      } else {
        // Se non è stata inserita una licenza, imposta il tipo su basic
        setDetectedLicenseType("basic");
      }
    }

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
      // Verifica che tutti i dati necessari siano presenti
      if (!adminUser.username || !adminUser.password || !adminUser.email) {
        alert(
          "Dati utente amministratore incompleti. Torna al passaggio 2 e completa tutti i campi.",
        );
        setCurrentStep(2);
        setProgress((2 / totalSteps) * 100);
        return;
      }

      // Verifica la licenza se è stata inserita
      if (licenseKey) {
        const verificationResult = verifyLicenseKey(licenseKey);

        if (!verificationResult.valid) {
          alert(
            `Licenza non valida: ${verificationResult.error || "Formato non riconosciuto"}`,
          );
          setCurrentStep(3);
          setProgress((3 / totalSteps) * 100);
          return;
        }

        // Salva il tipo di licenza per l'uso nell'applicazione
        const licenseType = verificationResult.licenseType || "basic";
        localStorage.setItem("licenseType", licenseType);
        localStorage.setItem("licenseKey", licenseKey);
        if (verificationResult.expiryDate) {
          localStorage.setItem(
            "licenseExpiry",
            verificationResult.expiryDate.toISOString(),
          );
        }

        // Aggiorna il tipo di licenza rilevato
        setDetectedLicenseType(licenseType);
      } else {
        // Licenza base di default
        localStorage.setItem("licenseType", "basic");
        setDetectedLicenseType("basic");
      }

      // 1. Inizializza il database
      try {
        // Mostra un messaggio di caricamento
        const dbInitMessage = document.createElement("div");
        dbInitMessage.className =
          "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
        dbInitMessage.innerHTML = `
          <div class="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 class="text-lg font-medium mb-4">Inizializzazione Database</h3>
            <div class="space-y-4">
              <div class="flex items-center">
                <div class="spinner mr-3"></div>
                <p>Connessione al database in corso...</p>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(dbInitMessage);

        // Verifica la connessione al database
        console.log("Tentativo di connessione al database con:", {
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          dbName: dbConfig.dbName,
        });

        const connectionResult = await testDatabaseConnection({
          ...dbConfig,
          password: dbConfig.password || "",
        });

        if (!connectionResult) {
          document.body.removeChild(dbInitMessage);
          throw new Error("Impossibile connettersi al database");
        }

        // Aggiorna il messaggio
        const messageElement = dbInitMessage.querySelector("p");
        if (messageElement) {
          messageElement.textContent = "Creazione tabelle in corso...";
        }

        // Inizializza il database con le tabelle necessarie
        const initResult = await initializeDatabase({
          ...dbConfig,
          password: dbConfig.password || "",
        });

        // Rimuovi il messaggio di caricamento
        document.body.removeChild(dbInitMessage);

        if (!initResult) {
          throw new Error("Errore nell'inizializzazione del database");
        }

        console.log("Database inizializzato con successo");
      } catch (dbError) {
        // Rimuovi il messaggio di caricamento se esiste ancora
        try {
          const dbInitMessage = document.querySelector(
            ".bg-black.bg-opacity-50.flex.items-center.justify-center.z-50",
          );
          if (dbInitMessage && dbInitMessage.parentNode) {
            dbInitMessage.parentNode.removeChild(dbInitMessage);
          }
        } catch (e) {
          console.error(
            "Errore nella rimozione del messaggio di caricamento:",
            e,
          );
        }

        console.error("Errore nell'inizializzazione del database:", dbError);
        alert(
          `Errore nell'inizializzazione del database: ${dbError.message || "Errore sconosciuto"}. Verifica le impostazioni di connessione.`,
        );
        setCurrentStep(1);
        setProgress((1 / totalSteps) * 100);
        return;
      }

      // Salva le configurazioni del database
      localStorage.setItem(
        "dbConfig",
        JSON.stringify({
          ...dbConfig,
          password: dbConfig.password || "",
        }),
      );

      // 2. Crea l'utente amministratore
      try {
        // In un'implementazione reale, qui creeremmo l'utente nel database
        // Per ora, salviamo solo in localStorage
        localStorage.setItem(
          "adminUser",
          JSON.stringify({
            username: adminUser.username,
            fullName: adminUser.fullName,
            email: adminUser.email,
            role: "Medico",
          }),
        );

        console.log("Utente amministratore creato con successo");
      } catch (userError) {
        console.error(
          "Errore nella creazione dell'utente amministratore:",
          userError,
        );
        alert(
          `Errore nella creazione dell'utente amministratore: ${userError.message || "Errore sconosciuto"}`,
        );
        setCurrentStep(2);
        setProgress((2 / totalSteps) * 100);
        return;
      }

      // 3. Configura Google Calendar se necessario
      if (
        isLicenseWithGoogle() &&
        googleConfig.clientId &&
        googleConfig.clientSecret
      ) {
        localStorage.setItem("googleConfig", JSON.stringify(googleConfig));
      }

      // 4. Configura WhatsApp se necessario
      if (isLicenseWithWhatsApp() && whatsappConfig.enabled) {
        localStorage.setItem("whatsappConfig", JSON.stringify(whatsappConfig));
      }

      // 5. Salva le configurazioni del server
      localStorage.setItem("serverConfig", JSON.stringify(serverConfig));

      // 6. Salva le configurazioni di backup
      localStorage.setItem("backupConfig", JSON.stringify(backupConfig));
      localStorage.setItem("backupPath", backupConfig.backupPath);

      // 7. Salva le impostazioni generali
      localStorage.setItem("generalSettings", JSON.stringify(generalSettings));
      localStorage.setItem("clinicName", generalSettings.clinicName);

      console.log("Setup completato con successo!");

      // Segna il setup come completato
      localStorage.setItem("setupCompleted", "true");

      // Mostra un messaggio di successo
      alert("Setup completato con successo! L'applicazione verrà riavviata.");

      // Reindirizza alla pagina di login
      navigate("/");
    } catch (error) {
      console.error("Errore durante il setup:", error);
      alert(
        "Si è verificato un errore durante il setup. Controlla la console per i dettagli.",
      );
    }
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
                  autoComplete="off"
                  readOnly={false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="db-port">Porta</Label>
                <Input
                  id="db-port"
                  value={dbConfig.port}
                  onChange={(e) => handleDbConfigChange("port", e.target.value)}
                  autoComplete="off"
                  readOnly={false}
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
                  autoComplete="off"
                  readOnly={false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="db-password">Password</Label>
                <div className="relative">
                  <Input
                    id="db-password"
                    type={showPassword ? "text" : "password"}
                    value={dbConfig.password}
                    onChange={(e) =>
                      handleDbConfigChange("password", e.target.value)
                    }
                    autoComplete="new-password"
                    readOnly={false}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-eye-off"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-eye"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Campo obbligatorio per la connessione al database
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="db-name">Nome Database</Label>
                <Input
                  id="db-name"
                  value={dbConfig.dbName}
                  onChange={(e) =>
                    handleDbConfigChange("dbName", e.target.value)
                  }
                  autoComplete="off"
                  readOnly={false}
                />
                <p className="text-xs text-muted-foreground">
                  Il database verrà creato automaticamente se non esiste
                </p>
              </div>

              {dbConnectionStatus.status !== "idle" && (
                <div
                  className={`p-3 rounded-md ${
                    dbConnectionStatus.status === "success"
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  {dbConnectionStatus.message}
                </div>
              )}

              {connectionLogs.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <h4 className="text-sm font-medium mb-2">
                    Log di connessione:
                  </h4>
                  <div className="max-h-40 overflow-y-auto text-xs font-mono">
                    {connectionLogs.map((log, index) => (
                      <div
                        key={index}
                        className="py-1 border-b border-gray-100 last:border-0"
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  onClick={testConnection}
                  disabled={isDbLoading}
                >
                  {isDbLoading ? (
                    <>
                      <span className="spinner mr-2"></span>
                      Connessione in corso...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Testa Connessione
                    </>
                  )}
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
                  autoComplete="name"
                  readOnly={false}
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
                  autoComplete="email"
                  readOnly={false}
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
                  autoComplete="username"
                  readOnly={false}
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
                  autoComplete="new-password"
                  readOnly={false}
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
                  autoComplete="new-password"
                  readOnly={false}
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
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2">
                    Tipi di Licenza Disponibili
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center">
                      <span className="inline-block w-3 h-3 bg-gray-200 rounded-full mr-2"></span>
                      <strong>Base:</strong> Funzionalità di base senza
                      integrazioni
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-3 h-3 bg-blue-200 rounded-full mr-2"></span>
                      <strong>Google Calendar:</strong> Include sincronizzazione
                      con Google Calendar
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-3 h-3 bg-green-200 rounded-full mr-2"></span>
                      <strong>WhatsApp:</strong> Include notifiche WhatsApp
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-3 h-3 bg-purple-200 rounded-full mr-2"></span>
                      <strong>Completa:</strong> Include tutte le funzionalità
                    </li>
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Il tipo di licenza sarà determinato automaticamente dalla
                    chiave inserita.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="license-key">Chiave di Licenza</Label>
                <Input
                  id="license-key"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  autoComplete="off"
                  readOnly={false}
                />
                <p className="text-sm text-muted-foreground">
                  La licenza ha validità di 1 anno dalla data di attivazione
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  if (!licenseKey) {
                    alert(
                      "Inserisci una chiave di licenza prima di verificarla.",
                    );
                    return;
                  }

                  try {
                    // Verifica la licenza
                    const verificationResult = verifyLicenseKey(licenseKey);

                    if (verificationResult.valid) {
                      const expiryDate =
                        verificationResult.expiryDate?.toLocaleDateString() ||
                        "data sconosciuta";
                      const licenseTypeNames = {
                        basic: "Base",
                        google: "Base + Google Calendar",
                        whatsapp: "Base + WhatsApp",
                        full: "Completa",
                      };
                      const typeName =
                        licenseTypeNames[
                          verificationResult.licenseType || "basic"
                        ];

                      // Aggiorna il tipo di licenza rilevato
                      setDetectedLicenseType(
                        verificationResult.licenseType || "basic",
                      );

                      alert(
                        `Licenza valida! \nTipo: ${typeName} \nScadenza: ${expiryDate}`,
                      );
                    } else {
                      // Resetta il tipo di licenza rilevato se non valida
                      setDetectedLicenseType(null);
                      alert(
                        `Licenza non valida: ${verificationResult.error || "Formato non riconosciuto"}`,
                      );
                    }
                  } catch (error) {
                    console.error(
                      "Errore durante la verifica della licenza:",
                      error,
                    );
                    alert(
                      "Si è verificato un errore durante la verifica della licenza.",
                    );
                  }
                }}
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
                      autoComplete="off"
                      readOnly={false}
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
                      autoComplete="off"
                      readOnly={false}
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
                      autoComplete="off"
                      readOnly={false}
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
                          "https://console.cloud.google.com/apis/credentials",
                          "_blank",
                        )
                      }
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Vai alla Console Google Cloud
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-4 opacity-30" />
                  <p>
                    L'integrazione con Google Calendar non è disponibile con la
                    licenza attuale.
                  </p>
                  <p className="text-sm mt-2">
                    Aggiorna la tua licenza per sbloccare questa funzionalità.
                  </p>
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
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="whatsapp-enabled">Abilita WhatsApp</Label>
                      <p className="text-sm text-muted-foreground">
                        Attiva l'integrazione con WhatsApp per le notifiche
                      </p>
                    </div>
                    <Switch
                      id="whatsapp-enabled"
                      checked={whatsappConfig.enabled}
                      onCheckedChange={(checked) =>
                        handleWhatsappConfigChange("enabled", checked)
                      }
                    />
                  </div>

                  {whatsappConfig.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="browser-path">Percorso Browser</Label>
                        <Input
                          id="browser-path"
                          value={whatsappConfig.browserPath}
                          onChange={(e) =>
                            handleWhatsappConfigChange(
                              "browserPath",
                              e.target.value,
                            )
                          }
                          placeholder="C:\Program Files\Google\Chrome\Application\chrome.exe"
                          autoComplete="off"
                          readOnly={false}
                        />
                        <p className="text-xs text-muted-foreground">
                          Percorso completo dell'eseguibile del browser Chrome
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="data-path">Percorso Dati</Label>
                        <Input
                          id="data-path"
                          value={whatsappConfig.dataPath}
                          onChange={(e) =>
                            handleWhatsappConfigChange(
                              "dataPath",
                              e.target.value,
                            )
                          }
                          placeholder="C:\ProgramData\PatientAppointmentSystem\WhatsApp"
                          autoComplete="off"
                          readOnly={false}
                        />
                        <p className="text-xs text-muted-foreground">
                          Cartella dove salvare i dati della sessione WhatsApp
                        </p>
                      </div>

                      <div className="pt-4 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Note sull'integrazione WhatsApp:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Richiede Chrome installato sul sistema</li>
                          <li>
                            Utilizza Selenium per automatizzare WhatsApp Web
                          </li>
                          <li>Necessita di scansione QR code al primo avvio</li>
                          <li>Non invia messaggi a numeri non salvati</li>
                        </ul>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-4 opacity-30" />
                  <p>
                    L'integrazione con WhatsApp non è disponibile con la licenza
                    attuale.
                  </p>
                  <p className="text-sm mt-2">
                    Aggiorna la tua licenza per sbloccare questa funzionalità.
                  </p>
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
                  placeholder="3000"
                  autoComplete="off"
                  readOnly={false}
                />
                <p className="text-xs text-muted-foreground">
                  Porta su cui il server dell'applicazione sarà in ascolto
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-start">Avvio Automatico</Label>
                  <p className="text-sm text-muted-foreground">
                    Avvia automaticamente il server all'apertura
                    dell'applicazione
                  </p>
                </div>
                <Switch
                  id="auto-start"
                  checked={serverConfig.autoStart}
                  onCheckedChange={(checked) =>
                    handleServerConfigChange("autoStart", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="start-with-windows">Avvio con Windows</Label>
                  <p className="text-sm text-muted-foreground">
                    Avvia l'applicazione all'avvio di Windows
                  </p>
                </div>
                <Switch
                  id="start-with-windows"
                  checked={serverConfig.startWithWindows}
                  onCheckedChange={(checked) =>
                    handleServerConfigChange("startWithWindows", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Configurazione Backup
              </CardTitle>
              <CardDescription>
                Configura le impostazioni di backup automatico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-path">Percorso Backup</Label>
                <Input
                  id="backup-path"
                  value={backupConfig.backupPath}
                  onChange={(e) =>
                    handleBackupConfigChange("backupPath", e.target.value)
                  }
                  placeholder="C:\ProgramData\PatientAppointmentSystem\Backups"
                  autoComplete="off"
                  readOnly={false}
                />
                <p className="text-xs text-muted-foreground">
                  Cartella dove salvare i backup del database
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-backup">Backup Automatico</Label>
                  <p className="text-sm text-muted-foreground">
                    Esegui backup automatici del database
                  </p>
                </div>
                <Switch
                  id="auto-backup"
                  checked={backupConfig.autoBackup}
                  onCheckedChange={(checked) =>
                    handleBackupConfigChange("autoBackup", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Frequenza Backup</Label>
                <RadioGroup
                  value={backupConfig.backupFrequency}
                  onValueChange={(value) =>
                    handleBackupConfigChange("backupFrequency", value)
                  }
                  disabled={!backupConfig.autoBackup}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily">Giornaliera</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly">Settimanale</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly">Mensile</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        );

      case 8:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Impostazioni Generali
              </CardTitle>
              <CardDescription>
                Configura le impostazioni generali dell'applicazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-name">Nome Studio Medico</Label>
                <Input
                  id="clinic-name"
                  value={generalSettings.clinicName}
                  onChange={(e) =>
                    handleGeneralSettingsChange("clinicName", e.target.value)
                  }
                  placeholder="Studio Medico Dr. Rossi"
                  autoComplete="off"
                  readOnly={false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinic-address">Indirizzo</Label>
                <Input
                  id="clinic-address"
                  value={generalSettings.address}
                  onChange={(e) =>
                    handleGeneralSettingsChange("address", e.target.value)
                  }
                  placeholder="Via Roma 123, 00100 Roma"
                  autoComplete="off"
                  readOnly={false}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic-email">Email</Label>
                  <Input
                    id="clinic-email"
                    value={generalSettings.email}
                    onChange={(e) =>
                      handleGeneralSettingsChange("email", e.target.value)
                    }
                    placeholder="info@studiomedico.it"
                    autoComplete="off"
                    readOnly={false}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic-phone">Telefono</Label>
                  <Input
                    id="clinic-phone"
                    value={generalSettings.phone}
                    onChange={(e) =>
                      handleGeneralSettingsChange("phone", e.target.value)
                    }
                    placeholder="+39 06 12345678"
                    autoComplete="off"
                    readOnly={false}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Modalità Scura</Label>
                  <p className="text-sm text-muted-foreground">
                    Attiva la modalità scura per l'interfaccia
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={generalSettings.darkMode}
                  onCheckedChange={(checked) =>
                    handleGeneralSettingsChange("darkMode", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Lingua</Label>
                <Select
                  value={generalSettings.language}
                  onValueChange={(value) =>
                    handleGeneralSettingsChange("language", value)
                  }
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Seleziona lingua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Setup Wizard</h1>
          <p className="text-muted-foreground mt-2">
            Configura il Sistema di Gestione Appuntamenti
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">
              Passo {currentStep} di {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {renderStep()}

        <div className="flex justify-between mt-6">
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
              "Completa Setup"
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
