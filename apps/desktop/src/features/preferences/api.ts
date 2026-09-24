import { useMutation } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useAuthStore, type AuthUser } from "../../store/useAuthStore";
import type { DeskThemeOverride } from "../../scene/disciplineTheme";

export function useUpdateDeskTheme() {
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (override: DeskThemeOverride) => api.patch<AuthUser>("/auth/me/desk-theme", override),
    onSuccess: (user) => updateUser(user),
  });
}
