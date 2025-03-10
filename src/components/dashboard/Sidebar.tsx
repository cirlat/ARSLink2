import React from "react";
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

interface SidebarProps {
  userName?: string;
  userRole?: "Medico" | "Assistente";
  userAvatar?: string;
  activePage?: string;
  onLogout?: () => void;
}

const Sidebar = ({
  userName = localStorage.getItem("userName") ||
    localStorage.getItem("clinicName") ||
    "Dr. Mario Rossi",
  userRole = localStorage.getItem("userRole") || "Medico",
  userAvatar = "",
  activePage = "dashboard",
  onLogout = () => console.log("Logout clicked"),
}: SidebarProps) => {
  // Use a class-based approach instead of hooks
  const toggleCollapsed = (event) => {
    const sidebar = event.currentTarget.closest(
      'div[class*="flex flex-col h-full"]',
    );
    if (sidebar) {
      sidebar.classList.toggle("w-20");
      sidebar.classList.toggle("w-72");

      // Toggle rotation for the chevron
      const chevron = event.currentTarget.querySelector("svg");
      if (chevron) {
        chevron.classList.toggle("rotate-180");
      }

      // Update collapsed state for other elements
      const isCollapsed = sidebar.classList.contains("w-20");

      // Update user info section
      const userInfo = sidebar.querySelector("div.flex.flex-col");
      if (userInfo) {
        userInfo.style.display = isCollapsed ? "none" : "flex";
      }

      // Update navigation items
      const navItems = sidebar.querySelectorAll("nav a span");
      navItems.forEach((span) => {
        span.style.display = isCollapsed ? "none" : "inline";
      });

      // Update logout button text
      const logoutText = sidebar.querySelector("div.p-4.mt-auto button span");
      if (logoutText) {
        logoutText.style.display = isCollapsed ? "none" : "inline";
      }
    }
  };

  // Verifica se l'utente ha una licenza che include WhatsApp
  const hasWhatsAppLicense =
    localStorage.getItem("licenseType") === "whatsapp" ||
    localStorage.getItem("licenseType") === "full";

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
    { id: "calendar", label: "Calendario", icon: Calendar, path: "/calendar" },
    { id: "patients", label: "Pazienti", icon: Users, path: "/patients" },
    // Mostra le notifiche solo se l'utente ha una licenza che include WhatsApp
    ...(hasWhatsAppLicense
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

  // Initial state is not collapsed
  const collapsed = false;

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
        onClick={toggleCollapsed}
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
            <span className="font-medium text-sm truncate">{userName}</span>
            <span className="text-xs text-slate-500 truncate">{userRole}</span>
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
