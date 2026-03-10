"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  variant?: "blue" | "dark";
}

const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Button", variant = "blue", className = "", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={`btn-interactive${variant === "dark" ? " btn-interactive-dark" : ""}${className ? " " + className : ""}`}
      {...props}
    >
      <span className="btn-interactive-span">{text}</span>
      <div className="btn-interactive-hover-content">
        <span>{text}</span>
        <ArrowRight size={16} />
      </div>
      <div className="btn-interactive-blob" />
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
