import type { AuthResponseDTO, CreateUserRequestDTO, LoginRequestDTO } from "@/types/dtos/user.dto";
import type ApiResponse from "@/types/generics/ApiResponse";

import type { UserAtom } from "../state/atoms.js";
import api from "./api";
import { handleApiError } from "./handleApiError";

/**
 * * Register
 * Registers a new user with the provided data.
 * Uses a generic type to make this function reusable for different auth responses.
 * @returns An API response containing a token and user data.
 */
export const registerUser = async (userData: CreateUserRequestDTO): Promise<AuthResponseDTO> => {
  try {
    const response = await api.post<ApiResponse<AuthResponseDTO>>("/auth/register", userData);

    if (!response.data?.data) {
      throw new Error("Invalid register response"); // ✅ Prevent undefined responses
    }

    return response.data.data;
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

    if (!response.data?.data) {
      throw new Error("Invalid login response"); // ✅ Prevent undefined responses
    }

    return response.data.data;
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

    return response.data?.data || null; // returns `null` instead of undefined or throwing an error
  } catch (error) {
    console.error("API Error in fetchUserProfile:", error);
    return null; // ✅ Always return `null` when an error occurs
  }
};

/**
 * Logs out the user.
 * @returns A confirmation message from the API.
 */
export const logoutUser = async (): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await api.post<ApiResponse<{ message: string }>>("/auth/logout");
    return response.data;
  } catch (error) {
    console.error("API Error in logoutUser:", error);
    throw new Error(handleApiError(error).join(", "));
  }
};
