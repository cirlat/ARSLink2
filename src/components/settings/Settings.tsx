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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Key,
  User,
  Database,
  Bell,
  Calendar,
  Lock,
  Save,
  RefreshCw,
  Download,
  Upload,
  Check,
  Plus,
  FileEdit,
  Trash2,
  Eye,
} from "lucide-react";
import { LicenseModel } from "@/models/license";

/**
 * Check if the current license includes WhatsApp functionality
 * @returns boolean indicating if WhatsApp is available
 */
const hasWhatsAppLicense = (): boolean => {
  const licenseType = localStorage.getItem("licenseType");
  return (
    licenseType === "whatsapp" ||
    licenseType === "full" ||
    (licenseType && licenseType.startsWith("WHATSAPP-")) ||
    (licenseType && licenseType.startsWith("FULL-"))
  );
};

/**
 * Check if the current license includes Google Calendar functionality
 * @returns boolean indicating if Google Calendar is available
 */
const hasGoogleCalendarLicense = (): boolean => {
  const licenseType = localStorage.getItem("licenseType");
  return (
    licenseType === "google" ||
    licenseType === "full" ||
    (licenseType && licenseType.startsWith("GOOGLE-")) ||
    (licenseType && licenseType.startsWith("FULL-"))
  );
};

/**
 * Check if the license is expired
 * @returns boolean indicating if the license is expired
 */
const isLicenseExpired = (): boolean => {
  const licenseExpiry = localStorage.getItem("licenseExpiry");
  if (!licenseExpiry) return true;

  const expiryDate = new Date(licenseExpiry);
  const now = new Date();
  return expiryDate < now;
};

/**
 * Get the number of days remaining until license expiration
 * @returns number of days remaining, or 0 if expired
 */
