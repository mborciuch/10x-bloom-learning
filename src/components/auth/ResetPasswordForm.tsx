import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Info, Loader2, Mail } from "lucide-react";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validation/auth.schema";

export function ResetPasswordForm() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const isSubmitDisabled = !form.formState.isValid || isSubmitting;

  useEffect(() => {
    form.setFocus("email");
  }, [form]);

  const handleSubmitForm = async (values: ResetPasswordFormValues) => {
    setStatusMessage(null);
    setFormError(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        setFormError(data?.message ?? "Nie udało się wysłać wiadomości. Spróbuj ponownie.");
        return;
      }

      const { message } = (await response.json()) as { message?: string };
      setStatusMessage(message ?? "Jeśli adres istnieje w systemie, wyślemy instrukcję resetu hasła.");
      form.reset({ email: "" });
      form.setFocus("email");
    } catch {
      setFormError("Wystąpił problem z połączeniem. Spróbuj ponownie.");
    }
  };

  return (
    <div className="space-y-6">
      <Alert variant="info">
        <Mail aria-hidden className="size-4" />
        <div>
          <AlertTitle>Zresetuj swoje hasło</AlertTitle>
          <AlertDescription>
            Wpisz adres email powiązany z kontem Bloom Learning. Gdy backend będzie gotowy, wyślemy unikalny link
            resetujący.
          </AlertDescription>
        </div>
      </Alert>

      {statusMessage && (
        <Alert variant="success">
          <CheckCircle2 aria-hidden className="size-4" />
          <div>
            <AlertTitle>Wiadomość wysłana</AlertTitle>
            <AlertDescription>{statusMessage}</AlertDescription>
          </div>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adres email</FormLabel>
                <FormDescription>Użyj adresu, którego używasz do logowania</FormDescription>
                <FormControl>
                  <Input {...field} type="email" autoComplete="email" placeholder="natalia@bloomlearning.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Wysyłanie instrukcji...
              </>
            ) : (
              "Wyślij link resetujący"
            )}
          </Button>
        </form>
      </Form>

      {formError && (
        <Alert variant="destructive">
          <AlertTitle>Nie udało się wysłać wiadomości</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <a
          href="/login"
          className="text-primary font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Wróć do logowania
        </a>
        <div className="inline-flex items-center gap-1 text-xs">
          <Info aria-hidden className="size-3.5" />W celu bezpieczeństwa link będzie aktywny przez 60 minut
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {isSubmitting ? "Trwa wysyłanie formularza resetu hasła" : "Formularz gotowy do wysłania"}
        {formError ? `Błąd: ${formError}` : null}
        {statusMessage ? `Sukces: ${statusMessage}` : null}
      </p>
    </div>
  );
}
