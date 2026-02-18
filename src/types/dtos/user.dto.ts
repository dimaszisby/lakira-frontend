import type { z } from "zod";

import type {
  createUserSchema,
  loginUserSchema,
  updateUserSchema,
} from "@/types/api/zod-user.schema";

/**
 * @file src/types/dtos/user.dto.ts
 * @description Defines the Data Transfer Objects (DTOs) for User-related API contracts.
 * These interfaces and types are used for incoming and outgoing API requests and responses,
 * defining the structure of data exchanged between the client and server.
 * DTOs are often immutable.
 */

// * Response DTOs

/**
 * @interface UserResponseDTO
 * @description Represents the structure of a User object as returned in API responses (e.g., on login, profile retrieval).
 */
export interface UserResponseDTO {
  /**
   * @property {string} id - The unique identifier for the user (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} username - The user's unique username.
   * @readonly
   */
  readonly username: string;

  /**
   * @property {string} email - The user's unique email address.
   * @readonly
   */
  readonly email: string;

  /**
   *  @property {'user' | 'admin'} role - The role assigned to the user, determining their permissions.
   * @readonly
   */
  readonly role: "user" | "admin";

  /**
   * @property {boolean} isPublicProfile - Indicates if the user's profile is publicly visible.
   * @readonly
   */
  readonly isPublicProfile: boolean;

  /**
   * @property {string} createdAt - The timestamp when the user account was created, formatted as an ISO string.
   * @readonly
   */
  readonly createdAt: string;

  /**
   * @property {string} updatedAt - The timestamp when the user account was last updated, formatted as an ISO string.
   * @readonly
   */
  readonly updatedAt: string;
}

/**
 * Defines the structure of authentication-related API responses.
 */
// TODO: Add documentation
export interface AuthResponseDTO {
  token?: string;
  user?: UserResponseDTO;
}

// * Request DTOs

/**
 * @typedef CreateUserRequestDTO
 * @description Represents the expected structure of the request body when creating a new user.
 * Inferred from the Zod schema for validation.
 */
export type CreateUserRequestDTO = z.infer<typeof createUserSchema.shape.body>;

/**
 * @typedef UpdateUserRequestDTO
 * @description Represents the expected structure of the request body when updating an existing user.
 * Inferred from the Zod schema for validation.
 */
export type UpdateUserRequestDTO = z.infer<typeof updateUserSchema.shape.body>;

/**
 * @typedef LoginRequestDTO
 * @description Represents the expected structure of the request body when logging in a user.
 * Inferred from the Zod schema for validation.
 */
export type LoginRequestDTO = z.infer<typeof loginUserSchema.shape.body>;
