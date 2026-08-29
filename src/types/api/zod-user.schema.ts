import { z } from "zod";

import { ZodMessages } from "@/constants/zod-messages";
import {
  zEmail,
  zPassword,
  zPasswordConfirmation,
  zPublicProfile,
  zRole,
  zUsername,
} from "@/constants/zod-rules";

export const createUserSchema = z.object({
  body: z
    .object({
      username: zUsername,
      email: zEmail,
      password: zPassword,
      passwordConfirmation: zPasswordConfirmation,
      isPublicProfile: zPublicProfile,
      role: zRole,
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: ZodMessages.user.passwordMismatch,
      path: ["passwordConfirmation"],
    }),
});

export const updateUserSchema = z.object({
  body: z.object({
    username: zUsername.optional(),
    email: zEmail.optional(),
    password: zPassword.optional(),
    isPublicProfile: zPublicProfile.optional(),
    role: zRole.optional(),
  }),
});

export const loginUserSchema = z.object({
  body: z.object({
    email: zEmail,
    password: zPassword,
  }),
});

/**
 * Account-recovery schemas.
 *
 * Kept beside the other user schemas rather than in the feature module, so all
 * user-shaped validation stays in one place.
 */
export const forgotPasswordSchema = z.object({
  email: zEmail,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: zPassword,
    passwordConfirmation: zPasswordConfirmation,
  })
  // Confirmation is checked here rather than in the component so the error
  // attaches to the field the user has to fix.
  .refine((values) => values.password === values.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: ZodMessages.user.passwordMismatch,
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
