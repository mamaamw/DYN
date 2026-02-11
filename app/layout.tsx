import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import AppLayout from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "DYN",
  description: "Plateforme complete de gestion CRM pour votre entreprise",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className="antialiased bg-slate-50 text-slate-900"
      >
        <Header />
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}