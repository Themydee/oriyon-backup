"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { refreshAccessToken } from "@/lib/api";

export interface LmsSession {
  userId: string;
  role: string;
  email: string;
}

// Restores the signed-in LMS user from the refresh token, or sends them to the
// LMS login page. The access token stays in memory (authStore), never storage.
export function useLmsSession() {
  const router = useRouter();
  const [session, setSession] = useState<LmsSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!localStorage.getItem("refreshToken")) {
        router.replace("/learn/lms");
        return;
      }
      try {
        const token = useAuthStore.getState().accessToken || (await refreshAccessToken());
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (!cancelled) {
          setSession({ userId: payload.userId, role: payload.role || "trainee", email: payload.email || "" });
        }
      } catch {
        router.replace("/learn/lms");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return session;
}
