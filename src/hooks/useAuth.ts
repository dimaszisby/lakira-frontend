// TODO: refactor to Auth

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { authRoutes, dashboardRoute } from "@/lib/routes";
import { persistSessionToken } from "@/src/features/auth/session.client";
import { fetchUserProfile, loginUser, logoutUser, registerUser } from "@/src/services/api/auth.api";
import type { UserAtom } from "@/src/services/state/atoms";
import { userAtom } from "@/src/services/state/atoms";
import type { AuthResponseDTO, CreateUserRequestDTO, LoginRequestDTO } from "@/types/dtos/user.dto";

/**
 * Custom Hook to handle authentication state.
 * - Uses `useMutation` for login & register.
 * - Uses `useQuery` for fetching user profile.
 */
export function useAuth() {
  const [user, setUser] = useAtom(userAtom);
  const router = useRouter();
  const queryClient = useQueryClient(); // ✅ Use queryClient to update cache

  // Fetch user profile using `useQuery`
  const { data: userData, isLoading } = useQuery<UserAtom | null, Error>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
    retry: false, // Don't retry if authentication fails
  });

  // Update state in a useEffect to avoid state updates during render
  useEffect(() => {
    if (userData !== undefined && userData !== user) {
      setUser(userData);
    }
  }, [userData, user, setUser]);

  // Login Mutation
  const loginMutation = useMutation<AuthResponseDTO, Error, LoginRequestDTO>({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      await persistSessionToken(data.token ?? null);
      setUser(data.user!);
      queryClient.setQueryData(["userProfile"], data.user); // ✅ Update cache
      await router.push(dashboardRoute()); // Redirect after login
    },
  });

  // Register Mutation
  const registerMutation = useMutation<AuthResponseDTO, Error, CreateUserRequestDTO>({
    mutationFn: registerUser,
    onSuccess: async (data) => {
      await persistSessionToken(data.token ?? null);
      setUser(data.user!);
      queryClient.setQueryData(["userProfile"], data.user);
      await router.push(dashboardRoute()); // Redirect after registration
    },
  });

  // Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: async () => {
      await persistSessionToken(null);
      setUser(null);
      queryClient.setQueryData(["userProfile"], null);
      await router.push(authRoutes.login());
    },
  });

  return {
    user: userData || user,
    isLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
  };
}
