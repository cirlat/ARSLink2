import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import LoginForm from "@/components/auth/LoginForm";
import Dashboard from "@/components/dashboard/Dashboard";
import LicenseAlert from "@/components/system/LicenseAlert";
import BackupStatus from "@/components/system/BackupStatus";

interface HomeProps {
  isAuthenticated?: boolean;
  userRole?: "Medico" | "Assistente";
  userName?: string;
  licenseExpiryDays?: number;
}

const Home = ({
  isAuthenticated = false,
  userRole = "Medico",
  userName = "Dr. Mario Rossi",
  licenseExpiryDays = 30,
}: HomeProps) => {
  const [authenticated, setAuthenticated] = useState<boolean>(isAuthenticated);
  const [loginError, setLoginError] = useState<string>("");
  const [showLicenseAlert, setShowLicenseAlert] = useState<boolean>(
    licenseExpiryDays < 15,
  );

  // Handle login submission
  const handleLogin = async (data: {
    username: string;
    password: string;
    role: string;
  }) => {
    // Verifica se esiste un utente nel database
    try {
      // Simuliamo una chiamata al database
      // Importiamo il servizio di autenticazione
      const { AuthService } = await import("@/services/auth.service");
      const authService = AuthService.getInstance();
      const result = await authService.login(data.username, data.password);

      if (result.user) {
        setAuthenticated(true);
        setLoginError("");
        // Imposta un flag per indicare che l'utente è autenticato
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userName", `Dr. ${data.username}`);
      } else {
        // Se l'errore è relativo alla licenza, mostra un messaggio speciale
        if (result.error && result.error.includes("licenza")) {
          // Permetti comunque l'accesso ma con un messaggio di avviso
          setAuthenticated(true);
          setLoginError("");
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("userRole", data.role);
          localStorage.setItem("userName", `Dr. ${data.username}`);
          localStorage.setItem("licenseExpired", "true");
          // Reindirizza alle impostazioni della licenza
          window.location.href = "/settings";
        } else {
          setLoginError(result.error || "Credenziali non valide");
        }
      }
    } catch (error) {
      console.error("Errore durante il login:", error);
      setLoginError("Si è verificato un errore durante il login");
    }
  };

  // Handle logout
  const handleLogout = () => {
    setAuthenticated(false);
  };

  if (!authenticated) {
    // Rimuovi l'indicatore di autenticazione
    localStorage.removeItem("isAuthenticated");
    return (
      <div className="min-h-screen bg-slate-50">
        <LoginForm onSubmit={handleLogin} error={loginError} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {showLicenseAlert && (
        <LicenseAlert
          daysRemaining={licenseExpiryDays}
          onDismiss={() => setShowLicenseAlert(false)}
        />
      )}

      <Dashboard
        userName={userName}
        userRole={userRole}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default Home;
