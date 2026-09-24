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

/** Tier 9's rearrangeable desk — persists { [objectKey]: slotIndex }. */
export function useUpdateDeskLayout() {
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (patch: Record<string, number>) => api.patch<AuthUser>("/auth/me/desk-layout", patch),
    onSuccess: (user) => updateUser(user),
  });
}
