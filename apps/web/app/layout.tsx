import "./globals.css";
import Link from "next/link";

export const runtime = 'edge';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <div className="header">
            <Link href="/">
              <h1>Wizhard Store</h1>
            </Link>
            <div style={{ display: "flex", gap: 10 }}>
              <Link className="button secondary" href="/cart">
                Cart
              </Link>
              <Link className="button secondary" href="/checkout">
                Checkout
              </Link>
            </div>
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}
