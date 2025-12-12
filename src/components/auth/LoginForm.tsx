import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Info, Loader2 } from "lucide-react";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth.schema";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const emailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const getReturnUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("returnUrl");
    if (value && value.startsWith("/") && !value.startsWith("//")) {
      return value;
    }
    return null;
  };

  const handleSubmitForm = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          rememberMe: values.rememberMe,
          returnUrl: getReturnUrl(),
        }),
      });

      if (!response.ok) {
        setFormError("Nieprawidłowe dane logowania");
        return;
      }

      const { redirectTo } = (await response.json()) as { redirectTo?: string };
      window.location.assign(redirectTo ?? "/app/calendar");
    } catch {
      setFormError("Wystąpił problem z połączeniem. Spróbuj ponownie.");
    }
  };

  const isSubmitting = form.formState.isSubmitting;
  const isSubmitDisabled = !form.formState.isValid || isSubmitting;

  return (
    <div className="space-y-6">
      <Alert variant="info">
        <Info aria-hidden className="size-4" />
        <div>
          <AlertTitle>Zaloguj się</AlertTitle>
          <AlertDescription>Użyj danych konta Bloom Learning, aby przejść do kalendarza nauki.</AlertDescription>
        </div>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => {
              const { ref, ...fieldProps } = field;
              const handleRef = (element: HTMLInputElement | null) => {
                emailInputRef.current = element;
                ref(element);
              };

              return (
                <FormItem>
                  <FormLabel>Adres email</FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      ref={handleRef}
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      placeholder="marta@bloomlearning.com"
                      inputMode="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hasło</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                    />
                  </FormControl>
                  <button
                    type="button"
                    aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-2 select-none rounded-full p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      aria-label="Zapamiętaj mnie na tym urządzeniu"
                    />
                  </FormControl>
                  <div className="leading-none">
                    <FormLabel className="text-sm font-medium">Zapamiętaj mnie</FormLabel>
                    <FormDescription className="text-xs">Pozostań zalogowana/y przez 30 dni</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <a
              href="/forgot-password"
              className="text-primary text-sm font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Nie pamiętasz hasła?
            </a>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Logowanie...
              </>
            ) : (
              "Zaloguj się"
            )}
          </Button>
        </form>
      </Form>

      {formError && (
        <Alert variant="destructive">
          <AlertTitle>Nie udało się zalogować</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <a
          href="/register"
          className="text-primary font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Załóż konto
        </a>
      </p>

      <p className="sr-only" role="status" aria-live="polite">
        {isSubmitting ? "Trwa wysyłanie formularza logowania" : "Formularz gotowy do wysłania"}
        {formError ? `Błąd: ${formError}` : null}
      </p>
    </div>
  );
}
