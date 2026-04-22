import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://redber.in'),
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  title: {
    default: "Redber — AI-Powered Expert Employees",
    template: "%s | Redber",
  },
  description: "Deploy hyper-realistic AI employees that handle reservations, book test drives, and engage leads around the clock.",
  keywords: ["AI assistants", "Virtual receptionist", "AI lead capture", "Customer service AI", "Acenzos AI"],
  authors: [{ name: "Acenzos", url: "https://acenzos.com" }],
  creator: "Acenzos",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://redber.in",
    siteName: "Redber",
    title: "Redber — AI-Powered Expert Employees",
    description: "Deploy hyper-realistic AI employees that handle reservations, book test drives, and engage leads around the clock.",
    images: [{ url: "/logo/Redber Logo white.svg", width: 1200, height: 630, alt: "Redber AI Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Redber — AI-Powered Expert Employees",
    description: "Deploy hyper-realistic AI employees that handle reservations, book test drives, and engage leads around the clock.",
    images: ["/logo/Redber Logo white.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="bg-[#0a0a0a] overflow-x-hidden" suppressHydrationWarning>
        <main id="__next_root_wrapper" className="flex flex-col min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
