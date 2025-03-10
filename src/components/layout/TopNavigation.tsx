import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Settings, Home, Users } from "lucide-react";
import { hasWhatsAppLicense } from "@/utils/licenseUtils";

interface TopNavigationProps {}

const TopNavigation: React.FC<TopNavigationProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const isActive = (route: string) => {
    if (route === "/" && path === "/") return true;
    if (route !== "/" && path.startsWith(route)) return true;
    return false;
  };

  return (
    <div className="sticky top-0 z-10 w-full bg-white border-b border-slate-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            size="sm"
            className="flex items-center"
            onClick={() => {
              // Verifica se l'utente è autenticato
              if (localStorage.getItem("isAuthenticated")) {
                navigate("/dashboard");
              }
            }}
          >
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Link to="/calendar">
            <Button
              variant={isActive("/calendar") ? "default" : "ghost"}
              size="sm"
              className="flex items-center"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendario
            </Button>
          </Link>
          <Link to="/patients">
            <Button
              variant={isActive("/patients") ? "default" : "ghost"}
              size="sm"
              className="flex items-center"
            >
              <Users className="h-4 w-4 mr-2" />
              Pazienti
            </Button>
          </Link>
          {/* Verifica se la licenza include WhatsApp */}
          {(() => {
            const licenseType = localStorage.getItem("licenseType");
            return (
              licenseType === "whatsapp" ||
              licenseType === "full" ||
              (licenseType && licenseType.startsWith("WHATSAPP-")) ||
              (licenseType && licenseType.startsWith("FULL-"))
            );
          })() && (
            <Link to="/notifications">
              <Button
                variant={isActive("/notifications") ? "default" : "ghost"}
                size="sm"
                className="flex items-center"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifiche
              </Button>
            </Link>
          )}
          <Link to="/settings">
            <Button
              variant={isActive("/settings") ? "default" : "ghost"}
              size="sm"
              className="flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Impostazioni
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;
