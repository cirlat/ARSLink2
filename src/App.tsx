import { Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
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

function App() {
  const location = useLocation();
  const isLoginPage =
    location.pathname === "/" && !localStorage.getItem("isAuthenticated");

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        {!isLoginPage && <TopNavigation />}
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
        </Routes>
      </>
    </Suspense>
  );
}

export default App;
