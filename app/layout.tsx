import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Tipografías de la marca (manual §08). next/font las sirve desde nuestro
// dominio y las expone como variables CSS que lee app/globals.css.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: { default: "Pulso", template: "%s · Pulso" },
  applicationName: "Pulso",
  description:
    "El ritmo de tu gimnasio: membresías, clases, rutinas y visitas por QR.",
};

export const viewport: Viewport = {
  themeColor: "#0e1013",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
