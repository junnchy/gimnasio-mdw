import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Tipografías de la marca (manual §08), versión variable y solo latín.
// Los archivos están en el repo (app/fonts, licencia SIL OFL) en lugar de
// bajarse de Google Fonts en cada build: con next/font/google, si Google no
// responde mientras Vercel compila, el deploy de producción falla (pasó el
// 9/11 dos veces seguidas). next/font los sirve desde nuestro dominio y los
// expone como las mismas variables CSS que lee app/globals.css.
const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});
const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-latin.woff2",
  weight: "300 700",
  variable: "--font-space-grotesk",
  display: "swap",
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
