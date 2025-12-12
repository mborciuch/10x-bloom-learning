import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { registerSchema, type RegisterFormValues } from "@/lib/validation/auth.schema";
import { cn } from "@/lib/utils";

interface StrengthMeta {
  level: number;
  label: string;
  helper: string;
  barClass: string;
  textClass: string;
}

const evaluatePasswordStrength = (password: string): StrengthMeta => {
  if (!password) {
    return {
      level: 0,
      label: "Wprowadź hasło",
      helper: "Minimum 8 znaków, litery i cyfry",
      barClass: "bg-muted",
      textClass: "text-muted-foreground",
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return {
      level: 1,
      label: "Słabe hasło",
      helper: "Dodaj wielkie litery, cyfry i znak specjalny",
      barClass: "bg-destructive/70",
      textClass: "text-destructive",
    };
  }

  if (score <= 4) {
    return {
      level: 2,
      label: "Średnie hasło",
      helper: "Dodaj znak specjalny lub wydłuż hasło",
      barClass: "bg-amber-500",
      textClass: "text-amber-600 dark:text-amber-400",
    };
  }

  return {
    level: 3,
    label: "Silne hasło",
    helper: "Hasło spełnia wszystkie rekomendacje",
    barClass: "bg-emerald-500",
    textClass: "text-emerald-600 dark:text-emerald-300",
  };
};

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const passwordValue = form.watch("password");
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const strengthMeta = useMemo(() => evaluatePasswordStrength(passwordValue), [passwordValue]);

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

  const handleSubmitForm = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          returnUrl: getReturnUrl(),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        setFormError(data?.message ?? "Nie udało się utworzyć konta. Spróbuj ponownie.");
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
        <Sparkles aria-hidden className="size-4" />
        <div>
          <AlertTitle>Załóż konto w kilku krokach</AlertTitle>
          <AlertDescription>
            Wypełnij pola poniżej i rozpocznij pracę z inteligentnym kalendarzem Bloom Learning.
          </AlertDescription>
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
                      inputMode="email"
                      autoComplete="email"
                      placeholder="Twoj.email@bloomlearning.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <div className="grid gap-4 sm:grid-cols-2">
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
                        autoComplete="new-password"
                        placeholder="Minimum 8 znaków"
                      />
                    </FormControl>
                    <button
                      type="button"
                      aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-2 rounded-full p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                    </button>
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
                  <FormLabel>Potwierdź hasło</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Powtórz hasło"
                      />
                    </FormControl>
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-2 rounded-full p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Siła hasła</span>
                <span className={cn("text-xs font-semibold uppercase", strengthMeta.textClass)}>
                  {strengthMeta.label}
                </span>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2].map((segment) => (
                  <span
                    key={segment}
                    aria-hidden
                    className={cn(
                      "h-1.5 w-full rounded-full bg-muted transition-colors",
                      segment < strengthMeta.level && strengthMeta.barClass
                    )}
                  />
                ))}
              </div>
              <p className={cn("text-xs", strengthMeta.textClass)}>{strengthMeta.helper}</p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-xl border border-border/70 p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                </FormControl>
                <div className="space-y-1 text-sm">
                  <FormLabel className="font-semibold leading-tight">
                    Akceptuję regulamin i politykę prywatności
                  </FormLabel>
                  <FormDescription>
                    Kontynuując zgadzasz się z{" "}
                    <a
                      href="/terms"
                      className="text-primary font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      zasadami Bloom Learning
                    </a>
                    .
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Tworzenie konta...
              </>
            ) : (
              "Załóż konto"
            )}
          </Button>
        </form>
      </Form>

      {formError && (
        <Alert variant="destructive">
          <AlertTitle>Nie udało się założyć konta</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Masz już konto?{" "}
        <a
          href="/login"
          className="text-primary font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Zaloguj się
        </a>
      </p>

      <p className="sr-only" role="status" aria-live="polite">
        {isSubmitting ? "Trwa wysyłanie formularza rejestracji" : "Formularz gotowy do wysłania"}
        {formError ? `Błąd: ${formError}` : null}
      </p>
    </div>
  );
}
