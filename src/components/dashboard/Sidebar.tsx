import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Users,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Home,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { hasWhatsAppLicense } from "@/utils/licenseUtils";

interface SidebarProps {
  userName?: string;
  userRole?: "Medico" | "Assistente";
  userAvatar?: string;
  activePage?: string;
  onLogout?: () => void;
}

const Sidebar = ({
  userName,
  userRole = "Medico",
  userAvatar = "",
  activePage = "dashboard",
  onLogout = () => console.log("Logout clicked"),
}: SidebarProps) => {
  // Carica il nome dello studio dalle impostazioni generali
  const [clinicName, setClinicName] = useState<string>("Studio Medico");

  useEffect(() => {
    // Carica le impostazioni generali
    const savedGeneralSettings = localStorage.getItem("generalSettings");
    if (savedGeneralSettings) {
      const settings = JSON.parse(savedGeneralSettings);
      if (settings.clinicName) {
        setClinicName(settings.clinicName);
      }
    }

    // Se non è stato fornito un nome utente, carica quello dal localStorage
    if (!userName) {
      const currentUser = localStorage.getItem("currentUser");
      if (currentUser) {
        const user = JSON.parse(currentUser);
        setUserName(user.full_name || "Dr. Mario Rossi");
      } else {
        setUserName("Dr. Mario Rossi");
      }
    }
  }, [userName]);

  // Stato locale per il nome utente
  const [localUserName, setUserName] = useState<string>(
    userName || "Dr. Mario Rossi",
  );
  const [collapsed, setCollapsed] = useState(false);

  // Utilizziamo la funzione di utility per verificare la licenza WhatsApp
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Verifica se la licenza include WhatsApp
    const licenseType = localStorage.getItem("licenseType");
    setShowNotifications(
      licenseType === "whatsapp" ||
        licenseType === "full" ||
        (licenseType && licenseType.startsWith("WHATSAPP-")) ||
        (licenseType && licenseType.startsWith("FULL-")),
    );
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
    { id: "calendar", label: "Calendario", icon: Calendar, path: "/calendar" },
    { id: "patients", label: "Pazienti", icon: Users, path: "/patients" },
    // Mostra le notifiche solo se l'utente ha una licenza che include WhatsApp
    ...(showNotifications
      ? [
          {
            id: "notifications",
            label: "Notifiche",
            icon: Bell,
            path: "/notifications",
          },
        ]
      : []),
    {
      id: "settings",
      label: "Impostazioni",
      icon: Settings,
      path: "/settings",
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-slate-50 border-r border-slate-200 transition-all duration-300",
        collapsed ? "w-20" : "w-72",
      )}
    >
      {/* Pulsante di toggle */}
      <button
        className="absolute -right-3 top-20 bg-white rounded-full p-1 border border-slate-200 shadow-sm z-10"
        onClick={() => setCollapsed(!collapsed)}
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 text-slate-500 transition-transform",
            collapsed ? "" : "rotate-180",
          )}
        />
      </button>

      {/* Sezione profilo utente */}
      <div className="p-4 flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {userName
              .split(" ")
              .map((name) => name[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-medium text-sm truncate">
              {localUserName}
            </span>
            <span className="text-xs text-slate-500 truncate">{userRole}</span>
            <span className="text-xs text-slate-400 truncate">
              {clinicName}
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* Navigazione */}
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <TooltipProvider delayDuration={collapsed ? 100 : 1000}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        activePage === item.id
                          ? "bg-primary text-primary-foreground"
                          : "text-slate-700 hover:bg-slate-100",
                        collapsed ? "justify-center" : "justify-start",
                      )}
                    >
                      <item.icon
                        className={cn("h-5 w-5", collapsed ? "" : "mr-3")}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </li>
          ))}
        </ul>
      </nav>

      {/* Pulsante logout */}
      <div className="p-4 mt-auto">
        <TooltipProvider delayDuration={collapsed ? 100 : 1000}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full flex items-center text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                  collapsed ? "justify-center px-0" : "justify-start",
                )}
                onClick={onLogout}
              >
                <LogOut className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
                {!collapsed && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Logout</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default Sidebar;
