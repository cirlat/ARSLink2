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
  const [backupPath, setBackupPath] = useState("C:\\ProgramData\\PatientAppointmentSystem\\Backups");
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
    if (currentStep < 7) { // Aumentato il numero di step
      setCurrentStep(currentStep + 1);
      setProgress(Math.floor((currentStep + 1) * 100 / 7)); // Aggiornato il calcolo del progresso
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setProgress(Math.floor((currentStep - 1) * 100 / 7)); // Aggiornato il calcolo del progresso
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
      language
    };
    localStorage.setItem('generalSettings', JSON.stringify(generalSettings));
    
    // Salva le impostazioni di backup
    const backupSettings = {
      autoBackup,
      backupFrequency,
      backupPath
    };
    localStorage.setItem('backupSettings', JSON.stringify(backupSettings));
    
    // Crea l'utente admin
    localStorage.setItem("setupCompleted", "true");
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("currentUser", JSON.stringify({
      username: adminUser.username,
      full_name: adminUser.fullName,
      email: adminUser.email,
      role: "Medico"
    }));
    
    // Salva gli utenti nel localStorage
    const users = [{
      id: 1,
      username: adminUser.username,
      password: adminUser.password, // In un'app reale, questa password sarebbe hashata
      full_name: adminUser.fullName,
      email: adminUser.email,
      role: "Medico"
    }];
    
    // Aggiungi l'utente assistente se richiesto
    if (createAssistant && assistantName && assistantUsername && assistantPassword && assistantEmail) {
      users.push({
        id: 2,
        username: assistantUsername,
        password: assistantPassword,
        full_name: assistantName,
        email: assistantEmail,
        role: "Assistente"
      });
    }
    
    localStorage.setItem("users", JSON.stringify(users));
    
    // Salva la licenza
    localStorage.setItem("licenseKey", licenseKey);
    localStorage.setItem("licenseType", "full"); // Per scopi dimostrativi
    localStorage.setItem("licenseExpiry", new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()); // 1 anno
    
    // Applica la modalità scura se selezionata
    if (darkMode) {
      document.documentElement.classList.add('dark');
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
                <h2 className="text-xl font-bold mb-4">Configurazione Database</h2>
                <p className="text-muted-foreground mb-6">
                  Configura la connessione al database PostgreSQL
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="db-host">Host</Label>
                    <Input
                      id="db-host"
                      value={dbConfig.host}
                      onChange={(e) => handleDbConfigChange("host", e.target.value)}
