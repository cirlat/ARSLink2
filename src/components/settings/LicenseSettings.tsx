import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Key, Check, AlertCircle } from "lucide-react";
import { verifyLicenseKey } from "@/utils/licenseUtils";

const LicenseSettings = () => {
  const [licenseKey, setLicenseKey] = useState("");
  const [currentLicense, setCurrentLicense] = useState<{
    type: string;
    expiryDate: string;
    isValid: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    // Carica la licenza corrente
    const storedLicenseKey = localStorage.getItem("licenseKey");
    const storedLicenseType = localStorage.getItem("licenseType");
    const storedLicenseExpiry = localStorage.getItem("licenseExpiry");

    if (storedLicenseKey && storedLicenseType && storedLicenseExpiry) {
      const expiryDate = new Date(storedLicenseExpiry);
      const isValid = expiryDate > new Date();

      setCurrentLicense({
        type: storedLicenseType,
        expiryDate: expiryDate.toLocaleDateString(),
        isValid,
      });
    }
  }, []);

  const handleVerifyLicense = () => {
    if (!licenseKey) {
      setMessage({
        text: "Inserisci una chiave di licenza valida",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const verificationResult = verifyLicenseKey(licenseKey);

      if (verificationResult.valid) {
        const licenseType = verificationResult.licenseType || "basic";
        const expiryDate = verificationResult.expiryDate || new Date();

        // Salva la licenza
        localStorage.setItem("licenseKey", licenseKey);
        localStorage.setItem("licenseType", licenseType);
        localStorage.setItem("licenseExpiry", expiryDate.toISOString());

        // Aggiorna lo stato
        setCurrentLicense({
          type: licenseType,
          expiryDate: expiryDate.toLocaleDateString(),
          isValid: true,
        });

        setMessage({
          text: "Licenza installata con successo!",
          type: "success",
        });
        setLicenseKey(""); // Pulisci il campo input
      } else {
        setMessage({
          text: `Licenza non valida: ${verificationResult.error || "Formato non riconosciuto"}`,
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: "Si è verificato un errore durante la verifica della licenza",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLicenseTypeName = (type: string) => {
    switch (type) {
      case "basic":
        return "Base";
      case "google":
        return "Base + Google Calendar";
      case "whatsapp":
        return "Base + WhatsApp";
      case "full":
        return "Completa";
      default:
        return type;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="mr-2 h-5 w-5" />
          Gestione Licenza
        </CardTitle>
        <CardDescription>
          Visualizza e aggiorna la licenza del software
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentLicense && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Licenza Attuale</h3>
            <div
              className={`p-4 rounded-md ${currentLicense.isValid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
            >
              <div className="flex items-start">
                <div
                  className={`p-2 rounded-full ${currentLicense.isValid ? "bg-green-100" : "bg-red-100"} mr-3`}
                >
                  {currentLicense.isValid ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">
                    {currentLicense.isValid
                      ? "Licenza Valida"
                      : "Licenza Scaduta"}
                  </h4>
                  <p className="text-sm mt-1">
                    <strong>Tipo:</strong>{" "}
                    {getLicenseTypeName(currentLicense.type)}
                  </p>
                  <p className="text-sm">
                    <strong>Scadenza:</strong> {currentLicense.expiryDate}
                  </p>
                  {!currentLicense.isValid && (
                    <p className="text-sm text-red-600 mt-2">
                      La tua licenza è scaduta. Inserisci una nuova chiave di
                      licenza per continuare a utilizzare il software.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Aggiorna Licenza</h3>
          <div className="space-y-2">
            <Label htmlFor="license-key">Nuova Chiave di Licenza</Label>
            <div className="flex space-x-2">
              <Input
                id="license-key"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Inserisci la nuova chiave di licenza"
                className="flex-1"
              />
              <Button onClick={handleVerifyLicense} disabled={isLoading}>
                {isLoading ? "Verifica..." : "Verifica e Installa"}
              </Button>
            </div>
            {message && (
              <p
                className={`text-sm mt-2 ${message.type === "success" ? "text-green-600" : "text-red-600"}`}
              >
                {message.text}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Per acquistare una nuova licenza o rinnovare quella esistente,
              contatta il supporto all'indirizzo support@arslink.it
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LicenseSettings;
