import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  RefreshCw,
  Download,
  Upload,
  Database,
  Calendar,
  Bell,
  Shield,
  User,
  Lock,
  Key,
} from "lucide-react";
import ResetSetupButton from "../ResetSetupButton";
import BackupStatus from "../system/BackupStatus";
import LicenseAlert from "../system/LicenseAlert";
import LicenseSettings from "./LicenseSettings";
import SecuritySettings from "./SecuritySettings";
import NotificationTemplates from "./NotificationTemplates";

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("license");
  const [autoBackup, setAutoBackup] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [googleCalendarSync, setGoogleCalendarSync] = useState(true);
  const [whatsappIntegration, setWhatsappIntegration] = useState(true);
  const [showLicenseInfo, setShowLicenseInfo] = useState(false);
  const [clinicName, setClinicName] = useState("Studio Medico Dr. Rossi");
  const [address, setAddress] = useState("Via Roma 123, 00100 Roma");
  const [email, setEmail] = useState("info@studiomedico.it");
  const [phone, setPhone] = useState("+39 06 12345678");
  const [language, setLanguage] = useState("it");
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const { default: Database } = await import("@/models/database");
        const db = Database.getInstance();

        // Load general settings
        const generalSettingsResult = await db.query(
          "SELECT value FROM configurations WHERE key = 'general_settings'",
          [],
        );

        if (generalSettingsResult.length > 0) {
          const generalSettings = JSON.parse(generalSettingsResult[0].value);
          setClinicName(
            generalSettings.clinicName || "Studio Medico Dr. Rossi",
          );
          setAddress(generalSettings.address || "Via Roma 123, 00100 Roma");
          setEmail(generalSettings.email || "info@studiomedico.it");
          setPhone(generalSettings.phone || "+39 06 12345678");
          setDarkMode(generalSettings.darkMode || false);
          setLanguage(generalSettings.language || "it");
        }

        // Load backup settings
        const backupConfigResult = await db.query(
          "SELECT value FROM configurations WHERE key = 'backup_config'",
          [],
        );

        if (backupConfigResult.length > 0) {
          const backupConfig = JSON.parse(backupConfigResult[0].value);
          setAutoBackup(
            backupConfig.autoBackup !== undefined
              ? backupConfig.autoBackup
              : true,
          );
          setBackupFrequency(backupConfig.backupFrequency || "daily");
        }

        // Load Google Calendar settings
        const googleCalendarConfigResult = await db.query(
          "SELECT value FROM configurations WHERE key = 'google_calendar_config'",
          [],
        );

        if (googleCalendarConfigResult.length > 0) {
          const googleCalendarConfig = JSON.parse(
            googleCalendarConfigResult[0].value,
          );
          setGoogleCalendarSync(googleCalendarConfig.enabled !== false);

          // Set values for the form fields
          if (googleCalendarConfig.clientId) {
            localStorage.setItem(
              "googleClientId",
              googleCalendarConfig.clientId,
            );
          }

          if (googleCalendarConfig.clientSecret) {
            localStorage.setItem(
              "googleClientSecret",
              googleCalendarConfig.clientSecret,
            );
          }

          if (googleCalendarConfig.redirectUri) {
            localStorage.setItem(
              "googleRedirectUri",
              googleCalendarConfig.redirectUri,
            );
          }
        }

        // Load WhatsApp settings
        const whatsappConfigResult = await db.query(
          "SELECT value FROM configurations WHERE key = 'whatsapp_config'",
          [],
        );

        if (whatsappConfigResult.length > 0) {
          const whatsappConfig = JSON.parse(whatsappConfigResult[0].value);
          setWhatsappIntegration(whatsappConfig.enabled !== false);

          // Set values for the form fields
          if (whatsappConfig.browserPath) {
            localStorage.setItem(
              "whatsappBrowserPath",
              whatsappConfig.browserPath,
            );
          }

          if (whatsappConfig.dataPath) {
            localStorage.setItem("whatsappDataPath", whatsappConfig.dataPath);
          }

          // Update WhatsApp service configuration
          try {
            const { WhatsAppService } = await import(
              "@/services/whatsapp.service"
            );
            const whatsAppService = WhatsAppService.getInstance();
            if (whatsappConfig.browserPath && whatsappConfig.dataPath) {
              await whatsAppService.configure(
                whatsappConfig.browserPath,
                whatsappConfig.dataPath,
              );
            }
          } catch (serviceError) {
            console.error(
              "Error updating WhatsApp service configuration:",
              serviceError,
            );
          }
        }

        // Apply dark mode if needed
        if (darkMode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        // Fallback to localStorage
        try {
          const storedGeneralSettings = localStorage.getItem("generalSettings");
          if (storedGeneralSettings) {
            const generalSettings = JSON.parse(storedGeneralSettings);
            setClinicName(
              generalSettings.clinicName || "Studio Medico Dr. Rossi",
            );
            setAddress(generalSettings.address || "Via Roma 123, 00100 Roma");
            setEmail(generalSettings.email || "info@studiomedico.it");
            setPhone(generalSettings.phone || "+39 06 12345678");
            setDarkMode(generalSettings.darkMode || false);
            setLanguage(generalSettings.language || "it");
          }

          const storedBackupConfig = localStorage.getItem("backupConfig");
          if (storedBackupConfig) {
            const backupConfig = JSON.parse(storedBackupConfig);
            setAutoBackup(
              backupConfig.autoBackup !== undefined
                ? backupConfig.autoBackup
                : true,
            );
            setBackupFrequency(backupConfig.backupFrequency || "daily");
          }

          // Load Google Calendar settings from localStorage
          const googleClientId = localStorage.getItem("googleClientId");
          const googleClientSecret = localStorage.getItem("googleClientSecret");
          const googleRedirectUri = localStorage.getItem("googleRedirectUri");

          if (googleClientId || googleClientSecret || googleRedirectUri) {
            setGoogleCalendarSync(true);
          }

          // Load WhatsApp settings from localStorage
          const whatsappConfig = localStorage.getItem("whatsappConfig");
          if (whatsappConfig) {
            const config = JSON.parse(whatsappConfig);
            setWhatsappIntegration(true);

            if (config.browserPath) {
              localStorage.setItem("whatsappBrowserPath", config.browserPath);
            }

            if (config.dataPath) {
              localStorage.setItem("whatsappDataPath", config.dataPath);
            }
          }
        } catch (localStorageError) {
          console.error(
            "Error loading settings from localStorage:",
            localStorageError,
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <Button
          onClick={async () => {
            // Salva tutte le impostazioni in localStorage e nel database

            // Backup
            const backupPath = document.getElementById("backup-path")?.value;

            // Salva in localStorage
            localStorage.setItem("clinicName", clinicName);
            localStorage.setItem("address", address);
            localStorage.setItem("email", email);
            localStorage.setItem("phone", phone);
            if (backupPath) localStorage.setItem("backupPath", backupPath);

            // Salva le impostazioni come oggetto JSON
            const generalSettings = {
              clinicName: clinicName || "Studio Medico Dr. Rossi",
              address: address || "Via Roma 123, 00100 Roma",
              email: email || "info@studiomedico.it",
              phone: phone || "+39 06 12345678",
              darkMode: darkMode,
              language:
                document.querySelector('[id^="language"]')?.value || "it",
            };

            const backupConfig = {
              backupPath:
                backupPath ||
                "C:\\ProgramData\\PatientAppointmentSystem\\Backups",
              autoBackup: autoBackup,
              backupFrequency: backupFrequency,
            };

            localStorage.setItem(
              "generalSettings",
              JSON.stringify(generalSettings),
            );
            localStorage.setItem("backupConfig", JSON.stringify(backupConfig));

            // Salva anche nel database
            try {
              const { default: Database } = await import("@/models/database");
              const db = Database.getInstance();

              // Salva le impostazioni generali
              await db.query(
                `INSERT INTO configurations (key, value) 
                 VALUES ($1, $2) 
                 ON CONFLICT (key) DO UPDATE SET value = $2`,
                ["general_settings", JSON.stringify(generalSettings)],
              );

              // Salva le impostazioni di backup
              await db.query(
                `INSERT INTO configurations (key, value) 
                 VALUES ($1, $2) 
                 ON CONFLICT (key) DO UPDATE SET value = $2`,
                ["backup_config", JSON.stringify(backupConfig)],
              );

              // Salva le impostazioni di Google Calendar
              const googleClientId =
                document.getElementById("google-client-id")?.value;
              const googleClientSecret = document.getElementById(
                "google-client-secret",
              )?.value;
              const googleRedirectUri = document.getElementById(
                "google-redirect-uri",
              )?.value;

              if (googleClientId || googleClientSecret || googleRedirectUri) {
                const googleCalendarConfig = {
                  enabled: googleCalendarSync,
                  clientId: googleClientId,
                  clientSecret: googleClientSecret,
                  redirectUri:
                    googleRedirectUri || "http://localhost:5173/settings",
                };

                await db.query(
                  `INSERT INTO configurations (key, value) 
                   VALUES ($1, $2) 
                   ON CONFLICT (key) DO UPDATE SET value = $2`,
                  [
                    "google_calendar_config",
                    JSON.stringify(googleCalendarConfig),
                  ],
                );

                // Salva anche in localStorage
                localStorage.setItem("googleClientId", googleClientId || "");
                localStorage.setItem(
                  "googleClientSecret",
                  googleClientSecret || "",
                );
                localStorage.setItem(
                  "googleRedirectUri",
                  googleRedirectUri || "http://localhost:5173/settings",
                );
              }

              // Salva le impostazioni di WhatsApp
              const whatsappBrowserPath = document.getElementById(
                "whatsapp-browser-path",
              )?.value;
              const whatsappDataPath =
                document.getElementById("whatsapp-data-path")?.value;

              if (whatsappBrowserPath || whatsappDataPath) {
                const whatsappConfig = {
                  enabled: whatsappIntegration,
                  browserPath: whatsappBrowserPath,
                  dataPath: whatsappDataPath,
                };

                await db.query(
                  `INSERT INTO configurations (key, value) 
                   VALUES ($1, $2) 
                   ON CONFLICT (key) DO UPDATE SET value = $2`,
                  ["whatsapp_config", JSON.stringify(whatsappConfig)],
                );

                // Salva anche in localStorage
                localStorage.setItem(
                  "whatsappBrowserPath",
                  whatsappBrowserPath || "",
                );
                localStorage.setItem(
                  "whatsappDataPath",
                  whatsappDataPath || "",
                );
              }

              console.log("Impostazioni salvate nel database");
            } catch (dbError) {
              console.error(
                "Errore nel salvataggio delle impostazioni nel database:",
                dbError,
              );
            }

            // Applica la modalità scura se necessario
            if (darkMode) {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }

            alert("Impostazioni salvate con successo!");
          }}
        >
          <Save className="mr-2 h-4 w-4" />
          Salva Impostazioni
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar con le categorie */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Button
                  variant={activeTab === "general" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("general")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Generali
                </Button>
                <Button
                  variant={activeTab === "backup" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("backup")}
                >
                  <Database className="mr-2 h-4 w-4" />
                  Backup
                </Button>
                <Button
                  variant={activeTab === "calendar" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("calendar")}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Google Calendar
                </Button>
                <Button
                  variant={activeTab === "whatsapp" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("whatsapp")}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button
                  variant={activeTab === "notifications" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifiche
                </Button>
                <Button
                  variant={activeTab === "security" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("security")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Sicurezza
                </Button>
                <Button
                  variant={activeTab === "license" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("license")}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Licenza
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stato del sistema */}
          <div className="mt-6 space-y-4">
            <LicenseAlert />
            <BackupStatus />
          </div>
        </div>

        {/* Contenuto principale */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "general" && "Impostazioni Generali"}
                {activeTab === "backup" && "Configurazione Backup"}
                {activeTab === "calendar" && "Integrazione Google Calendar"}
                {activeTab === "whatsapp" && "Integrazione WhatsApp"}
                {activeTab === "notifications" && "Gestione Notifiche"}
                {activeTab === "security" && "Impostazioni di Sicurezza"}
                {activeTab === "license" && "Gestione Licenza"}
              </CardTitle>
              <CardDescription>
                {activeTab === "general" &&
                  "Configura le informazioni di base dello studio medico."}
                {activeTab === "backup" &&
                  "Imposta le opzioni di backup automatico dei dati."}
                {activeTab === "calendar" &&
                  "Configura la sincronizzazione con Google Calendar."}
                {activeTab === "whatsapp" &&
                  "Configura l'integrazione con WhatsApp per l'invio di notifiche."}
                {activeTab === "notifications" &&
                  "Personalizza i modelli di notifica per i pazienti."}
                {activeTab === "security" &&
                  "Gestisci le impostazioni di sicurezza e gli utenti."}
                {activeTab === "license" &&
                  "Visualizza e gestisci le informazioni sulla licenza."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Impostazioni Generali */}
              {activeTab === "general" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Informazioni Studio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clinic-name">Nome Studio</Label>
                        <Input
                          id="clinic-name"
                          value={clinicName}
                          onChange={(e) => setClinicName(e.target.value)}
                          placeholder="Studio Medico Dr. Rossi"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Indirizzo</Label>
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Via Roma 123, 00100 Roma"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="info@studiomedico.it"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefono</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+39 06 12345678"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Aspetto</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="dark-mode">Modalità Scura</Label>
                        <p className="text-sm text-muted-foreground">
                          Attiva la modalità scura per l'interfaccia
                        </p>
                      </div>
                      <Switch
                        id="dark-mode"
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Lingua</h3>
                    <div className="space-y-2">
                      <Label htmlFor="language">Lingua dell'applicazione</Label>
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

              {/* Configurazione Backup */}
              {activeTab === "backup" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Backup Automatico</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-backup">Backup Automatico</Label>
                        <p className="text-sm text-muted-foreground">
                          Attiva il backup automatico dei dati
                        </p>
                      </div>
                      <Switch
                        id="auto-backup"
                        checked={autoBackup}
                        onCheckedChange={setAutoBackup}
                      />
                    </div>

                    {autoBackup && (
                      <div className="space-y-2">
                        <Label htmlFor="backup-frequency">
                          Frequenza Backup
                        </Label>
                        <Select
                          value={backupFrequency}
                          onValueChange={setBackupFrequency}
                        >
                          <SelectTrigger id="backup-frequency">
                            <SelectValue placeholder="Seleziona frequenza" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Giornaliera</SelectItem>
                            <SelectItem value="weekly">Settimanale</SelectItem>
                            <SelectItem value="monthly">Mensile</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Percorso Backup</h3>
                    <div className="space-y-2">
                      <Label htmlFor="backup-path">Cartella di Backup</Label>
                      <div className="flex gap-2">
                        <Input
                          id="backup-path"
                          defaultValue={
                            localStorage.getItem("backupPath") ||
                            "C:\\ProgramData\\PatientAppointmentSystem\\Backups"
                          }
                          placeholder="C:\\ProgramData\\PatientAppointmentSystem\\Backups"
                        />
                        <Button variant="outline" type="button">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Seleziona la cartella dove salvare i backup
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Backup Manuale</h3>
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            const { default: Database } = await import(
                              "@/models/database"
                            );
                            const db = Database.getInstance();
                            const result = await db.backup();
                            if (result.success) {
                              alert(
                                `Backup completato con successo: ${result.filePath}`,
                              );
                            } else {
                              alert(
                                `Errore durante il backup: ${result.error}`,
                              );
                            }
                          } catch (error) {
                            console.error("Errore durante il backup:", error);
                            alert(`Errore durante il backup: ${error.message}`);
                          }
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Esegui Backup Ora
                      </Button>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          // Ottieni la lista dei backup disponibili
                          try {
                            const backupsList = JSON.parse(
                              localStorage.getItem("backups_list") || "[]"
                            );
                            
                            if (backupsList.length === 0) {
                              alert("Nessun backup disponibile. Esegui prima un backup.");
                              return;
                            }
                            
                            // Mostra una lista di backup disponibili in un dialog
                            const backupSelect = document.createElement("select");
                            backupSelect.id = "backup-select";
                            backupSelect.style.width = "100%";
                            backupSelect.style.padding = "8px";
                            backupSelect.style.marginBottom = "16px";
                            
                            backupsList.forEach((backup, index) => {
                              const option = document.createElement("option");
                              option.value = backup.timestamp;
                              option.text = `Backup ${new Date(backup.timestamp.replace(/-/g, ":")
                                .substring(0, backup.timestamp.lastIndexOf("-"))).toLocaleString()} (${backup.filePath})`;
                              backupSelect.appendChild(option);
                            });
                            
                            const dialog = document.createElement("div");
                            dialog.style.position = "fixed";
                            dialog.style.top = "0";
                            dialog.style.left = "0";
                            dialog.style.width = "100%";
                            dialog.style.height = "100%";
                            dialog.style.backgroundColor = "rgba(0,0,0,0.5)";
                            dialog.style.display = "flex";
                            dialog.style.justifyContent = "center";
                            dialog.style.alignItems = "center";
                            dialog.style.zIndex = "9999";
                            
                            const dialogContent = document.createElement("div");
                            dialogContent.style.backgroundColor = "white";
                            dialogContent.style.padding = "24px";
                            dialogContent.style.borderRadius = "8px";
                            dialogContent.style.width = "400px";
                            dialogContent.style.maxWidth = "90%";
                            
                            const title = document.createElement("h3");
                            title.textContent = "Seleziona un backup da ripristinare";
                            title.style.marginBottom = "16px";
                            
                            const buttonContainer = document.createElement("div");
                            buttonContainer.style.display = "flex";
                            buttonContainer.style.justifyContent = "flex-end";
                            buttonContainer.style.gap = "8px";
                            
                            const cancelButton = document.createElement("button");
                            cancelButton.textContent = "Annulla";
                            cancelButton.style.padding = "8px 16px";
                            cancelButton.style.border = "1px solid #ccc";
                            cancelButton.style.borderRadius = "4px";
                            cancelButton.style.backgroundColor = "#f1f1f1";
                            cancelButton.onclick = () => document.body.removeChild(dialog);
                            
                            const confirmButton = document.createElement("button");
                            confirmButton.textContent = "Ripristina";
                            confirmButton.style.padding = "8px 16px";
                            confirmButton.style.border = "none";
                            confirmButton.style.borderRadius = "4px";
                            confirmButton.style.backgroundColor = "#0070f3";
                            confirmButton.style.color = "white";
                            confirmButton.onclick = async () => {
                              const selectedTimestamp = backupSelect.value;
                              const selectedBackup = backupsList.find(b => b.timestamp === selectedTimestamp);
                              
                              if (!selectedBackup) return;
                              
                              document.body.removeChild(dialog);
                              
                              try {
                                const { default: Database } = await import("@/models/database");
                                const db = Database.getInstance();
                                const result = await db.restore(`backup_${selectedTimestamp}`);
                                if (result.success) {
                                  alert("Ripristino completato con successo. L'applicazione verrà riavviata.");
                                  window.location.reload();
                                } else {
                                  alert(`Errore durante il ripristino: ${result.error}`);
                                }
                              } catch (error) {
                                console.error("Errore durante il ripristino:", error);
                                alert(`Errore durante il ripristino: ${error.message}`);
                              }
                            };
                            
                            buttonContainer.appendChild(cancelButton);
                            buttonContainer.appendChild(confirmButton);
                            
                            dialogContent.appendChild(title);
                            dialogContent.appendChild(backupSelect);
                            dialogContent.appendChild(buttonContainer);
                            dialog.appendChild(dialogContent);
                            
                            document.body.appendChild(dialog);
                          } catch (error) {
                            console.error("Errore nel caricamento dei backup:", error);
                            alert(`Errore nel caricamento dei backup: ${error.message}`);
                          }
                        }}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Ripristina da Backup
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Integrazione Google Calendar */}
              {activeTab === "calendar" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Sincronizzazione Google Calendar
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="google-calendar-sync">
                          Attiva Sincronizzazione
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Sincronizza gli appuntamenti con Google Calendar
                        </p>
                      </div>
                      <Switch
                        id="google-calendar-sync"
                        checked={googleCalendarSync}
                        onCheckedChange={setGoogleCalendarSync}
                      />
                    </div>
                  </div>

                  {googleCalendarSync && (
                    <>
                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Credenziali Google API
                        </h3>
                        <div className="space-y-2">
                          <Label htmlFor="google-client-id">Client ID</Label>
                          <Input
                            id="google-client-id"
                            defaultValue={
                              localStorage.getItem("googleClientId") || ""
                            }
                            placeholder="Inserisci il Client ID di Google"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="google-client-secret">
                            Client Secret
                          </Label>
                          <Input
                            id="google-client-secret"
                            type="password"
                            defaultValue={
                              localStorage.getItem("googleClientSecret") || ""
                            }
                            placeholder="Inserisci il Client Secret di Google"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="google-redirect-uri">
                            URI di Reindirizzamento
                          </Label>
                          <Input
                            id="google-redirect-uri"
                            defaultValue={
                              localStorage.getItem("googleRedirectUri") ||
                              "http://localhost:5173/settings"
                            }
                            placeholder="http://localhost:5173/settings"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Autorizzazione Google
                        </h3>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            try {
                              const clientId =
                                document.getElementById(
                                  "google-client-id",
                                )?.value;
                              const clientSecret = document.getElementById(
                                "google-client-secret",
                              )?.value;
                              const redirectUri = document.getElementById(
                                "google-redirect-uri",
                              )?.value;

                              if (!clientId || !clientSecret || !redirectUri) {
                                alert(
                                  "Inserisci tutte le credenziali Google API prima di procedere.",
                                );
                                return;
                              }

                              const { GoogleCalendarService } = await import(
                                "@/services/googleCalendar.service"
                              );
                              const googleCalendarService =
                                GoogleCalendarService.getInstance();
                              await googleCalendarService.configure(
                                clientId,
                                clientSecret,
                                redirectUri,
                              );

                              const authUrl =
                                await googleCalendarService.getAuthUrl();
                              window.open(authUrl, "_blank");
                            } catch (error) {
                              console.error(
                                "Errore durante l'autorizzazione Google:",
                                error,
                              );
                              alert(
                                `Errore durante l'autorizzazione Google: ${error.message}`,
                              );
                            }
                          }}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Autorizza Google Calendar
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Integrazione WhatsApp */}
              {activeTab === "whatsapp" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Integrazione WhatsApp
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="whatsapp-integration">
                          Attiva Integrazione
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Invia notifiche automatiche via WhatsApp
                        </p>
                      </div>
                      <Switch
                        id="whatsapp-integration"
                        checked={whatsappIntegration}
                        onCheckedChange={setWhatsappIntegration}
                      />
                    </div>
                  </div>

                  {whatsappIntegration && (
                    <>
                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Configurazione Browser
                        </h3>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp-browser-path">
                            Percorso Browser
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="whatsapp-browser-path"
                              defaultValue={
                                localStorage.getItem("whatsappBrowserPath") ||
                                "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
                              }
                              placeholder="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
                            />
                            <Button variant="outline" type="button">
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Percorso completo dell'eseguibile del browser
                            (Chrome consigliato)
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp-data-path">
                            Cartella Dati Browser
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="whatsapp-data-path"
                              defaultValue={
                                localStorage.getItem("whatsappDataPath") ||
                                "C:\\ProgramData\\PatientAppointmentSystem\\WhatsAppData"
                              }
                              placeholder="C:\\ProgramData\\PatientAppointmentSystem\\WhatsAppData"
                            />
                            <Button variant="outline" type="button">
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Cartella dove salvare i dati del browser per
                            WhatsApp Web
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Test Connessione WhatsApp
                        </h3>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            try {
                              const browserPath = document.getElementById(
                                "whatsapp-browser-path",
                              )?.value;
                              const dataPath =
                                document.getElementById(
                                  "whatsapp-data-path",
                                )?.value;

                              if (!browserPath || !dataPath) {
                                alert(
                                  "Inserisci tutti i percorsi prima di procedere.",
                                );
                                return;
                              }

                              const { WhatsAppService } = await import(
                                "@/services/whatsapp.service"
                              );
                              const whatsAppService =
                                WhatsAppService.getInstance();
                              await whatsAppService.configure(
                                browserPath,
                                dataPath,
                              );

                              const result = await whatsAppService.connect();
                              if (result.success) {
                                alert(
                                  "Connessione a WhatsApp Web avviata con successo. Scansiona il codice QR nel browser che si è aperto.",
                                );
                              } else {
                                alert(
                                  `Errore durante la connessione a WhatsApp Web: ${result.error}`,
                                );
                              }
                            } catch (error) {
                              console.error(
                                "Errore durante la connessione a WhatsApp Web:",
                                error,
                              );
                              alert(
                                `Errore durante la connessione a WhatsApp Web: ${error.message}`,
                              );
                            }
                          }}
                        >
                          <Bell className="mr-2 h-4 w-4" />
                          Connetti WhatsApp Web
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Gestione Notifiche */}
              {activeTab === "notifications" && <NotificationTemplates />}

              {/* Impostazioni di Sicurezza */}
              {activeTab === "security" && <SecuritySettings />}

              {/* Gestione Licenza */}
              {activeTab === "license" && <LicenseSettings />}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pulsante di reset setup */}
      <div className="mt-6">
        <ResetSetupButton />
      </div>
    </div>
  );
};

export default Settings;
