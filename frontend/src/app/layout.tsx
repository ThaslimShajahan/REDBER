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
    default: "Redber — AI Receptionists That Run Your Business 24/7",
    template: "%s | Redber",
  },
  description: "Redber deploys AI-powered receptionists that handle bookings, capture leads, answer questions, and engage customers around the clock — via chat, voice, and WhatsApp.",
  keywords: [
    "AI receptionist", "AI customer service", "AI booking system", "virtual receptionist",
    "AI lead capture", "WhatsApp AI bot", "voice AI receptionist", "chatbot for business",
    "AI appointment booking", "24/7 customer service AI", "Redber", "conversational AI",
  ],
  authors: [{ name: "Redber", url: "https://redber.in" }],
  creator: "Redber",
  publisher: "Redber",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: 'https://redber.in',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://redber.in",
    siteName: "Redber",
    title: "Redber — AI Receptionists That Run Your Business 24/7",
    description: "Deploy AI receptionists that handle bookings, capture leads, and engage customers 24/7 — via chat, voice & WhatsApp.",
    images: [{ url: "/android-chrome-512x512.png", width: 512, height: 512, alt: "Redber AI Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Redber — AI Receptionists That Run Your Business 24/7",
    description: "Deploy AI receptionists that handle bookings, capture leads, and engage customers 24/7 — via chat, voice & WhatsApp.",
    images: ["/android-chrome-512x512.png"],
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Redber",
  "url": "https://redber.in",
  "logo": "https://redber.in/android-chrome-512x512.png",
  "description": "AI-powered receptionist platform for businesses — bookings, lead capture, voice & WhatsApp.",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "url": "https://redber.in/contact"
  }
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Redber",
  "url": "https://redber.in",
  "potentialAction": {
    "@type": "SearchAction",
    "target": { "@type": "EntryPoint", "urlTemplate": "https://redber.in/?q={search_term_string}" },
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="bg-[#0a0a0a] overflow-x-hidden" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <main id="__next_root_wrapper" className="flex flex-col min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
