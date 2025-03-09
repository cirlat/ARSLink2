import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LicenseExpiredAlertProps {
  onDismiss?: () => void;
}

const LicenseExpiredAlert: React.FC<LicenseExpiredAlertProps> = ({
  onDismiss,
}) => {
  const navigate = useNavigate();

  const handleUpdateLicense = () => {
    navigate("/settings");
    if (onDismiss) onDismiss();
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Licenza Scaduta</AlertTitle>
      <AlertDescription className="flex flex-col space-y-2">
        <p>
          La tua licenza è scaduta. Alcune funzionalità potrebbero essere
          limitate.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-fit mt-2"
          onClick={handleUpdateLicense}
        >
          Aggiorna Licenza
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default LicenseExpiredAlert;
