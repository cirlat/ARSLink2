import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useRoutes,
} from "react-router-dom";
import LoginForm from "./components/auth/LoginForm";
import Dashboard from "./components/dashboard/Dashboard";
import PatientList from "./components/dashboard/PatientList";
import CalendarView from "./components/dashboard/CalendarView";
import NotificationCenter from "./components/dashboard/NotificationCenter";
import PatientForm from "./components/patients/PatientForm";
import PatientDetails from "./components/patients/PatientDetails";
import AppointmentForm from "./components/appointments/AppointmentForm";
import Settings from "./components/settings/Settings";
import SetupWizard from "./setup/SetupWizard";
import LicenseExpiredAlert from "./components/system/LicenseExpiredAlert";
// Import tempo-routes only when in Tempo environment
const routes = import.meta.env.VITE_TEMPO ? require("tempo-routes") : [];

function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(true);
  const [licenseExpired, setLicenseExpired] = useState(false);
  const [showLicenseAlert, setShowLicenseAlert] = useState(false);

  useEffect(() => {
    // Verifica se l'utente è autenticato
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(authStatus);

    // Verifica se il setup è stato completato
    const setupStatus = localStorage.getItem("setupCompleted") === "true";
    setSetupCompleted(setupStatus);

    // Verifica lo stato della licenza
    const licenseExpiry = localStorage.getItem("licenseExpiry");
    if (licenseExpiry) {
      const expiryDate = new Date(licenseExpiry);
      const now = new Date();
      const expired = expiryDate < now;
      setLicenseExpired(expired);
      setShowLicenseAlert(expired);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
    navigate("/dashboard");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const handleDismissLicenseAlert = () => {
    setShowLicenseAlert(false);
  };

  // Se il setup non è stato completato, mostra il wizard di setup
  if (!setupCompleted) {
    return <SetupWizard />;
  }

  // Tempo routes
  if (import.meta.env.VITE_TEMPO) {
    useRoutes(routes);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {showLicenseAlert && (
        <div className="fixed top-4 right-4 z-50 w-96">
          <LicenseExpiredAlert onDismiss={handleDismissLicenseAlert} />
        </div>
      )}

      <Routes>
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <LoginForm onLogin={handleLogin} />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Dashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/calendar"
          element={
            isAuthenticated ? (
              <Dashboard
                activePage="calendar"
                onLogout={handleLogout}
                content={<CalendarView />}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/patients"
          element={
            isAuthenticated ? (
              <Dashboard
                activePage="patients"
                onLogout={handleLogout}
                content={<PatientList />}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/patients/new"
          element={
            isAuthenticated ? (
              <Dashboard
                activePage="patients"
                onLogout={handleLogout}
                content={<PatientForm />}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/patients/:id"
          element={
            isAuthenticated ? (
              <Dashboard
                activePage="patients"
                onLogout={handleLogout}
                content={<PatientDetails />}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/patients/:id/edit"
          element={
            isAuthenticated ? (
              <Dashboard
                activePage="patients"
                onLogout={handleLogout}
                content={<PatientForm />}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/appointments/new"
          element={
            isAuthenticated ? (
              <Dashboard
                activePage="calendar"
                onLogout={handleLogout}
                content={<AppointmentForm />}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/appointments/:id/edit"
          element={
            isAuthenticated ? (
              <Dashboard
                activePage="calendar"
                onLogout={handleLogout}
                content={<AppointmentForm />}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/notifications"
          element={
            isAuthenticated ? (
              <Dashboard
                activePage="notifications"
                onLogout={handleLogout}
                content={<NotificationCenter />}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <Dashboard
                activePage="settings"
                onLogout={handleLogout}
                content={<Settings />}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Add this before the catchall route */}
        {import.meta.env.VITE_TEMPO && <Route path="/tempobook/*" />}

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

export default App;
