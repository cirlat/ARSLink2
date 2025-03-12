import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User, AlertCircle } from "lucide-react";

interface LoginFormProps {
  onSubmit?: (data: {
    username: string;
    password: string;
    role: string;
  }) => void;
  isLoading?: boolean;
  error?: string;
}

class LoginFormClass extends React.Component<LoginFormProps> {
  state = {
    showPassword: false,
    username: "admin",
    password: "admin123",
    role: "Medico",
    localError: "",
  };

  handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { username, password, role } = this.state;

    if (!username || !password) {
      this.setState({ localError: "Username e password sono obbligatori" });
      return;
    }

    try {
      // Verifica le credenziali nel database
      const { AuthService } = await import("@/services/auth.service");
      const authService = AuthService.getInstance();

      const result = await authService.login(username, password);

      if (result.user) {
        // Login riuscito, passa i dati al componente padre
        if (this.props.onSubmit) {
          this.props.onSubmit({ username, password, role });
        }
      } else {
        // Login fallito, mostra l'errore
        this.setState({ localError: result.error || "Credenziali non valide" });
      }
    } catch (error) {
      console.error("Errore durante l'autenticazione:", error);
      this.setState({
        localError: "Si è verificato un errore durante l'autenticazione",
      });
    }
  };

  toggleShowPassword = () => {
    this.setState((prevState) => ({ showPassword: !prevState.showPassword }));
  };

  handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    this.setState({ [name]: value, localError: "" });
  };

  handleRoleChange = (value: string) => {
    this.setState({ role: value, localError: "" });
  };

  render() {
    const { isLoading = false, error = "" } = this.props;
    const { showPassword, username, password, role, localError } = this.state;

    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Sistema Gestione Appuntamenti
            </CardTitle>
            <CardDescription className="text-center">
              Inserisci le tue credenziali per accedere al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(error || localError) && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error || localError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={this.handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Nome utente
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    name="username"
                    placeholder="Inserisci il tuo nome utente"
                    className="pl-10"
                    value={username}
                    onChange={this.handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Inserisci la tua password"
                    className="pl-10"
                    autoComplete="current-password"
                    value={password}
                    onChange={this.handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Ruolo
                </label>
                <Select value={role} onValueChange={this.handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il tuo ruolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Medico">Medico</SelectItem>
                    <SelectItem value="Assistente">Assistente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-password"
                  className="rounded border-gray-300"
                  onChange={this.toggleShowPassword}
                  checked={showPassword}
                />
                <label
                  htmlFor="show-password"
                  className="text-sm text-muted-foreground"
                >
                  Mostra password
                </label>
              </div>

              <Button
                className="w-full mt-4"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Password dimenticata?
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }
}

const LoginForm = (props: LoginFormProps) => {
  return <LoginFormClass {...props} />;
};

export default LoginForm;
