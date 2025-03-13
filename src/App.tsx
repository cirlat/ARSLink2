import { Suspense, useEffect, useState } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  useRoutes,
} from "react-router-dom";
import routes from "./tempo-routes";
import Home from "./components/home";
import Dashboard from "./components/dashboard/Dashboard";
import CalendarView from "./components/dashboard/CalendarView";
import PatientList from "./components/dashboard/PatientList";
import NotificationCenter from "./components/dashboard/NotificationCenter";
import PatientDetails from "./components/patients/PatientDetails";
import PatientForm from "./components/patients/PatientForm";
import Settings from "./components/settings/Settings";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import SetupWizard from "./setup/SetupWizard";
import Sidebar from "./components/dashboard/Sidebar";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage =
    location.pathname === "/" && !localStorage.getItem("isAuthenticated");
  const isSetupPage = location.pathname === "/setup";

  // Stato per il nome utente e il ruolo
  const [userName, setUserName] = useState<string>(
    localStorage.getItem("userName") || "Dr. Mario Rossi",
  );
  const [userRole, setUserRole] = useState<string>(
    localStorage.getItem("userRole") || "Medico",
  );

  // Verifica se è il primo avvio dell'applicazione
  useEffect(() => {
    const isFirstRun = !localStorage.getItem("setupCompleted");
    // Non reindirizzare se siamo in una pagina admin o se non è il primo avvio
    if (
      isFirstRun &&
      !location.pathname.startsWith("/admin") &&
      location.pathname !== "/setup"
    ) {
      navigate("/setup");
    }

    // Aggiorna il nome utente e il ruolo quando cambiano in localStorage
    const storedUserName = localStorage.getItem("userName");
    const storedUserRole = localStorage.getItem("userRole");
    if (storedUserName) setUserName(storedUserName);
    if (storedUserRole) setUserRole(storedUserRole);
  }, [location.pathname, navigate]);

  // Gestione del logout
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/");
  };

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div className="flex h-screen w-full bg-background">
        {/* Mostra la sidebar solo se l'utente è autenticato e non è nella pagina di setup o login */}
        {localStorage.getItem("isAuthenticated") === "true" && !isSetupPage && (
          <Sidebar
            userName={userName}
            userRole={userRole}
            onLogout={handleLogout}
            activePage={location.pathname.split("/")[1] || "dashboard"}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tempo routes */}
          {import.meta.env.VITE_TEMPO && useRoutes(routes)}

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/new" element={<PatientForm />} />
            <Route path="/patients/:id" element={<PatientDetails />} />
            <Route path="/patients/:id/edit" element={<PatientForm />} />
            <Route path="/notifications" element={<NotificationCenter />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            <Route path="/reset-password" element={<ResetPasswordForm />} />
            <Route path="/setup" element={<SetupWizard />} />

            {/* Add this before the catchall route */}
            {import.meta.env.VITE_TEMPO && <Route path="/tempobook/*" />}
          </Routes>
        </div>
      </div>
    </Suspense>
  );
}

export default App;
