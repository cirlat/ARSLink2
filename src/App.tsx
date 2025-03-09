import { Suspense, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Home from "./components/home";
import Dashboard from "./components/dashboard/Dashboard";
import CalendarView from "./components/dashboard/CalendarView";
import PatientList from "./components/dashboard/PatientList";
import NotificationCenter from "./components/dashboard/NotificationCenter";
import PatientDetails from "./components/patients/PatientDetails";
import PatientForm from "./components/patients/PatientForm";
import TopNavigation from "./components/layout/TopNavigation";
import Settings from "./components/settings/Settings";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import SetupWizard from "./setup/SetupWizard";
import LicenseGenerator from "./components/admin/LicenseGenerator";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage =
    location.pathname === "/" && !localStorage.getItem("isAuthenticated");

  // Verifica se è il primo avvio dell'applicazione
  useEffect(() => {
    const isFirstRun = !localStorage.getItem("setupCompleted");
    if (isFirstRun && location.pathname !== "/setup") {
      navigate("/setup");
    }
  }, [location.pathname, navigate]);

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        {!isLoginPage && location.pathname !== "/setup" && <TopNavigation />}
        <Routes>
          <Route path="/" element={<Home />} />
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
          <Route
            path="/admin/license-generator"
            element={<LicenseGenerator />}
          />
        </Routes>
      </>
    </Suspense>
  );
}

export default App;
