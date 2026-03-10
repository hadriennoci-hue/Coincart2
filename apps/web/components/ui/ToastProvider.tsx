"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: "0.875rem",
          borderRadius: "8px",
        },
        classNames: {
          toast: "toast-base",
          success: "toast-success",
          error: "toast-error",
          description: "toast-description",
        },
      }}
    />
  );
}
