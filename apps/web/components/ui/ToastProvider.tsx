"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          borderRadius: "8px",
          fontSize: "0.875rem",
          fontFamily: "var(--font-inter), system-ui, sans-serif",
        },
        classNames: {
          success: "toast-success",
          error: "toast-error",
        },
      }}
    />
  );
}
