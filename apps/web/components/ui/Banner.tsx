"use client";

import * as React from "react";
import { X } from "lucide-react";

interface BannerProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  closable?: boolean;
  showShade?: boolean;
  variant?: "default" | "success" | "warning" | "info" | "promo";
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" },
  promo: { background: "var(--primary)", borderColor: "var(--primary-hover)", color: "#fff" },
  success: { background: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.35)", color: "#4ade80" },
  warning: { background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.35)", color: "#fbbf24" },
  info: { background: "rgba(48,96,200,0.15)", borderColor: "rgba(48,96,200,0.4)", color: "#93c5fd" },
};

export function Banner({
  title,
  description,
  icon,
  action,
  closable = false,
  showShade = false,
  variant = "default",
  className = "",
  style,
}: BannerProps) {
  const [visible, setVisible] = React.useState(true);
  if (!visible) return null;

  return (
    <div
      className={`banner ${className}`}
      style={{ ...variantStyles[variant], ...style }}
      role={variant === "warning" ? "alert" : "status"}
    >
      {showShade && <div className="banner-shade" />}
      <div className="banner-inner">
        {icon && <div className="banner-icon">{icon}</div>}
        <div className="banner-content">
          <span className="banner-title">{title}</span>
          {description && <span className="banner-desc">{description}</span>}
        </div>
        <div className="banner-actions">
          {action}
          {closable && (
            <button className="banner-close" onClick={() => setVisible(false)} aria-label="Dismiss">
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
