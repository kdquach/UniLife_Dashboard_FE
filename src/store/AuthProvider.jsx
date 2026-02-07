import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthProvider({ children }) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    useAuthStore.persist?.rehydrate?.();
  }, []);

  if (!hasHydrated) return null;
  return children;
}
