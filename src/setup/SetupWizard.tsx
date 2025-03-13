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

const SetupWizard = () => {
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

  const nextStep = () => {
    // Validazione specifica per ogni step
    if (currentStep === 2) {
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

      // Salva le configurazioni del database
      localStorage.setItem("dbConfig", JSON.stringify(dbConfig));

      // Salva i dati dell'utente amministratore
      localStorage.setItem(
        "adminUser",
        JSON.stringify({
          username: adminUser.username,
          fullName: adminUser.fullName,
          email: adminUser.email,
          role: "Medico",
        }),
      );

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

      // 7. Salva le configurazioni di backup
      localStorage.setItem("backupConfig", JSON.stringify(backupConfig));
      localStorage.setItem("backupPath", backupConfig.backupPath);

      // 8. Salva le impostazioni generali
      localStorage.setItem("generalSettings", JSON.stringify(generalSettings));
      localStorage.setItem("clinicName", generalSettings.clinicName);

      console.log("Setup completato con successo!");

      // Segna il setup come completato
      localStorage.setItem("setupCompleted", "true");

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
                  required
                />
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
                  onClick={async () => {
                    try {
                      // Verifica che tutti i campi siano compilati
                      if (
                        !dbConfig.host ||
                        !dbConfig.port ||
                        !dbConfig.username ||
                        !dbConfig.password ||
                        !dbConfig.dbName
                      ) {
                        alert(
                          "Compila tutti i campi prima di testare la connessione",
                        );
                        return;
                      }

                      // Disabilita il pulsante durante il test di connessione
                      const testButton = document.activeElement;
                      if (testButton instanceof HTMLButtonElement) {
                        testButton.disabled = true;
                        testButton.innerHTML =
                          '<span class="spinner"></span> Connessione in corso...';
                      }

                      // Verifica se la porta è un numero valido
                      const port = parseInt(dbConfig.port);
                      if (isNaN(port) || port <= 0 || port > 65535) {
                        alert(
                          "Errore: La porta deve essere un numero valido tra 1 e 65535",
                        );
                        if (testButton instanceof HTMLButtonElement) {
                          testButton.disabled = false;
                          testButton.innerHTML =
                            '<svg class="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path></svg>Testa Connessione';
                        }
                        return;
                      }

                      // Test di connessione reale al database PostgreSQL
                      try {
                        // Verifichiamo se il formato dell'host è valido
                        const hostRegex = /^[a-zA-Z0-9.-]+$/;
                        if (!hostRegex.test(dbConfig.host)) {
                          throw new Error("Formato host non valido");
                        }

                        // Verifichiamo se la password è troppo corta
                        if (dbConfig.password.length < 3) {
                          throw new Error("La password è troppo corta");
                        }

                        // Crea una connessione reale al database PostgreSQL
                        const { Client } = await import("pg");
                        const client = new Client({
                          host: dbConfig.host,
                          port: port,
                          user: dbConfig.username,
                          password: dbConfig.password,
                          database: dbConfig.dbName,
                          ssl: false,
                          connectionTimeoutMillis: 5000, // 5 secondi di timeout
                        });

                        // Tenta di connettersi al database
                        await client.connect();

                        // Esegui una query di test
                        const result = await client.query("SELECT NOW()");
                        console.log(
                          "Connessione al database riuscita:",
                          result.rows[0],
                        );

                        // Chiudi la connessione
                        await client.end();

                        // Inizializza il database con le tabelle necessarie
                        try {
                          const { Client } = await import("pg");
                          const initClient = new Client({
                            host: dbConfig.host,
                            port: port,
                            user: dbConfig.username,
                            password: dbConfig.password,
                            database: dbConfig.dbName,
                            ssl: false,
                          });

                          await initClient.connect();

                          // Crea le tabelle necessarie
                          await initClient.query(`
                            CREATE TABLE IF NOT EXISTS users (
                              id SERIAL PRIMARY KEY,
                              username VARCHAR(50) UNIQUE NOT NULL,
                              password VARCHAR(100) NOT NULL,
                              full_name VARCHAR(100) NOT NULL,
                              email VARCHAR(100) UNIQUE NOT NULL,
                              role VARCHAR(20) NOT NULL,
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            )
                          `);

                          await initClient.query(`
                            CREATE TABLE IF NOT EXISTS patients (
                              id SERIAL PRIMARY KEY,
                              name VARCHAR(100) NOT NULL,
                              codice_fiscale VARCHAR(16) UNIQUE NOT NULL,
                              date_of_birth DATE NOT NULL,
                              gender VARCHAR(10) NOT NULL,
                              email VARCHAR(100),
                              phone VARCHAR(20) NOT NULL,
                              address TEXT,
                              city VARCHAR(50),
                              postal_code VARCHAR(10),
                              medical_history TEXT,
                              allergies TEXT,
                              medications TEXT,
                              notes TEXT,
                              privacy_consent BOOLEAN NOT NULL DEFAULT FALSE,
                              marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            )
                          `);

                          await initClient.query(`
                            CREATE TABLE IF NOT EXISTS appointments (
                              id SERIAL PRIMARY KEY,
                              patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
                              date DATE NOT NULL,
                              time TIME NOT NULL,
                              duration INTEGER NOT NULL,
                              appointment_type VARCHAR(50) NOT NULL,
                              notes TEXT,
                              google_calendar_synced BOOLEAN NOT NULL DEFAULT FALSE,
                              google_event_id VARCHAR(100),
                              whatsapp_notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
                              whatsapp_notification_time TIMESTAMP,
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            )
                          `);

                          await initClient.query(`
                            CREATE TABLE IF NOT EXISTS license (
                              id SERIAL PRIMARY KEY,
                              license_key VARCHAR(100) UNIQUE NOT NULL,
                              license_type VARCHAR(20) NOT NULL,
                              expiry_date DATE NOT NULL,
                              google_calendar_enabled BOOLEAN NOT NULL DEFAULT FALSE,
                              whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            )
                          `);

                          await initClient.query(`
                            CREATE TABLE IF NOT EXISTS configurations (
                              id SERIAL PRIMARY KEY,
                              key VARCHAR(50) UNIQUE NOT NULL,
                              value TEXT NOT NULL,
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            )
                          `);

                          // Crea l'utente admin
                          const bcrypt = await import("bcryptjs");
                          const hashedPassword = await bcrypt.hash(
                            adminUser.password || "admin123",
                            10,
                          );

                          await initClient.query(
                            `
                            INSERT INTO users (username, password, full_name, email, role)
                            VALUES ($1, $2, $3, $4, $5)
                            ON CONFLICT (username) DO NOTHING
                          `,
                            [
                              adminUser.username || "admin",
                              hashedPassword,
                              adminUser.fullName || "Amministratore",
                              adminUser.email || "admin@arslink.it",
                              "Medico",
                            ],
                          );

                          // Salva la configurazione del database
                          localStorage.setItem(
                            "dbConfig",
                            JSON.stringify(dbConfig),
                          );
                          localStorage.setItem("dbCreated", "true");

                          await initClient.end();

                          console.log(
                            "Database inizializzato con successo e utente admin creato",
                          );
                        } catch (dbError) {
                          console.error(
                            "Errore nell'inizializzazione del database:",
                            dbError,
                          );
                          alert(
                            "Errore nell'inizializzazione del database: " +
                              (dbError.message || "Errore sconosciuto"),
                          );
                          throw dbError;
                        }

                        alert(
                          "Connessione riuscita! Il database è stato inizializzato correttamente.",
                        );
                      } catch (error) {
                        alert(
                          `Errore di connessione: ${error.message || "Errore sconosciuto"}`,
                        );
                      }

                      if (testButton instanceof HTMLButtonElement) {
                        testButton.disabled = false;
                        testButton.innerHTML =
                          '<svg class="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path></svg>Testa Connessione';
                      }
                    } catch (error) {
                      alert(
                        `Errore durante il test di connessione: ${error.message || "Errore sconosciuto"}`,
                      );
                      const testButton = document.activeElement;
                      if (testButton instanceof HTMLButtonElement) {
                        testButton.disabled = false;
                        testButton.innerHTML =
                          '<svg class="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path></svg>Testa Connessione';
                      }
                    }
                  }}
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
                <Database className="mr-2 h-5 w-5" />
                Configurazione Backup
              </CardTitle>
              <CardDescription>
                Configura le impostazioni di backup automatico
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-backup"
                  checked={backupConfig.autoBackup}
                  onCheckedChange={(checked) =>
                    handleBackupConfigChange("autoBackup", checked === true)
                  }
                />
                <Label htmlFor="auto-backup">Abilita backup automatico</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Frequenza Backup</Label>
                <Select
                  value={backupConfig.backupFrequency}
                  onValueChange={(value) =>
                    handleBackupConfigChange("backupFrequency", value)
                  }
                  disabled={!backupConfig.autoBackup}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleziona frequenza" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Giornaliera</SelectItem>
                    <SelectItem value="weekly">Settimanale</SelectItem>
                    <SelectItem value="monthly">Mensile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-path">Percorso Backup</Label>
                <Input
                  id="backup-path"
                  value={backupConfig.backupPath}
                  onChange={(e) =>
                    handleBackupConfigChange("backupPath", e.target.value)
                  }
                  disabled={!backupConfig.autoBackup}
                  placeholder="Inserisci il percorso completo per i backup"
                />
                <p className="text-xs text-muted-foreground">
                  Inserisci il percorso completo dove salvare i backup (es.
                  C:\ProgramData\PatientAppointmentSystem\Backups)
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Informazioni Generali
              </CardTitle>
              <CardDescription>
                Configura le informazioni generali dello studio medico
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Indirizzo</Label>
                <Input
                  id="address"
                  value={generalSettings.address}
                  onChange={(e) =>
                    handleGeneralSettingsChange("address", e.target.value)
                  }
                  placeholder="Via Roma 123, 00100 Roma"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={generalSettings.email}
                    onChange={(e) =>
                      handleGeneralSettingsChange("email", e.target.value)
                    }
                    placeholder="info@studiomedico.it"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    value={generalSettings.phone}
                    onChange={(e) =>
                      handleGeneralSettingsChange("phone", e.target.value)
                    }
                    placeholder="+39 06 12345678"
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

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="language">Lingua</Label>
                  <p className="text-sm text-muted-foreground">
                    Seleziona la lingua dell'interfaccia
                  </p>
                </div>
                <Select
                  value={generalSettings.language}
                  onValueChange={(value) =>
                    handleGeneralSettingsChange("language", value)
                  }
                >
                  <SelectTrigger className="w-[180px]">
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

      case 8:
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
                    {detectedLicenseType === "basic"
                      ? "Base"
                      : detectedLicenseType === "google"
                        ? "Base + Google Calendar"
                        : detectedLicenseType === "whatsapp"
                          ? "Base + WhatsApp"
                          : detectedLicenseType === "full"
                            ? "Completa"
                            : "Base"}
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
                    <strong>Backup:</strong>{" "}
                    {backupConfig.autoBackup ? "Automatico" : "Manuale"}
                  </p>
                  <p>
                    <strong>Studio:</strong> {generalSettings.clinicName}
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
