import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServeFlow — Business operations, simplified.",
  description: "Premium multi-tenant business operations and appointment booking platform by Zentravi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="bg-ivory text-ink antialiased sans">
        {children}
      </body>
    </html>
  );
}
