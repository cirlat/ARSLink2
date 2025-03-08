import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const handleLogin = (data: {
    username: string;
    password: string;
    role: "Medico" | "Assistente";
  }) => {
    // In a real app, this would validate credentials against a backend
    if (data.username && data.password) {
      setAuthenticated(true);
      setLoginError("");
      // Imposta un flag per indicare che l'utente è autenticato
      localStorage.setItem("isAuthenticated", "true");
    } else {
      setLoginError("Invalid username or password");
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
