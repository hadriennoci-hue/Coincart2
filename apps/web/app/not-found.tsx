import Link from "next/link";
import { WarningGraphic } from "../components/ui/WarningGraphic";

export const runtime = "edge";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - var(--navbar-h))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 32px",
        textAlign: "center",
        gap: 32,
      }}
    >
      <WarningGraphic width={420} height={137} animationSpeed={1.2} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 700, lineHeight: 1.1, margin: 0 }}>404</h1>
        <p style={{ fontSize: "1.125rem", color: "var(--muted)", maxWidth: 400, margin: 0, lineHeight: 1.6 }}>
          This page doesn&apos;t exist or has been moved.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <Link className="btn btn-primary btn-lg" href="/">Go Home</Link>
        <Link className="btn btn-ghost btn-lg" href="/search">Browse Catalog</Link>
      </div>
    </div>
  );
}
