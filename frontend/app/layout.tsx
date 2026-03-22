import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import { StoreHeader } from "@/components/storefront/header";
import { AuthProvider } from "@/lib/auth-context";
import { LgpdBanner } from "@/components/storefront/lgpd-banner";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["300","400","500","600","700"] });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["400","500"] });

export const metadata: Metadata = {
  title: "InterBR — Interbrasil Distribuidora",
  description: "Interbrasil Distribuidora — catálogo online",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f9fafb]">
        <AuthProvider>
          <StoreHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">{children}</main>
          <footer className="mt-auto border-t bg-muted/30">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-gray-400">
              <p>© {new Date().getFullYear()} Interbrasil Distribuidora. Todos os direitos reservados.</p>
              <nav className="flex gap-4">
                <a href="/sobre" className="hover:text-foreground">Sobre</a>
                <a href="/contato" className="hover:text-foreground">Contato</a>
                <a href="/privacidade" className="hover:text-foreground">Privacidade</a>
              </nav>
            </div>
          </footer>
          <LgpdBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
