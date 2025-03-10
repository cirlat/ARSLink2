import React, { useState } from "react";
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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <Button onClick={() => {
          // Salva tutte le impostazioni in localStorage
          
          // Impostazioni generali
          const clinicName = document.getElementById('clinic-name')?.value;
          const address = document.getElementById('address')?.value;
          const email = document.getElementById('email')?.value;
          const phone = document.getElementById('phone')?.value;
          
          // Backup
          const backupPath = document.getElementById('backup-path')?.value;
          const backupFrequency = document.querySelector('[id^="backup-frequency"]')?.value || 'daily';
          
          // Salva in localStorage
          if (clinicName) localStorage.setItem('clinicName', clinicName);
          if (address) localStorage.setItem('address', address);
          if (email) localStorage.setItem('email', email);
          if (phone) localStorage.setItem('phone', phone);
          if (backupPath) localStorage.setItem('backupPath', backupPath);
          
          // Salva le impostazioni come oggetto JSON
          const generalSettings = {
            clinicName: clinicName || 'Studio Medico Dr. Rossi',
            address: address || 'Via Roma 123, 00100 Roma',
            email: email || 'info@studiomedico.it',
            phone: phone || '+39 06 12345678',
            darkMode: darkMode,
            language: document.querySelector('[id^="language"]')?.value || 'it'
          };
          
          const backupConfig = {
            backupPath: backupPath || 'C:\\ProgramData\\PatientAppointmentSystem\\Backups',
            autoBackup: autoBackup,
            backupFrequency: backupFrequency
          };
          
          localStorage.setItem('generalSettings', JSON.stringify(generalSettings));
          localStorage.setItem('backupConfig', JSON.stringify(backupConfig));
          
          // Applica la modalità scura se necessario
          if (darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          alert('Impostazioni salvate con successo!');
        }}>
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
                Sicurezza
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
                        defaultValue="Studio Medico Dr. Rossi"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Indirizzo</Label>
                      <Input
                        id="address"
                        placeholder="Via Roma 123, 00100 Roma"
                        defaultValue="Via Roma 123, 00100 Roma"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="info@studiomedico.it"
                          defaultValue="info@studiomedico.it"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefono</Label>
                        <Input
                          id="phone"
                          placeholder="+39 06 12345678"
                          defaultValue="+39 06 12345678"
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
                            document.documentElement.classList.add('dark');
                          } else {
                            document.documentElement.classList.remove('dark');
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
                        defaultValue={localStorage.getItem('language') || "it"}
                        onValueChange={(value) => {
                          localStorage.setItem('language', value);
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
                      onCheckedChange={setAutoBackup}
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
                      onValueChange={setBackupFrequency}
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
                    <div className="flex gap-2">
                      <Input
                        id="backup-path"
                        placeholder="C:\\ProgramData\\PatientAppointmentSystem\\Backups"
                        defaultValue={localStorage.getItem('backupPath') || "C:\\ProgramData\\PatientAppointmentSystem\\Backups"}
                        disabled={!autoBackup}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        disabled={!autoBackup}
                        onClick={() => {
                          // Crea un input di tipo file nascosto
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.webkitdirectory = true;
                          input.directory = true;
                          
                          input.onchange = (e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              // Prendi la directory selezionata (il percorso del primo file fino all'ultima cartella)
                              const path = files[0].path.split('\\').slice(0, -1).join('\\');
                              const backupPathInput = document.getElementById('backup-path');
                              if (backupPathInput) {
                                backupPathInput.value = path;
                                // Salva il percorso in localStorage
                                localStorage.setItem('backupPath', path);
                              }
                            }
                          };
                          
                          input.click();
                        }}
                      >
                        Sfoglia
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        try {
                          const { backupDatabase } = await import('@/utils/dbUtils');
                          const backupPath = document.getElementById('backup-path')?.value || 'C:\\ProgramData\\PatientAppointmentSystem\\Backups';
                          const success = await backupDatabase(backupPath);
                          if (success) {
                            alert('Backup eseguito con successo in: ' + backupPath);
                          } else {
                            alert('Errore durante l'esecuzione del backup');
                          }
                        } catch (error) {
                          console.error('Errore durante il backup:', error);
                          alert('Si è verificato un errore durante il backup: ' + error.message);
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Esegui Backup Manuale
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        try {
                          // Apri un selettore di file
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.bak,.sql,.json';
                          
                          input.onchange = async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const { restoreDatabase } = await import('@/utils/dbUtils');
                              const success = await restoreDatabase(file.path || file.name);
                              if (success) {
                                alert('Ripristino completato con successo da: ' + file.name);
                                // Ricarica la pagina per mostrare i dati ripristinati
                                window.location.reload();
                              } else {
                                alert('Errore durante il ripristino del database');
                              }
                            }
                          };
                          
                          input.click();
                        } catch (error) {
                          console.error('Errore durante il ripristino:', error);
                          alert('Si è verificato un errore durante il ripristino: ' + error.message);
                        }
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Ripristina da Backup
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Impostazioni Notifiche</CardTitle>
                  <CardDescription>
                    Configura le notifiche e i promemoria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications-enabled">
                        Notifiche Attive
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Attiva/disattiva tutte le notifiche
                      </p>
                    </div>
                    <Switch
                      id="notifications-enabled"
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Tipi di Notifica</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Promemoria Appuntamenti</Label>
                        <p className="text-sm text-muted-foreground">
                          Invia promemoria per gli appuntamenti imminenti
                        </p>
                      </div>
                      <Switch checked={true} disabled={!notificationsEnabled} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Conferme Appuntamenti</Label>
                        <p className="text-sm text-muted-foreground">
                          Invia richieste di conferma per gli appuntamenti
                        </p>
                      </div>
                      <Switch checked={true} disabled={!notificationsEnabled} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notifiche di Sistema</Label>
                        <p className="text-sm text-muted-foreground">
                          Notifiche su backup, aggiornamenti e licenza
                        </p>
                      </div>
                      <Switch checked={true} disabled={!notificationsEnabled} />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Anticipo Promemoria</Label>
                    <Select defaultValue="24">
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
                    Gestisci le integrazioni con servizi esterni
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <Label htmlFor="google-calendar">Google Calendar</Label>
                        <Badge variant="outline" className="ml-2">
                          Connesso
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sincronizza gli appuntamenti con Google Calendar
                      </p>
                    </div>
                    <Switch
                      id="google-calendar"
                      checked={googleCalendarSync}
                      onCheckedChange={setGoogleCalendarSync}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Badge variant="outline" className="ml-2">
                          Connesso
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Invia notifiche tramite WhatsApp
                      </p>
                    </div>
                    <Switch
                      id="whatsapp"
                      checked={whatsappIntegration}
                      onCheckedChange={setWhatsappIntegration}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Calendario Google</Label>
                    <Select defaultValue="primary">
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

                  <div className="flex justify-between">
                    <Button variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizza Ora
                    </Button>
                    <Button variant="outline">Configura Integrazioni</Button>
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
                    Gestisci le impostazioni di sicurezza e accesso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
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

                    <Button className="mt-2">Cambia Password</Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Sessione</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Timeout Sessione</Label>
                        <p className="text-sm text-muted-foreground">
                          Disconnetti automaticamente dopo inattività
                        </p>
                      </div>
                      <Select defaultValue="30">
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
                      <div className="space-y-0.5">
                        <Label>Blocco Automatico</Label>
                        <p className="text-sm text-muted-foreground">
                          Richiedi password dopo inattività
                        </p>
                      </div>
                      <Switch checked={true} />
                    </div>
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
