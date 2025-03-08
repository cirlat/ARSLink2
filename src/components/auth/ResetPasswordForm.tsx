import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertCircle, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthService } from "@/services/auth.service";

const formSchema = z
  .object({
    password: z.string().min(8, {
      message: "La password deve contenere almeno 8 caratteri",
    }),
    confirmPassword: z.string().min(8, {
      message: "La password deve contenere almeno 8 caratteri",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non corrispondono",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

const ResetPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const authService = AuthService.getInstance();

  // Estrai email e token dai parametri dell'URL
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email") || "";
  const token = queryParams.get("token") || "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (data: FormValues) => {
    if (!email || !token) {
      setError("Parametri mancanti. Richiedi un nuovo link di reset.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await authService.resetPassword(
        email,
        data.password,
        token,
      );

      if (result.success) {
        setSuccess(true);
        form.reset();
        // Reindirizza alla pagina di login dopo 3 secondi
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        setError(
          result.error ||
            "Si è verificato un errore durante il reset della password.",
        );
      }
    } catch (err) {
      setError("Si è verificato un errore durante il reset della password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Reimposta Password
          </CardTitle>
          <CardDescription className="text-center">
            Inserisci la tua nuova password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
              <AlertDescription>
                Password reimpostata con successo! Verrai reindirizzato alla
                pagina di login.
              </AlertDescription>
            </Alert>
          )}

          {(!email || !token) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Link di reset non valido. Richiedi un nuovo link dalla pagina di
                recupero password.
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nuova Password</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="Inserisci la nuova password"
                          className="pl-10"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conferma Password</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="Conferma la nuova password"
                          className="pl-10"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            className="w-full"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isLoading || !email || !token}
          >
            {isLoading ? "Reimpostazione in corso..." : "Reimposta Password"}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna al login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPasswordForm;
