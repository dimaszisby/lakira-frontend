import type { AuthResponseDTO, CreateUserRequestDTO, LoginRequestDTO } from "@/types/dtos/user.dto";
import type ApiResponse from "@/types/generics/ApiResponse";
import { unwrap, unwrapOrNull } from "@/types/generics/ApiResponse";

import type { UserAtom } from "../state/atoms.js";
import api from "./api";
import { handleApiError } from "./handleApiError";

/** Same-origin session route, not a backend path. */
const LOGOUT_ENDPOINT = "/api/auth/logout";

/**
 * * Register
 * Registers a new user with the provided data.
 * Uses a generic type to make this function reusable for different auth responses.
 * @returns An API response containing a token and user data.
 */
export const registerUser = async (userData: CreateUserRequestDTO): Promise<AuthResponseDTO> => {
  try {
    const response = await api.post<ApiResponse<AuthResponseDTO>>("/auth/register", userData);

    return unwrap(response);
  } catch (error) {
    console.error("API Error in registerUser:", error);
    throw new Error(handleApiError(error).join(", "));
  }
};

/**
 * Logs in the user with the provided credentials.
 * @returns An API response containing a token and user data.
 */
export const loginUser = async (credentials: LoginRequestDTO): Promise<AuthResponseDTO> => {
  try {
    const response = await api.post<ApiResponse<AuthResponseDTO>>("/auth/login", credentials);

    return unwrap(response);
  } catch (error) {
    console.error("API Error in loginUser:", error);
    throw new Error(handleApiError(error).join(", "));
  }
};

/**
 * Fetches the user profile of the currently logged-in user.
 * Returns `null` if the request fails instead of throwing an error.
 */
export const fetchUserProfile = async (): Promise<UserAtom | null> => {
  try {
    const response = await api.get<ApiResponse<UserAtom>>("/auth/profile");

    return unwrapOrNull(response); // returns `null` instead of undefined or throwing an error
  } catch (error) {
    console.error("API Error in fetchUserProfile:", error);
    return null; // ✅ Always return `null` when an error occurs
  }
};

/**
 * Logs out the user.
 *
 * Deliberately *not* an `api` (proxy) call. Going through `/api/proxy` revoked
 * the refresh family upstream and left both cookies on this origin untouched —
 * the proxy strips `Set-Cookie`, and the route that deletes them was never
 * reached. `/api/auth/logout` does the upstream revocation and the local clear
 * together, which is the only combination that actually ends a session.
 */
export const logoutUser = async (): Promise<void> => {
  const response = await fetch(LOGOUT_ENDPOINT, { method: "POST" });

  if (!response.ok) {
    throw new Error("Logout failed");
  }
};
