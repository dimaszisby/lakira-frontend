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
