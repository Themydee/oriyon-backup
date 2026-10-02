"use client";

import { useEffect } from "react";
import { buildApiUrl } from "@/lib/api";

// Sends uncaught browser errors to the gateway (POST /api/monitoring/client-error)
// so the daily monitoring report can show what is breaking for real visitors.
// Only the page path, error message and stack are sent — no user data.
const MAX_REPORTS_PER_PAGE_LOAD = 10;

export default function ErrorReporter() {
  useEffect(() => {
    const sent = new Set<string>();

    const report = (kind: string, message: string, stack?: string) => {
      if (!message || sent.size >= MAX_REPORTS_PER_PAGE_LOAD) return;
      const key = `${kind}|${message}`;
      if (sent.has(key)) return;
      sent.add(key);

      const body = JSON.stringify({
        kind,
        message: message.slice(0, 500),
        stack: stack?.slice(0, 4000),
        page: window.location.pathname,
      });
      const url = buildApiUrl("/monitoring/client-error");
      try {
        if (navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) return;
      } catch {
        // fall through to fetch
      }
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    };

    const onError = (event: ErrorEvent) => {
      // Ignore noise from browser extensions and cross-origin scripts
      if (!event.message || event.message === "Script error.") return;
      if (event.filename && !event.filename.startsWith(window.location.origin)) return;
      report("error", event.message, event.error?.stack);
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason ?? "");
      report("unhandledrejection", message, reason instanceof Error ? reason.stack : undefined);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
