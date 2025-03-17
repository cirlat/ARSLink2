import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Calendar, CheckCircle, ExternalLink } from "lucide-react";
import { LicenseModel } from "@/models/license";

interface LicenseAlertProps {
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  onRenew?: () => void;
  onDismiss?: () => void;
}

const LicenseAlert = ({
  contactEmail = "support@patientapp.com",
  contactPhone = "+39 123 456 7890",
  websiteUrl = "https://www.patientapp.com/renew",
  onRenew = () => console.log("Renew license"),
  onDismiss = () => console.log("Dismiss alert"),
}: LicenseAlertProps) => {
  const [open, setOpen] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLicenseData = async () => {
      try {
        const licenseModel = LicenseModel.getInstance();

        // Ottieni la licenza corrente
        const license = await licenseModel.getCurrentLicense();
        if (!license) {
          setIsExpired(true);
          setIsLoading(false);
          return;
        }

        // Calcola i giorni rimanenti
        const days = await licenseModel.getDaysUntilExpiry();
        setDaysRemaining(days);
        setExpiryDate(new Date(license.expiry_date));
        setIsExpired(days <= 0);
        setIsLoading(false);
      } catch (error) {
        console.error("Errore nel caricamento dei dati della licenza:", error);
        setIsLoading(false);
      }
    };

    loadLicenseData();
  }, []);

  // Format the expiry date
  const formattedDate = expiryDate
    ? expiryDate.toLocaleDateString("it-IT", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // Determine the severity level
  const getSeverityLevel = () => {
    if (isExpired) return "expired";
    if (daysRemaining <= 7) return "critical";
    if (daysRemaining <= 15) return "warning";
    return "info";
  };

  const severity = getSeverityLevel();

  // Get the appropriate background color based on severity
  const getCardBackground = () => {
    switch (severity) {
      case "expired":
        return "bg-red-50 border-red-200";
      case "critical":
        return "bg-amber-50 border-amber-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  // Get the appropriate progress color based on severity
  const getProgressColor = () => {
    switch (severity) {
      case "expired":
        return "bg-red-500";
      case "critical":
        return "bg-amber-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  // Calculate progress percentage (inverse of days remaining)
  const getProgressPercentage = () => {
    if (isExpired) return 100;
    // Assuming a 30-day warning period
    const percentage = 100 - (daysRemaining / 30) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  // Non mostrare il dialogo se la licenza non è in scadenza (più di 15 giorni) o se sta ancora caricando
  if (((daysRemaining > 15 || !open) && !isExpired) || isLoading) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            {isExpired ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                Licenza Scaduta
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                Avviso di Scadenza Licenza
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isExpired
              ? "La tua licenza è scaduta. Alcune funzionalità potrebbero essere limitate."
              : `La tua licenza scadrà tra ${daysRemaining} giorni. Rinnova ora per continuare a utilizzare tutte le funzionalità.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Card className={`${getCardBackground()} border mt-4`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Dettagli Licenza
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Data di scadenza:</span>
              </div>
              <span className="text-sm font-medium">{formattedDate}</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Stato licenza</span>
                <span>
                  {isExpired ? "Scaduta" : `${daysRemaining} giorni rimanenti`}
                </span>
              </div>
              <Progress
                value={getProgressPercentage()}
                className="h-2"
                indicatorClassName={getProgressColor()}
              />
            </div>
          </CardContent>
        </Card>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel onClick={onDismiss}>
            {isExpired ? "Chiudi" : "Ricordamelo dopo"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onRenew}
            className={isExpired ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Rinnova Ora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LicenseAlert;
