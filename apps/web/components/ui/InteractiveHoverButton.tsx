"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type BaseProps = {
  text?: string;
  variant?: "blue" | "dark";
  className?: string;
};

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = BaseProps & { href: string; target?: string };

type InteractiveHoverButtonProps = ButtonProps | LinkProps;

function InteractiveHoverButton(props: InteractiveHoverButtonProps) {
  const { text = "Button", variant = "blue", className = "" } = props;
  const cls = `btn-interactive${variant === "dark" ? " btn-interactive-dark" : ""}${className ? " " + className : ""}`;
  const inner = (
    <>
      <span className="btn-interactive-span">{text}</span>
      <div className="btn-interactive-hover-content">
        <span>{text}</span>
        <ArrowRight size={16} />
      </div>
      <div className="btn-interactive-blob" />
    </>
  );

  if ("href" in props && props.href !== undefined) {
    const { href, target, text: _t, variant: _v, className: _c, ...rest } = props as LinkProps & Record<string, unknown>;
    return (
      <Link href={href} target={target} className={cls} {...(rest as object)}>
        {inner}
      </Link>
    );
  }

  const { text: _t, variant: _v, className: _c, href: _h, ...rest } = props as ButtonProps & { href?: undefined };
  return (
    <button className={cls} {...rest}>
      {inner}
    </button>
  );
}

InteractiveHoverButton.displayName = "InteractiveHoverButton";
export { InteractiveHoverButton };
