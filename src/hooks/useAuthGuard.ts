"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";

interface UseAuthGuardOptions {
  requireAuth?: boolean;
  redirectTo?: string;
}

export function useAuthGuard({
  requireAuth = true,
  redirectTo = "/login",
}: UseAuthGuardOptions = {}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      router.push(redirectTo);
    } else if (!requireAuth && user) {
      router.push("/home");
    } else {
      setReady(true);
    }
  }, [user, loading, requireAuth, redirectTo, router]);

  return { ready, loading };
}
