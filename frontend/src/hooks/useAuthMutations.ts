import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginRequest, SignupRequest } from "@/contexts/auth.types";
import { toast } from "sonner";

export const useAuthMutations = () => {
  const { login, signup, logout } = useAuth();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: () => {
      toast.success("Successfully signed in!");
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to sign in");
    },
  });

  const signupMutation = useMutation({
    mutationFn: (userData: SignupRequest) => signup(userData),
    onSuccess: () => {
      toast.success("Account created successfully! Please sign in.");
      navigate("/auth/signin");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create account");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      toast.success("Logged out successfully");
      navigate("/auth/signin");
    },
  });

  return {
    login: loginMutation,
    signup: signupMutation,
    logout: logoutMutation,
  };
};
