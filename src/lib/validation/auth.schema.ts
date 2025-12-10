import { z } from "zod";

/**
 * Shared validation schemas for authentication flows (login, register, password reset).
 * Backend integration will reuse the exact same contracts to keep parity with UI validation.
 */
export const loginSchema = z.object({
  email: z.string({ required_error: "Adres email jest wymagany" }).trim().email("Wprowadź poprawny adres email"),
  password: z
    .string({ required_error: "Hasło jest wymagane" })
    .min(6, "Hasło musi mieć co najmniej 6 znaków")
    .max(128, "Hasło może mieć maksymalnie 128 znaków"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string({ required_error: "Adres email jest wymagany" }).trim().email("Wprowadź poprawny adres email"),
    password: z
      .string({ required_error: "Hasło jest wymagane" })
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .max(128, "Hasło może mieć maksymalnie 128 znaków"),
    confirmPassword: z
      .string({ required_error: "Potwierdź hasło" })
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .max(128, "Hasło może mieć maksymalnie 128 znaków"),
    acceptTerms: z.boolean().refine((value) => value === true, { message: "Aby kontynuować zaakceptuj regulamin" }),
  })
  .refine(
    (data) => {
      if (!data.password || !data.confirmPassword) return true;
      return data.password === data.confirmPassword;
    },
    {
      path: ["confirmPassword"],
      message: "Hasła muszą być identyczne",
    }
  );

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z.object({
  email: z.string({ required_error: "Adres email jest wymagany" }).trim().email("Wprowadź poprawny adres email"),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
