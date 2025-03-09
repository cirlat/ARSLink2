import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateLicenseKey } from "@/utils/licenseUtils";
import { Clipboard, Key, Check } from "lucide-react";

const LicenseGenerator = () => {
  const [licenseType, setLicenseType] = useState<
    "basic" | "google" | "whatsapp" | "full"
  >("basic");
  const [expiryMonths, setExpiryMonths] = useState<number>(12);
  const [generatedLicense, setGeneratedLicense] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerateLicense = () => {
    const license = generateLicenseKey(licenseType, expiryMonths);
    setGeneratedLicense(license);
    setCopied(false);
  };

  const handleCopyLicense = () => {
    navigator.clipboard.writeText(generatedLicense);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="mr-2 h-5 w-5" />
          Generatore Licenze
        </CardTitle>
        <CardDescription>
          Genera chiavi di licenza per i clienti
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="license-type">Tipo di Licenza</Label>
          <Select
            value={licenseType}
            onValueChange={(value) => setLicenseType(value as any)}
          >
            <SelectTrigger id="license-type">
              <SelectValue placeholder="Seleziona tipo di licenza" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Base</SelectItem>
              <SelectItem value="google">Base + Google Calendar</SelectItem>
              <SelectItem value="whatsapp">Base + WhatsApp</SelectItem>
              <SelectItem value="full">Completa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiry-months">Durata (mesi)</Label>
          <Select
            value={expiryMonths.toString()}
            onValueChange={(value) => setExpiryMonths(parseInt(value))}
          >
            <SelectTrigger id="expiry-months">
              <SelectValue placeholder="Seleziona durata" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 mese</SelectItem>
              <SelectItem value="3">3 mesi</SelectItem>
              <SelectItem value="6">6 mesi</SelectItem>
              <SelectItem value="12">1 anno</SelectItem>
              <SelectItem value="24">2 anni</SelectItem>
              <SelectItem value="36">3 anni</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {generatedLicense && (
          <div className="space-y-2 pt-4">
            <Label htmlFor="generated-license">Licenza Generata</Label>
            <div className="flex">
              <Input
                id="generated-license"
                value={generatedLicense}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2"
                onClick={handleCopyLicense}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateLicense} className="w-full">
          Genera Licenza
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LicenseGenerator;
