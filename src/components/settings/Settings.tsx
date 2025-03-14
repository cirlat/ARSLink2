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
          <Save className="h-4 w-4 mr-2" />
          Salva Modifiche
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <div className="flex flex-col items-start h-auto bg-transparent space-y-1">
              <Button
                variant={activeTab === "license" ? "default" : "ghost"}
                className="w-full justify-start px-2 py-1.5 h-9"
                onClick={() => setActiveTab("license")}
              >
                <Key className="h-4 w-4 mr-2" />
                Licenza
              </Button>
              <Button
                variant={activeTab === "general" ? "default" : "ghost"}
                className="w-full justify-start px-2 py-1.5 h-9"
                onClick={() => setActiveTab("general")}
              >
                <User className="h-4 w-4 mr-2" />
                Generali
              </Button>
              <Button
                variant={activeTab === "backup" ? "default" : "ghost"}
                className="w-full justify-start px-2 py-1.5 h-9"
                onClick={() => setActiveTab("backup")}
              >
                <Database className="h-4 w-4 mr-2" />
                Backup e Ripristino
              </Button>
              {/* Mostra le notifiche solo se l'utente ha una licenza che include WhatsApp */}
              {(localStorage.getItem("licenseType") === "whatsapp" ||
                localStorage.getItem("licenseType") === "full") && (
                <Button
                  variant={activeTab === "notifications" ? "default" : "ghost"}
                  className="w-full justify-start px-2 py-1.5 h-9"
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifiche
                </Button>
              )}
              <Button
                variant={activeTab === "integrations" ? "default" : "ghost"}
                className="w-full justify-start px-2 py-1.5 h-9"
                onClick={() => setActiveTab("integrations")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Integrazioni
              </Button>
              <Button
                variant={activeTab === "security" ? "default" : "ghost"}
                className="w-full justify-start px-2 py-1.5 h-9"
                onClick={() => setActiveTab("security")}
              >
                <Lock className="h-4 w-4 mr-2" />
                Gestione Account
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-6">
          {activeTab === "license" && (
            <div className="space-y-6 mt-0">
              <LicenseSettings />
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Impostazioni Generali</CardTitle>
                  <CardDescription>
                    Configura le impostazioni di base dell'applicazione
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="clinic-name">Nome Studio Medico</Label>
                      <Input
                        id="clinic-name"
                        placeholder="Studio Medico Dr. Rossi"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Indirizzo</Label>
                      <Input
                        id="address"
                        placeholder="Via Roma 123, 00100 Roma"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="info@studiomedico.it"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefono</Label>
                        <Input
                          id="phone"
                          placeholder="+39 06 12345678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <Separator />

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
                        onCheckedChange={(checked) => {
                          setDarkMode(checked);
                          // Applica immediatamente la modalità scura
                          if (checked) {
                            document.documentElement.classList.add("dark");
                          } else {
                            document.documentElement.classList.remove("dark");
                          }
                        }}
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
                        id="language"
                        value={language}
                        onValueChange={(value) => {
                          setLanguage(value);
                          localStorage.setItem("language", value);
                          // In un'implementazione reale, qui cambieremmo la lingua dell'interfaccia
                        }}
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
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "backup" && (
            <div className="space-y-6 mt-0">
              <BackupStatus />

              <Card>
                <CardHeader>
                  <CardTitle>Configurazione Backup</CardTitle>
                  <CardDescription>
                    Configura le impostazioni di backup automatico
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                      onCheckedChange={(checked) => {
                        setAutoBackup(checked);
                        localStorage.setItem("autoBackup", checked.toString());
                        if (checked) {
                          // Schedule next backup
                          const now = new Date();
                          let nextBackupDate = new Date(now);

                          if (backupFrequency === "daily") {
                            nextBackupDate.setDate(
                              nextBackupDate.getDate() + 1,
                            );
                          } else if (backupFrequency === "weekly") {
                            nextBackupDate.setDate(
                              nextBackupDate.getDate() + 7,
                            );
                          } else if (backupFrequency === "monthly") {
                            nextBackupDate.setMonth(
                              nextBackupDate.getMonth() + 1,
                            );
                          }

                          localStorage.setItem(
                            "nextBackup",
                            nextBackupDate.toISOString(),
                          );
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="backup-frequency">Frequenza Backup</Label>
                      <p className="text-sm text-muted-foreground">
                        Imposta la frequenza dei backup automatici
                      </p>
                    </div>
                    <Select
                      value={backupFrequency}
                      onValueChange={(value) => {
                        setBackupFrequency(value);
                        localStorage.setItem("backupFrequency", value);

                        // Update next backup date based on new frequency
                        if (autoBackup) {
                          const now = new Date();
                          let nextBackupDate = new Date(now);

                          if (value === "daily") {
                            nextBackupDate.setDate(
                              nextBackupDate.getDate() + 1,
                            );
                          } else if (value === "weekly") {
                            nextBackupDate.setDate(
                              nextBackupDate.getDate() + 7,
                            );
                          } else if (value === "monthly") {
                            nextBackupDate.setMonth(
                              nextBackupDate.getMonth() + 1,
                            );
                          }

                          localStorage.setItem(
                            "nextBackup",
                            nextBackupDate.toISOString(),
                          );
                        }
                      }}
                      disabled={!autoBackup}
                    >
                      <SelectTrigger className="w-[180px]">
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
                      placeholder="C:\\ProgramData\\PatientAppointmentSystem\\Backups"
                      defaultValue={
                        localStorage.getItem("backupPath") ||
                        "C:\\ProgramData\\PatientAppointmentSystem\\Backups"
                      }
                      onChange={(e) => {
                        localStorage.setItem("backupPath", e.target.value);
                      }}
                      disabled={!autoBackup}
                      className="flex-1"
                    />
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const { backupDatabase } = await import(
                            "@/utils/dbUtils"
                          );
                          const backupPath =
                            document.getElementById("backup-path")?.value ||
                            localStorage.getItem("backupPath") ||
                            "C:\\ProgramData\\PatientAppointmentSystem\\Backups";

                          // Salva il percorso in localStorage
                          localStorage.setItem("backupPath", backupPath);

                          // Esegui il backup
                          const result = await backupDatabase(backupPath);

                          if (result) {
                            alert("Backup completato con successo!");
                            window.location.reload(); // Ricarica la pagina per mostrare lo stato aggiornato
                          } else {
                            alert(
                              "Errore durante il backup. Controlla il percorso e riprova.",
                            );
                          }
                        } catch (error) {
                          console.error("Errore durante il backup:", error);
                          alert(
                            `Si è verificato un errore durante il backup: ${error.message || "Errore sconosciuto"}`,
                          );
                        }
                      }}
                    >
                      <Database className="mr-2 h-4 w-4" />
                      Esegui Backup Manuale
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Apri una finestra di dialogo per selezionare un file di backup
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".sql,.dump,.backup";
                        input.onchange = async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            try {
                              const { restoreDatabase } = await import(
                                "@/utils/dbUtils"
                              );
                              const result = await restoreDatabase(file);
                              if (result) {
                                alert("Ripristino completato con successo!");
                                window.location.reload();
                              } else {
                                alert(
                                  "Errore durante il ripristino. Controlla il file e riprova.",
                                );
                              }
                            } catch (error) {
                              console.error(
                                "Errore durante il ripristino:",
                                error,
                              );
                              alert(
                                `Si è verificato un errore durante il ripristino: ${error.message || "Errore sconosciuto"}`,
                              );
                            }
                          }
                        };
                        input.click();
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Ripristina da Backup
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 mt-0">
              <SecuritySettings />
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Integrazione Google Calendar</CardTitle>
                  <CardDescription>
                    Configura l'integrazione con Google Calendar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="google-calendar-sync">
                        Sincronizzazione Google Calendar
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Sincronizza automaticamente gli appuntamenti con Google
                        Calendar
                      </p>
                    </div>
                    <Switch
                      id="google-calendar-sync"
                      checked={googleCalendarSync}
                      onCheckedChange={setGoogleCalendarSync}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google-client-id">Client ID</Label>
                    <Input
                      id="google-client-id"
                      placeholder="Inserisci il Client ID di Google"
                      defaultValue={
                        localStorage.getItem("googleClientId") || ""
                      }
                      disabled={!googleCalendarSync}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google-client-secret">Client Secret</Label>
                    <Input
                      id="google-client-secret"
                      type="password"
                      placeholder="Inserisci il Client Secret di Google"
                      defaultValue={
                        localStorage.getItem("googleClientSecret") || ""
                      }
                      disabled={!googleCalendarSync}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google-redirect-uri">
                      URI di Reindirizzamento
                    </Label>
                    <Input
                      id="google-redirect-uri"
                      placeholder="Inserisci l'URI di reindirizzamento"
                      defaultValue={
                        localStorage.getItem("googleRedirectUri") ||
                        "http://localhost:5173/settings"
                      }
                      disabled={!googleCalendarSync}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      disabled={!googleCalendarSync}
                      onClick={async () => {
                        try {
                          // Ottieni i valori dai campi
                          const clientId =
                            document.getElementById("google-client-id")?.value;
                          const clientSecret = document.getElementById(
                            "google-client-secret",
                          )?.value;
                          const redirectUri = document.getElementById(
                            "google-redirect-uri",
                          )?.value;

                          if (!clientId || !clientSecret || !redirectUri) {
                            alert(
                              "Inserisci tutti i campi per configurare l'integrazione",
                            );
                            return;
                          }

                          // Salva i valori in localStorage
                          localStorage.setItem("googleClientId", clientId);
                          localStorage.setItem(
                            "googleClientSecret",
                            clientSecret,
                          );
                          localStorage.setItem(
                            "googleRedirectUri",
                            redirectUri,
                          );

                          // Configura l'integrazione
                          const { GoogleCalendarService } = await import(
                            "@/services/googleCalendar.service"
                          );
                          const googleCalendarService =
                            GoogleCalendarService.getInstance();

                          const result =
                            await googleCalendarService.authenticate(
                              clientId,
                              clientSecret,
                              redirectUri,
                            );

                          if (result) {
                            alert(
                              "Integrazione con Google Calendar configurata con successo!",
                            );
                          } else {
                            alert(
                              "Errore nella configurazione dell'integrazione con Google Calendar",
                            );
                          }
                        } catch (error) {
                          console.error(
                            "Errore nella configurazione dell'integrazione con Google Calendar:",
                            error,
                          );
                          alert(
                            `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                          );
                        }
                      }}
                    >
                      Configura Integrazione
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!googleCalendarSync}
                      onClick={async () => {
                        try {
                          // Sincronizza tutti gli appuntamenti
                          const { GoogleCalendarService } = await import(
                            "@/services/googleCalendar.service"
                          );
                          const googleCalendarService =
                            GoogleCalendarService.getInstance();

                          // Verifica se il servizio è abilitato e autenticato
                          const isEnabled =
                            await googleCalendarService.isServiceEnabled();
                          const isAuthenticated =
                            await googleCalendarService.isServiceAuthenticated();

                          if (!isEnabled || !isAuthenticated) {
                            alert(
                              "Il servizio Google Calendar non è abilitato o autenticato. Configura l'integrazione prima di sincronizzare.",
                            );
                            return;
                          }

                          const result =
                            await googleCalendarService.syncAllAppointments();

                          alert(
                            `Sincronizzazione completata: ${result.success} appuntamenti sincronizzati, ${result.failed} falliti`,
                          );
                        } catch (error) {
                          console.error(
                            "Errore nella sincronizzazione con Google Calendar:",
                            error,
                          );
                          alert(
                            `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                          );
                        }
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizza Ora
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Integrazione WhatsApp */}
              <Card>
                <CardHeader>
                  <CardTitle>Integrazione WhatsApp</CardTitle>
                  <CardDescription>
                    Configura l'integrazione con WhatsApp per l'invio di
                    notifiche
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="whatsapp-integration">
                        Integrazione WhatsApp
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Abilita l'invio di notifiche tramite WhatsApp
                      </p>
                    </div>
                    <Switch
                      id="whatsapp-integration"
                      checked={whatsappIntegration}
                      onCheckedChange={setWhatsappIntegration}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-browser-path">
                      Percorso Browser Chrome
                    </Label>
                    <Input
                      id="whatsapp-browser-path"
                      placeholder="C:\Program Files\Google\Chrome\Application\chrome.exe"
                      defaultValue={
                        localStorage.getItem("whatsappBrowserPath") ||
                        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
                      }
                      disabled={!whatsappIntegration}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-data-path">
                      Percorso Dati WhatsApp
                    </Label>
                    <Input
                      id="whatsapp-data-path"
                      placeholder="C:\ProgramData\PatientAppointmentSystem\WhatsAppData"
                      defaultValue={
                        localStorage.getItem("whatsappDataPath") ||
                        "C:\\ProgramData\\PatientAppointmentSystem\\WhatsAppData"
                      }
                      disabled={!whatsappIntegration}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      disabled={!whatsappIntegration}
                      onClick={async () => {
                        try {
                          // Ottieni i valori dai campi
                          const browserPath = document.getElementById(
                            "whatsapp-browser-path",
                          )?.value;
                          const dataPath =
                            document.getElementById(
                              "whatsapp-data-path",
                            )?.value;

                          if (!browserPath || !dataPath) {
                            alert(
                              "Inserisci tutti i campi per configurare l'integrazione",
                            );
                            return;
                          }

                          // Salva i valori in localStorage
                          localStorage.setItem(
                            "whatsappBrowserPath",
                            browserPath,
                          );
                          localStorage.setItem("whatsappDataPath", dataPath);

                          // Configura l'integrazione
                          const { WhatsAppService } = await import(
                            "@/services/whatsapp.service"
                          );
                          const whatsAppService = WhatsAppService.getInstance();

                          const result = await whatsAppService.configure(
                            browserPath,
                            dataPath,
                          );

                          if (result) {
                            alert(
                              "Integrazione con WhatsApp configurata con successo! Ora puoi autenticare WhatsApp Web.",
                            );
                          } else {
                            alert(
                              "Errore nella configurazione dell'integrazione con WhatsApp",
                            );
                          }
                        } catch (error) {
                          console.error(
                            "Errore nella configurazione dell'integrazione con WhatsApp:",
                            error,
                          );
                          alert(
                            `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                          );
                        }
                      }}
                    >
                      Configura Integrazione
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!whatsappIntegration}
                      onClick={async () => {
                        try {
                          // Autentica WhatsApp Web
                          const { WhatsAppService } = await import(
                            "@/services/whatsapp.service"
                          );
                          const whatsAppService = WhatsAppService.getInstance();

                          // Verifica se il servizio è abilitato
                          const isEnabled =
                            await whatsAppService.isServiceEnabled();

                          if (!isEnabled) {
                            alert(
                              "Il servizio WhatsApp non è abilitato. Verifica la tua licenza.",
                            );
                            return;
                          }

                          alert(
                            "Verrà avviato WhatsApp Web. Scansiona il codice QR con il tuo telefono per autenticarti.",
                          );

                          const result = await whatsAppService.authenticate();

                          if (result) {
                            alert(
                              "Autenticazione WhatsApp Web completata con successo!",
                            );
                          } else {
                            alert("Errore nell'autenticazione di WhatsApp Web");
                          }
                        } catch (error) {
                          console.error(
                            "Errore nell'autenticazione di WhatsApp Web:",
                            error,
                          );
                          alert(
                            `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
                          );
                        }
                      }}
                    >
                      Autentica WhatsApp Web
                    </Button>
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Apri una nuova finestra per scaricare Chrome
                        window.open("https://www.google.com/chrome/", "_blank");
                      }}
                    >
                      Scarica Chrome
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Template Notifiche WhatsApp */}
              {whatsappIntegration && <NotificationTemplates />}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Impostazioni Notifiche</CardTitle>
                  <CardDescription>
                    Configura le impostazioni per le notifiche automatiche
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications-enabled">
                        Notifiche Automatiche
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Invia automaticamente notifiche per gli appuntamenti
                      </p>
                    </div>
                    <Switch
                      id="notifications-enabled"
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notification-time">
                      Orario Notifiche Giornaliere
                    </Label>
                    <Input
                      id="notification-time"
                      type="time"
                      defaultValue="08:00"
                      disabled={!notificationsEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notification-days-before">
                      Giorni di Anticipo per Promemoria
                    </Label>
                    <Select defaultValue="1" disabled={!notificationsEnabled}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Seleziona giorni" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 giorno prima</SelectItem>
                        <SelectItem value="2">2 giorni prima</SelectItem>
                        <SelectItem value="3">3 giorni prima</SelectItem>
                        <SelectItem value="7">1 settimana prima</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Tipi di Notifica</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="confirmation-notification">
                            Conferma Appuntamento
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Invia una notifica di conferma quando viene creato
                            un appuntamento
                          </p>
                        </div>
                        <Switch
                          id="confirmation-notification"
                          defaultChecked={true}
                          disabled={!notificationsEnabled}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="reminder-notification">
                            Promemoria Appuntamento
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Invia un promemoria prima dell'appuntamento
                          </p>
                        </div>
                        <Switch
                          id="reminder-notification"
                          defaultChecked={true}
                          disabled={!notificationsEnabled}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="followup-notification">
                            Follow-up Post Appuntamento
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Invia un messaggio di follow-up dopo l'appuntamento
                          </p>
                        </div>
                        <Switch
                          id="followup-notification"
                          defaultChecked={false}
                          disabled={!notificationsEnabled}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <NotificationTemplates />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