const getLicenseRemainingDays = (): number => {
  const licenseExpiry = localStorage.getItem("licenseExpiry");
  if (!licenseExpiry) return 0;

  const expiryDate = new Date(licenseExpiry);
  const now = new Date();

  if (expiryDate < now) return 0;

  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get the license type in a user-friendly format
 * @returns string representing the license type
 */
const getLicenseTypeDisplay = (): string => {
  const licenseType = localStorage.getItem("licenseType");

  if (!licenseType) return "Non attiva";

  if (licenseType === "full" || licenseType.startsWith("FULL-")) {
    return "Completa";
  }

  if (licenseType === "whatsapp" || licenseType.startsWith("WHATSAPP-")) {
    return "WhatsApp";
  }

  if (licenseType === "google" || licenseType.startsWith("GOOGLE-")) {
    return "Google Calendar";
  }

  return "Base";
};

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("license");

  // Impostazioni generali
  const [clinicName, setClinicName] = useState("Studio Medico Dr. Rossi");
  const [address, setAddress] = useState("Via Roma 123, 00100 Roma");
  const [email, setEmail] = useState("info@studiomedico.it");
  const [phone, setPhone] = useState("+39 06 12345678");
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("it");

  // Impostazioni backup
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [backupPath, setBackupPath] = useState(
    "C:\\ProgramData\\PatientAppointmentSystem\\Backups",
  );

  // Impostazioni notifiche
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("24");

  // Impostazioni integrazioni
  const [googleCalendarSync, setGoogleCalendarSync] = useState(true);
  const [whatsappIntegration, setWhatsappIntegration] = useState(true);

  // Impostazioni sicurezza
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [autoLock, setAutoLock] = useState(true);

  // Altri stati
  const [showLicenseInfo, setShowLicenseInfo] = useState(false);

  const handleNavigation = (pageId: string) => {
    setActiveTab(pageId);
  };

  const handleSaveSettings = () => {
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

    // Applica la modalità scura se selezionata
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Applica la lingua selezionata
    localStorage.setItem("language", language);

    // Salva le impostazioni di backup
    const backupSettings = {
      autoBackup,
      backupFrequency,
      backupPath,
    };
    localStorage.setItem("backupSettings", JSON.stringify(backupSettings));

    // Salva le impostazioni di notifica
    const notificationSettings = {
      notificationsEnabled,
      reminderTime,
    };
    localStorage.setItem(
      "notificationSettings",
      JSON.stringify(notificationSettings),
    );

    // Salva le impostazioni di sicurezza
    const securitySettings = {
      sessionTimeout,
      autoLock,
    };
    localStorage.setItem("securitySettings", JSON.stringify(securitySettings));

    alert("Impostazioni salvate con successo!");
  };

  // Funzione per eseguire il backup manuale
  const handleManualBackup = async () => {
    try {
      // Ottieni il percorso di backup
      if (!backupPath) {
        alert("Seleziona un percorso di backup valido");
        return;
      }

      // Simula un'operazione di backup
      const backupButton = document.getElementById("manualBackupButton");
      if (backupButton) {
        backupButton.textContent = "Backup in corso...";
        backupButton.setAttribute("disabled", "true");
      }

      // Simula un ritardo per l'operazione di backup
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Ottieni i dati da salvare nel backup
      const dataToBackup = {
        patients: JSON.parse(localStorage.getItem("patients") || "[]"),
        appointments: JSON.parse(localStorage.getItem("appointments") || "[]"),
        notifications: JSON.parse(
          localStorage.getItem("notifications") || "[]",
        ),
        users: JSON.parse(localStorage.getItem("users") || "[]"),
        generalSettings: JSON.parse(
          localStorage.getItem("generalSettings") || "{}",
        ),
        backupSettings: JSON.parse(
          localStorage.getItem("backupSettings") || "{}",
        ),
        notificationSettings: JSON.parse(
          localStorage.getItem("notificationSettings") || "{}",
        ),
        securitySettings: JSON.parse(
          localStorage.getItem("securitySettings") || "{}",
        ),
      };

      // In un'app reale, qui salveremmo i dati in un file
      // Per questa simulazione, salviamo i dati nel localStorage
      const backupData = JSON.stringify(dataToBackup);
      localStorage.setItem("lastBackupData", backupData);

      // Registra il backup nel localStorage
      const backups = JSON.parse(localStorage.getItem("backups") || "[]");
      const newBackup = {
        id: Date.now(),
        filename: `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.sql`,
        path: backupPath,
        size: Math.floor(Math.random() * 1000) + 500, // Dimensione simulata in KB
        status: "success",
        created_at: new Date().toISOString(),
      };
      backups.push(newBackup);
      localStorage.setItem("backups", JSON.stringify(backups));

      // Aggiorna lo stato del backup
      localStorage.setItem("lastBackup", new Date().toISOString());
      localStorage.setItem("lastBackupPath", backupPath);
      localStorage.setItem("lastBackupStatus", "success");

      if (backupButton) {
        backupButton.textContent = "Esegui Backup Manuale";
        backupButton.removeAttribute("disabled");
      }

      alert(
        `Backup completato con successo! File: ${newBackup.filename}\nSalvato in: ${backupPath}`,
      );
    } catch (error) {
      console.error("Errore durante il backup:", error);
      alert(
        "Si è verificato un errore durante il backup. Controlla la console per i dettagli.",
      );

      const backupButton = document.getElementById("manualBackupButton");
      if (backupButton) {
        backupButton.textContent = "Esegui Backup Manuale";
        backupButton.removeAttribute("disabled");
      }

      // Registra il fallimento del backup
      localStorage.setItem("lastBackupStatus", "failed");
    }
  };

  // Funzione per ripristinare da backup
  const handleRestoreBackup = async () => {
    try {
      // Simula la selezione di un file di backup
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".sql";

      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Simula un'operazione di ripristino
        const restoreButton = document.getElementById("restoreBackupButton");
        if (restoreButton) {
          restoreButton.textContent = "Ripristino in corso...";
          restoreButton.setAttribute("disabled", "true");
        }

        // Simula un ritardo per l'operazione di ripristino
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // In un'app reale, qui leggeremmo il contenuto del file
        // Per questa simulazione, utilizziamo i dati dell'ultimo backup
        const backupData = localStorage.getItem("lastBackupData");
        if (backupData) {
          try {
            const data = JSON.parse(backupData);

            // Ripristina i dati dal backup
            if (data.patients)
              localStorage.setItem("patients", JSON.stringify(data.patients));
            if (data.appointments)
              localStorage.setItem(
                "appointments",
                JSON.stringify(data.appointments),
              );
            if (data.notifications)
              localStorage.setItem(
                "notifications",
                JSON.stringify(data.notifications),
              );
            if (data.users)
              localStorage.setItem("users", JSON.stringify(data.users));
            if (data.generalSettings)
              localStorage.setItem(
                "generalSettings",
                JSON.stringify(data.generalSettings),
              );
            if (data.backupSettings)
              localStorage.setItem(
                "backupSettings",
                JSON.stringify(data.backupSettings),
              );
            if (data.notificationSettings)
              localStorage.setItem(
                "notificationSettings",
                JSON.stringify(data.notificationSettings),
              );
            if (data.securitySettings)
              localStorage.setItem(
                "securitySettings",
                JSON.stringify(data.securitySettings),
              );

            // Aggiorna l'interfaccia utente con i dati ripristinati
            if (data.generalSettings) {
              const settings = data.generalSettings;
              if (settings.clinicName) setClinicName(settings.clinicName);
              if (settings.address) setAddress(settings.address);
              if (settings.email) setEmail(settings.email);
              if (settings.phone) setPhone(settings.phone);
              if (settings.darkMode !== undefined)
                setDarkMode(settings.darkMode);
              if (settings.language) setLanguage(settings.language);
            }

            if (data.backupSettings) {
              const settings = data.backupSettings;
              if (settings.autoBackup !== undefined)
                setAutoBackup(settings.autoBackup);
              if (settings.backupFrequency)
                setBackupFrequency(settings.backupFrequency);
              if (settings.backupPath) setBackupPath(settings.backupPath);
            }
          } catch (error) {
            console.error(
              "Errore durante il parsing dei dati di backup:",
              error,
            );
            throw new Error("Il file di backup è danneggiato o non valido");
          }
        } else {
          // Se non c'è un backup precedente, mostriamo un messaggio di avviso
          alert(
            "Nessun backup precedente trovato. Verrà simulato un ripristino.",
          );
        }

        // Registra il ripristino nel localStorage
        localStorage.setItem("lastRestore", new Date().toISOString());
        localStorage.setItem("lastRestorePath", file.name);
        localStorage.setItem("lastRestoreStatus", "success");

        if (restoreButton) {
          restoreButton.textContent = "Ripristina da Backup";
          restoreButton.removeAttribute("disabled");
        }

        alert(`Ripristino completato con successo dal file: ${file.name}`);

        // Ricarica la pagina per applicare le modifiche
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      };

      fileInput.click();
    } catch (error) {
      console.error("Errore durante il ripristino:", error);
      alert(
        "Si è verificato un errore durante il ripristino: " +
          (error.message || "Errore sconosciuto"),
      );

      const restoreButton = document.getElementById("restoreBackupButton");
      if (restoreButton) {
        restoreButton.textContent = "Ripristina da Backup";
        restoreButton.removeAttribute("disabled");
      }

      // Registra il fallimento del ripristino
      localStorage.setItem("lastRestoreStatus", "failed");
    }
  };

  // Funzione per selezionare il percorso di backup
  const handleSelectBackupPath = () => {
    // In un'app desktop reale, qui si aprirebbe un dialog per selezionare la cartella
    // Per questa simulazione, chiediamo all'utente di inserire un percorso
    const path = prompt("Inserisci il percorso per i backup:", backupPath);
    if (path) {
      setBackupPath(path);
      // Salva il percorso nel localStorage
      const backupSettings = JSON.parse(
        localStorage.getItem("backupSettings") || "{}",
      );
      backupSettings.backupPath = path;
      localStorage.setItem("backupSettings", JSON.stringify(backupSettings));
    }
  };

  // Carica le impostazioni salvate all'avvio del componente
  useEffect(() => {
    // Carica impostazioni generali
    const savedGeneralSettings = localStorage.getItem("generalSettings");
    if (savedGeneralSettings) {
      const settings = JSON.parse(savedGeneralSettings);
      if (settings.clinicName) setClinicName(settings.clinicName);
      if (settings.address) setAddress(settings.address);
      if (settings.email) setEmail(settings.email);
      if (settings.phone) setPhone(settings.phone);
      if (settings.darkMode !== undefined) setDarkMode(settings.darkMode);
      if (settings.language) setLanguage(settings.language);
    }

    // Carica impostazioni backup
    const savedBackupSettings = localStorage.getItem("backupSettings");
    if (savedBackupSettings) {
      const settings = JSON.parse(savedBackupSettings);
      if (settings.autoBackup !== undefined) setAutoBackup(settings.autoBackup);
      if (settings.backupFrequency)
        setBackupFrequency(settings.backupFrequency);
      if (settings.backupPath) setBackupPath(settings.backupPath);
    }

    // Carica impostazioni notifiche
    const savedNotificationSettings = localStorage.getItem(
      "notificationSettings",
    );
    if (savedNotificationSettings) {
      const settings = JSON.parse(savedNotificationSettings);
      if (settings.notificationsEnabled !== undefined)
        setNotificationsEnabled(settings.notificationsEnabled);
      if (settings.reminderTime) setReminderTime(settings.reminderTime);
    }

    // Carica impostazioni sicurezza
    const savedSecuritySettings = localStorage.getItem("securitySettings");
    if (savedSecuritySettings) {
      const settings = JSON.parse(savedSecuritySettings);
      if (settings.sessionTimeout) setSessionTimeout(settings.sessionTimeout);
      if (settings.autoLock !== undefined) setAutoLock(settings.autoLock);
    }

    // Applica la modalità scura se salvata
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <Button onClick={handleSaveSettings}>
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
              {hasWhatsAppLicense() && (
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
                Sicurezza
              </Button>
              <Button
                variant={activeTab === "users" ? "default" : "ghost"}
                className="w-full justify-start px-2 py-1.5 h-9"
                onClick={() => setActiveTab("users")}
              >
                <User className="h-4 w-4 mr-2" />
                Gestione Utenti
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-6">
          {activeTab === "license" && (
            <div className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Informazioni Licenza</CardTitle>
                  <CardDescription>
                    Visualizza e gestisci la tua licenza
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Stato Licenza</Label>
                        <div className="flex items-center space-x-2">
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          <span className="font-medium">Attiva</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo Licenza</Label>
                        <div className="font-medium">Completa</div>
                      </div>

                      <div className="space-y-2">
                        <Label>Data Scadenza</Label>
                        <div className="font-medium">31/12/2023</div>
                      </div>

                      <div className="space-y-2">
                        <Label>Giorni Rimanenti</Label>
                        <div className="font-medium">180 giorni</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="license-key">Chiave di Licenza</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="license-key"
                            value="XXXX-XXXX-XXXX-XXXX"
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowLicenseInfo(!showLicenseInfo)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-license-key">
                          Aggiorna Licenza
                        </Label>
                        <div className="flex space-x-2">
                          <Input
                            id="new-license-key"
                            placeholder="Inserisci nuova chiave di licenza"
                            className="font-mono"
                          />
                          <Button variant="outline">
                            <Check className="h-4 w-4 mr-2" />
                            Verifica
                          </Button>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button variant="outline" className="w-full">
                          Acquista Licenza
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">
                      Funzionalità Incluse
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Gestione Pazienti</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Gestione Appuntamenti</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Backup e Ripristino</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Integrazione Google Calendar</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Notifiche WhatsApp</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Supporto Tecnico</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                    <h3 className="text-lg font-medium">Informazioni Studio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Aspetto</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dark-mode">Modalità Scura</Label>
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="language">Lingua Applicazione</Label>
                      <Select value={language} onValueChange={setLanguage}>
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
              <Card>
                <CardHeader>
                  <CardTitle>Backup e Ripristino</CardTitle>
                  <CardDescription>
                    Configura le impostazioni di backup e ripristino del
                    database
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Backup Automatico</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-backup">
                        Abilita Backup Automatico
                      </Label>
                      <Switch
                        id="auto-backup"
                        checked={autoBackup}
                        onCheckedChange={setAutoBackup}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backup-frequency">Frequenza Backup</Label>
                      <Select
                        value={backupFrequency}
                        onValueChange={setBackupFrequency}
                        disabled={!autoBackup}
                      >
                        <SelectTrigger className="w-full">
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
                      <div className="flex space-x-2">
                        <Input
                          id="backup-path"
                          placeholder="C:\\ProgramData\\PatientAppointmentSystem\\Backups"
                          value={backupPath}
                          onChange={(e) => setBackupPath(e.target.value)}
                          disabled={!autoBackup}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          disabled={!autoBackup}
                          onClick={handleSelectBackupPath}
                        >
                          Sfoglia
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Backup Manuale</h3>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        id="manualBackupButton"
                        onClick={handleManualBackup}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Esegui Backup Manuale
                      </Button>
                      <Button
                        variant="outline"
                        id="restoreBackupButton"
                        onClick={handleRestoreBackup}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Ripristina da Backup
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Stato Backup</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ultimo Backup</Label>
                        <div className="font-medium">
                          {localStorage.getItem("lastBackup")
                            ? new Date(
                                localStorage.getItem("lastBackup") as string,
                              ).toLocaleString()
                            : "Nessun backup eseguito"}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Stato</Label>
                        <div className="flex items-center space-x-2">
                          {localStorage.getItem("lastBackupStatus") ===
                          "success" ? (
                            <>
                              <div className="h-3 w-3 rounded-full bg-green-500"></div>
                              <span className="font-medium">Completato</span>
                            </>
                          ) : localStorage.getItem("lastBackupStatus") ===
                            "failed" ? (
                            <>
                              <div className="h-3 w-3 rounded-full bg-red-500"></div>
                              <span className="font-medium">Fallito</span>
                            </>
                          ) : (
                            <>
                              <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                              <span className="font-medium">
                                Non disponibile
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && hasWhatsAppLicense() && (
            <div className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Impostazioni Notifiche</CardTitle>
                  <CardDescription>
                    Configura le notifiche e i promemoria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notifiche WhatsApp</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications-enabled">
                        Abilita Notifiche WhatsApp
                      </Label>
                      <Switch
                        id="notifications-enabled"
                        checked={notificationsEnabled}
                        onCheckedChange={setNotificationsEnabled}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reminder-time">
                        Anticipo Promemoria Appuntamenti
                      </Label>
                      <Select
                        value={reminderTime}
                        onValueChange={setReminderTime}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleziona anticipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 ora prima</SelectItem>
                          <SelectItem value="3">3 ore prima</SelectItem>
                          <SelectItem value="24">24 ore prima</SelectItem>
                          <SelectItem value="48">2 giorni prima</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Modelli di Messaggio
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="confirmation-template">
                        Modello Conferma Appuntamento
                      </Label>
                      <Textarea
                        id="confirmation-template"
                        placeholder="Modello per le conferme di appuntamento"
                        defaultValue="Gentile {paziente}, confermiamo il suo appuntamento per il {data} alle {ora}. Risponda 'OK' per confermare o 'NO' per annullare. Grazie!"
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reminder-template">
                        Modello Promemoria Appuntamento
                      </Label>
                      <Textarea
                        id="reminder-template"
                        placeholder="Modello per i promemoria di appuntamento"
                        defaultValue="Gentile {paziente}, le ricordiamo il suo appuntamento per domani {data} alle {ora}. A presto!"
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Integrazioni</CardTitle>
                  <CardDescription>
                    Configura le integrazioni con servizi esterni
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Google Calendar</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="google-calendar-sync">
                        Sincronizza con Google Calendar
                      </Label>
                      <Switch
                        id="google-calendar-sync"
                        checked={googleCalendarSync}
                        onCheckedChange={setGoogleCalendarSync}
                        disabled={!hasGoogleCalendarLicense()}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="google-calendar-id">
                        Calendario da Utilizzare
                      </Label>
                      <Select
                        defaultValue="primary"
                        disabled={
                          !hasGoogleCalendarLicense() || !googleCalendarSync
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleziona calendario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">
                            Calendario principale
                          </SelectItem>
                          <SelectItem value="work">Lavoro</SelectItem>
                          <SelectItem value="personal">Personale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="google-client-id">Client ID</Label>
                      <Input
                        id="google-client-id"
                        placeholder="Client ID di Google"
                        disabled={
                          !hasGoogleCalendarLicense() || !googleCalendarSync
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="google-client-secret">
                        Client Secret
                      </Label>
                      <Input
                        id="google-client-secret"
                        type="password"
                        placeholder="Client Secret di Google"
                        disabled={
                          !hasGoogleCalendarLicense() || !googleCalendarSync
                        }
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        disabled={
                          !hasGoogleCalendarLicense() || !googleCalendarSync
                        }
                        onClick={() => {
                          alert("Sincronizzazione con Google Calendar avviata");
                          setTimeout(() => {
                            alert("Sincronizzazione completata con successo!");
                          }, 2000);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sincronizza Ora
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (
                            hasGoogleCalendarLicense() &&
                            googleCalendarSync
                          ) {
                            window.open(
                              "https://console.cloud.google.com/",
                              "_blank",
                            );
                          } else if (
                            hasWhatsAppLicense() &&
                            whatsappIntegration
                          ) {
                            alert(
                              "Scansiona il codice QR per autenticare WhatsApp Web",
                            );
                          } else {
                            alert("Attiva prima le integrazioni");
                          }
                        }}
                      >
                        Configura Integrazioni
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">WhatsApp</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="whatsapp-integration">
                        Integrazione WhatsApp
                      </Label>
                      <Switch
                        id="whatsapp-integration"
                        checked={whatsappIntegration}
                        onCheckedChange={setWhatsappIntegration}
                        disabled={!hasWhatsAppLicense()}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-browser-path">
                        Percorso Browser
                      </Label>
                      <Input
                        id="whatsapp-browser-path"
                        placeholder="C:\Program Files\Google\Chrome\Application\chrome.exe"
                        defaultValue="C:\Program Files\Google\Chrome\Application\chrome.exe"
                        disabled={!hasWhatsAppLicense() || !whatsappIntegration}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-data-path">
                        Percorso Dati WhatsApp
                      </Label>
                      <Input
                        id="whatsapp-data-path"
                        placeholder="C:\ProgramData\PatientAppointmentSystem\WhatsApp"
                        defaultValue="C:\ProgramData\PatientAppointmentSystem\WhatsApp"
                        disabled={!hasWhatsAppLicense() || !whatsappIntegration}
                      />
                    </div>

                    <Button
                      variant="outline"
                      disabled={!hasWhatsAppLicense() || !whatsappIntegration}
                    >
                      Autentica WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Sicurezza</CardTitle>
                  <CardDescription>
                    Configura le impostazioni di sicurezza
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Sessione</h3>
                    <div className="space-y-2">
                      <Label htmlFor="session-timeout">
                        Timeout Sessione Inattiva
                      </Label>
                      <Select
                        value={sessionTimeout}
                        onValueChange={setSessionTimeout}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Seleziona timeout" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minuti</SelectItem>
                          <SelectItem value="30">30 minuti</SelectItem>
                          <SelectItem value="60">1 ora</SelectItem>
                          <SelectItem value="never">Mai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-lock">
                        Blocco Automatico all'Inattività
                      </Label>
                      <Switch
                        checked={autoLock}
                        onCheckedChange={setAutoLock}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Cambio Password</h3>
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Password Attuale</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="Inserisci la password attuale"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nuova Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Inserisci la nuova password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        Conferma Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Conferma la nuova password"
                      />
                    </div>

                    <Button
                      className="mt-2"
                      onClick={() => {
                        const currentPassword = document.getElementById(
                          "current-password",
                        ) as HTMLInputElement;
                        const newPassword = document.getElementById(
                          "new-password",
                        ) as HTMLInputElement;
                        const confirmPassword = document.getElementById(
                          "confirm-password",
                        ) as HTMLInputElement;

                        if (
                          !currentPassword?.value ||
                          !newPassword?.value ||
                          !confirmPassword?.value
                        ) {
                          alert("Compila tutti i campi");
                          return;
                        }

                        if (newPassword.value !== confirmPassword.value) {
                          alert("Le nuove password non corrispondono");
                          return;
                        }

                        // Verifica la password corrente
                        const currentUser = JSON.parse(
                          localStorage.getItem("currentUser") || "{}",
                        );
                        const users = JSON.parse(
                          localStorage.getItem("users") || "[]",
                        );
                        const user = users.find(
                          (u: any) => u.username === currentUser.username,
                        );

                        if (!user) {
                          alert("Utente non trovato");
                          return;
                        }

                        // In un'app reale, qui verificheremmo la password hashata
                        // Per questa simulazione, confrontiamo direttamente le password
                        if (user.password !== currentPassword.value) {
                          alert("Password corrente non valida");
                          return;
                        }

                        // Aggiorna la password dell'utente
                        user.password = newPassword.value;
                        localStorage.setItem("users", JSON.stringify(users));

                        // Simuliamo il cambio password
                        alert("Password cambiata con successo!");

                        // Puliamo i campi
                        currentPassword.value = "";
                        newPassword.value = "";
                        confirmPassword.value = "";
                      }}
                    >
                      Cambia Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Gestione Utenti</CardTitle>
                  <CardDescription>
                    Gestisci gli utenti che possono accedere al sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Utenti</h3>
                    <Button
                      onClick={() => {
                        // Apri un dialog per creare un nuovo utente
                        const name = prompt("Nome completo:");
                        if (!name) return;

                        const username = prompt("Username:");
                        if (!username) return;

                        const password = prompt("Password:");
                        if (!password) return;

                        const email = prompt("Email:");
                        if (!email) return;

                        const role = confirm(
                          "Questo utente sarà un Assistente? Premi Annulla per Medico.",
                        )
                          ? "Assistente"
                          : "Medico";

                        // Aggiungi il nuovo utente
                        const users = JSON.parse(
                          localStorage.getItem("users") || "[]",
                        );
                        const newUser = {
                          id: Date.now(),
                          username,
                          password,
                          full_name: name,
                          email,
                          role,
                        };

                        users.push(newUser);
                        localStorage.setItem("users", JSON.stringify(users));

                        // Ricarica la pagina per mostrare il nuovo utente
                        window.location.reload();
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo Utente
                    </Button>
                  </div>

                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Ruolo</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const users = JSON.parse(
                            localStorage.getItem("users") || "[]",
                          );
                          if (users.length === 0) {
                            // Se non ci sono utenti, mostra gli utenti predefiniti
                            return (
                              <>
                                <TableRow>
                                  <TableCell className="font-medium">
                                    Amministratore
                                  </TableCell>
                                  <TableCell>admin</TableCell>
                                  <TableCell>admin@arslink.it</TableCell>
                                  <TableCell>Medico</TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                      <FileEdit className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">
                                    Mario Rossi
                                  </TableCell>
                                  <TableCell>mario</TableCell>
                                  <TableCell>mario.rossi@example.com</TableCell>
                                  <TableCell>Assistente</TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                      <FileEdit className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              </>
                            );
                          }

                          // Altrimenti, mostra gli utenti dal localStorage
                          return users.map((user: any) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.full_name}
                              </TableCell>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.role}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Modifica l'utente
                                    const name = prompt(
                                      "Nome completo:",
                                      user.full_name,
                                    );
                                    if (!name) return;

                                    const email = prompt("Email:", user.email);
                                    if (!email) return;

                                    const role = confirm(
                                      "Questo utente sarà un Assistente? Premi Annulla per Medico.",
                                    )
                                      ? "Assistente"
                                      : "Medico";

                                    // Aggiorna l'utente
                                    user.full_name = name;
                                    user.email = email;
                                    user.role = role;

                                    localStorage.setItem(
                                      "users",
                                      JSON.stringify(users),
                                    );

                                    // Ricarica la pagina per mostrare le modifiche
                                    window.location.reload();
                                  }}
                                >
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Elimina l'utente
                                    if (
                                      confirm(
                                        `Sei sicuro di voler eliminare l'utente ${user.full_name}?`,
                                      )
                                    ) {
                                      const updatedUsers = users.filter(
                                        (u: any) => u.id !== user.id,
                                      );
                                      localStorage.setItem(
                                        "users",
                                        JSON.stringify(updatedUsers),
                                      );

                                      // Ricarica la pagina per mostrare le modifiche
                                      window.location.reload();
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ));
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
