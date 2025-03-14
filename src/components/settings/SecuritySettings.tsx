import React, { useState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";

const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validazione
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Tutti i campi sono obbligatori");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Le nuove password non corrispondono");
      return;
    }

    if (newPassword.length < 8) {
      setError("La nuova password deve contenere almeno 8 caratteri");
      return;
    }

    setIsLoading(true);

    try {
      // Ottieni l'utente corrente
      const { AuthService } = await import("@/services/auth.service");
      const authService = AuthService.getInstance();
      const currentUser = authService.getCurrentUser();

      if (!currentUser) {
        throw new Error("Utente non autenticato");
      }

      // Verifica la password corrente
      const { UserModel } = await import("@/models/user");
      const userModel = new UserModel();
      const user = await userModel.findByUsername(currentUser.username);

      if (!user) {
        throw new Error("Utente non trovato");
      }

      // Verifica la password corrente
      const { compare } = await import("@/lib/mockBcrypt");
      const isMatch = await compare(currentPassword, user.password || "");

      if (!isMatch) {
        setError("La password corrente non è corretta");
        setIsLoading(false);
        return;
      }

      // Aggiorna la password
      const updated = await userModel.update(user.id!, {
        password: newPassword,
      });

      if (updated) {
        setSuccess("Password aggiornata con successo");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw new Error("Impossibile aggiornare la password");
      }
    } catch (error) {
      console.error("Errore durante il cambio password:", error);
      setError(
        `Si è verificato un errore: ${error.message || "Errore sconosciuto"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sicurezza Account</CardTitle>
        <CardDescription>
          Gestisci le impostazioni di sicurezza del tuo account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <h3 className="text-lg font-medium">Cambio Password</h3>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle>Operazione completata</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="current-password">Password Attuale</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Inserisci la password attuale"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nuova Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Inserisci la nuova password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Conferma Nuova Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Conferma la nuova password"
            />
          </div>

          <CardFooter className="px-0 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Aggiornamento in corso..." : "Aggiorna Password"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
