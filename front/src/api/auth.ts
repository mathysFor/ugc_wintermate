import { useFetcher, useMutator } from "@/api/api";
import type {
  LoginInput,
  AuthResponse,
  CreateAccountInput,
  CreateAccountResponse,
  AuthUser,
} from "@shared/types/auth";

export const useLogin = (options = {}) =>
  useMutator<LoginInput, AuthResponse>("/api/auth/login", options);

export const useRegister = (options = {}) =>
  useMutator<CreateAccountInput, CreateAccountResponse>("/api/auth/register", options);

export const useMe = (options = {}) =>
  useFetcher<undefined, AuthUser>({
    key: ["auth", "me"],
    path: "/api/auth/me",
    options,
  });
