import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
// TopNavigation rimosso come richiesto
import CalendarView from "./CalendarView";
import PatientList from "./PatientList";
import NotificationCenter from "./NotificationCenter";
import DashboardContent from "./DashboardContent";
import LicenseExpiredAlert from "../system/LicenseExpiredAlert";

interface DashboardProps {
  userName?: string;
  userRole?: "Medico" | "Assistente";
  userAvatar?: string;
  licenseExpiryDays?: number;
  lastBackupStatus?: "success" | "failed" | "pending";
  lastBackupTime?: string;
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  userName = "Dr. Mario Rossi",
  userRole = "Medico",
  userAvatar = "",
  licenseExpiryDays = 30,
  lastBackupStatus = "success",
  lastBackupTime = "2023-06-10 14:30",
  onLogout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<string>("dashboard");
  const [showLicenseAlert, setShowLicenseAlert] = useState<boolean>(
    licenseExpiryDays < 15 || localStorage.getItem("licenseExpired") === "true",
  );
  const [showBackupStatus, setShowBackupStatus] = useState<boolean>(
    lastBackupStatus === "failed",
  );
  const [isLicenseExpired, setIsLicenseExpired] = useState<boolean>(
    localStorage.getItem("licenseExpired") === "true",
  );

  // Aggiorna la pagina attiva in base al percorso corrente
  useEffect(() => {
    const path = location.pathname;
    if (path === "/") setActivePage("dashboard");
    else if (path === "/calendar") setActivePage("calendar");
    else if (path.startsWith("/patients")) setActivePage("patients");
    else if (path === "/notifications") setActivePage("notifications");
    else if (path === "/settings") setActivePage("settings");
  }, [location.pathname]);

  // Gestione della navigazione dalla sidebar
  const handleNavigation = (pageId: string) => {
    setActivePage(pageId);
  };

  // Gestione del logout
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      console.log("Disconnessione in corso...");
      // In un'app reale, questo gestirebbe la disconnessione dell'autenticazione
    }
  };

  // Gestione dell'aggiunta di un nuovo paziente
  const handleAddPatient = () => {
    navigate("/patients/new");
  };

  // Renderizza il contenuto appropriato in base alla pagina attiva
  const renderContent = () => {
    switch (activePage) {
      case "calendar":
        return <CalendarView />;
      case "patients":
        return <PatientList onAddPatient={handleAddPatient} />;
      case "notifications":
        return <NotificationCenter />;
      case "settings":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Impostazioni</h1>
            <p className="text-muted-foreground">
              Contenuto delle impostazioni da implementare.
            </p>
          </div>
        );
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar */}
      <Sidebar
        userName={userName}
        userRole={userRole}
        userAvatar={userAvatar}
        activePage={activePage}
        onLogout={handleLogout}
      />

      {/* Contenuto principale */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Avvisi di sistema */}
        {isLicenseExpired ? (
          <LicenseExpiredAlert onDismiss={() => setShowLicenseAlert(false)} />
        ) : (
          showLicenseAlert && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    La tua licenza scadrà tra {licenseExpiryDays} giorni. Vai
                    nelle impostazioni per rinnovarla.
                  </p>
                </div>
                <button
                  className="ml-auto pl-3"
                  onClick={() => setShowLicenseAlert(false)}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        )}

        {showBackupStatus && lastBackupStatus === "failed" && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">❌</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  L'ultimo backup del {lastBackupTime} è fallito. Controlla lo
                  spazio su disco e riprova.
                </p>
              </div>
              <button
                className="ml-auto pl-3"
                onClick={() => setShowBackupStatus(false)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Contenuto della pagina */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
