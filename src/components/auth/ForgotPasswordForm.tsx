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
import { Mail, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthService } from "@/services/auth.service";

const formSchema = z.object({
  email: z.string().email({ message: "Inserisci un indirizzo email valido" }),
});

type FormValues = z.infer<typeof formSchema>;

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
}

const ForgotPasswordForm = ({ onBackToLogin }: ForgotPasswordFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const authService = AuthService.getInstance();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await authService.requestPasswordReset(data.email);

      if (result.success) {
        setSuccess(true);
        form.reset();
      } else {
        setError(
          result.error ||
            "Si è verificato un errore durante la richiesta di reset password.",
        );
      }
    } catch (err) {
      setError(
        "Si è verificato un errore durante la richiesta di reset password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Recupero Password
          </CardTitle>
          <CardDescription className="text-center">
            Inserisci la tua email per ricevere le istruzioni per reimpostare la
            password
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
                Abbiamo inviato un'email con le istruzioni per reimpostare la
                password. Controlla la tua casella di posta.
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="Inserisci la tua email"
                          className="pl-10"
                          type="email"
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
            disabled={isLoading}
          >
            {isLoading ? "Invio in corso..." : "Invia istruzioni"}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={onBackToLogin}
            type="button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna al login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPasswordForm;
