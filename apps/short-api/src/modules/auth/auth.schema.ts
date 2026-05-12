import z from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[^a-zA-Z0-9]/,
    "Password must contain at least one special character",
  );

export const registerUserInputSchema = z
  .object({
    email: z.email(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

const REFRESH_TOKEN_REQUIRED_MESSAGE = "Refresh token is required";

export const refreshSessionInputSchema = z.object({
  refreshToken: z
    .string(REFRESH_TOKEN_REQUIRED_MESSAGE)
    .min(1, REFRESH_TOKEN_REQUIRED_MESSAGE),
});

export type RefreshSessionInput = z.infer<typeof refreshSessionInputSchema>;
