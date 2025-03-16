import React, { useState, useEffect } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Calendar,
  ExternalLink,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import { GoogleCalendarService } from "@/services/googleCalendar.service";
import { LicenseModel } from "@/models/license";

const GoogleCalendarSettings: React.FC = () => {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState(
    "http://localhost:5173/settings",
  );
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);

        // Verifica se la licenza permette Google Calendar
        const licenseModel = LicenseModel.getInstance();
        const isGoogleEnabled = await licenseModel.isGoogleCalendarEnabled();
        setIsEnabled(isGoogleEnabled);

        if (!isGoogleEnabled) {
          setError(
            "La tua licenza non include l'integrazione con Google Calendar",
          );
          return;
        }

        // Carica la configurazione esistente
        const googleService = GoogleCalendarService.getInstance();
        const isServiceAuthenticated =
          await googleService.isServiceAuthenticated();
        setIsAuthenticated(isServiceAuthenticated);

        // Carica i valori salvati
        const savedClientId = localStorage.getItem("googleClientId");
        const savedClientSecret = localStorage.getItem("googleClientSecret");
        const savedRedirectUri = localStorage.getItem("googleRedirectUri");

        if (savedClientId) setClientId(savedClientId);
        if (savedClientSecret) setClientSecret(savedClientSecret);
        if (savedRedirectUri) setRedirectUri(savedRedirectUri);

        // Verifica se siamo in un callback di autorizzazione
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");

        if (code && savedClientId && savedClientSecret && savedRedirectUri) {
          await handleAuthCallback(code, state || undefined);
        }
      } catch (err) {
        console.error("Errore nel caricamento delle impostazioni:", err);
        setError("Errore nel caricamento delle impostazioni");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleAuthCallback = async (code: string, state?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const googleService = GoogleCalendarService.getInstance();
      const result = await googleService.handleAuthCallback(code, state);

      if (result.success) {
        setIsAuthenticated(true);
        setSuccess("Autorizzazione completata con successo!");

        // Rimuovi i parametri dall'URL per evitare riautorizzazioni accidentali
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      } else {
        setError(result.error || "Errore durante l'autorizzazione");
      }
    } catch (err) {
      console.error("Errore durante il callback di autorizzazione:", err);
      setError("Errore durante l'autorizzazione");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      if (!clientId || !clientSecret || !redirectUri) {
        setError("Tutti i campi sono obbligatori");
        return;
      }

      const googleService = GoogleCalendarService.getInstance();
      await googleService.configure(clientId, clientSecret, redirectUri);

      setSuccess("Impostazioni salvate con successo");
    } catch (err) {
      console.error("Errore nel salvataggio delle impostazioni:", err);
      setError("Errore nel salvataggio delle impostazioni");
    } finally {
      setIsLoading(false);
    }
  };

  const startAuthorization = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!clientId || !clientSecret || !redirectUri) {
        setError("Configura prima le credenziali API");
        return;
      }

      const googleService = GoogleCalendarService.getInstance();
      const authUrl = await googleService.getAuthUrl();

      // Apri l'URL di autorizzazione in una nuova finestra
      window.open(authUrl, "_self");
    } catch (err) {
      console.error("Errore nell'avvio dell'autorizzazione:", err);
      setError("Errore nell'avvio dell'autorizzazione");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectService = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const googleService = GoogleCalendarService.getInstance();
      googleService.disconnect();

      setIsAuthenticated(false);
      setSuccess("Disconnessione completata con successo");
    } catch (err) {
      console.error("Errore durante la disconnessione:", err);
      setError("Errore durante la disconnessione");
    } finally {
      setIsLoading(false);
    }
  };

  const syncAllAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const googleService = GoogleCalendarService.getInstance();
      const result = await googleService.syncAllAppointments();

      setSuccess(
        `Sincronizzazione completata: ${result.success} appuntamenti sincronizzati, ${result.failed} falliti`,
      );
    } catch (err) {
      console.error("Errore durante la sincronizzazione:", err);
      setError("Errore durante la sincronizzazione degli appuntamenti");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEnabled) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Integrazione Google Calendar
          </CardTitle>
          <CardDescription>
            Sincronizza gli appuntamenti con Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Funzionalità non disponibile</AlertTitle>
            <AlertDescription>
              La tua licenza non include l'integrazione con Google Calendar.
              Aggiorna la tua licenza per sbloccare questa funzionalità.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Integrazione Google Calendar
        </CardTitle>
        <CardDescription>
          Sincronizza gli appuntamenti con Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert
            variant="default"
            className="mb-4 bg-green-50 border-green-200 text-green-800"
          >
            <Check className="h-4 w-4" />
            <AlertTitle>Successo</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="client-id">Client ID</Label>
          <Input
            id="client-id"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Il tuo Client ID di Google Cloud"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-secret">Client Secret</Label>
          <Input
            id="client-secret"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="Il tuo Client Secret di Google Cloud"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="redirect-uri">URI di Reindirizzamento</Label>
          <Input
            id="redirect-uri"
            value={redirectUri}
            onChange={(e) => setRedirectUri(e.target.value)}
            placeholder="http://localhost:5173/settings"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Questo URI deve essere configurato anche nella console Google Cloud
          </p>
        </div>

        <div className="pt-4 space-y-2">
          <p className="text-sm font-medium">
            Stato: {isAuthenticated ? "Connesso" : "Non connesso"}
          </p>
          <p className="text-sm text-muted-foreground">
            Per ottenere le credenziali Google Calendar:
          </p>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li>Vai alla Console Google Cloud</li>
            <li>Crea un nuovo progetto</li>
            <li>Abilita l'API Google Calendar</li>
            <li>Configura la schermata di consenso OAuth</li>
            <li>Crea credenziali OAuth 2.0</li>
            <li>Aggiungi l'URI di reindirizzamento: {redirectUri}</li>
          </ol>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() =>
            window.open(
              "https://console.cloud.google.com/apis/credentials",
              "_blank",
            )
          }
          disabled={isLoading}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Console Google Cloud
        </Button>

        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={saveSettings}
            disabled={isLoading || !clientId || !clientSecret || !redirectUri}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Salva Impostazioni
          </Button>

          {isAuthenticated && (
            <Button
              variant="outline"
              onClick={syncAllAppointments}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Sincronizza Appuntamenti
            </Button>
          )}

          {isAuthenticated ? (
            <Button
              variant="destructive"
              onClick={disconnectService}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Disconnetti
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={startAuthorization}
              disabled={isLoading || !clientId || !clientSecret || !redirectUri}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Autorizza
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default GoogleCalendarSettings;
