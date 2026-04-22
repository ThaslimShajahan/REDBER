import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Capabilities",
  description: "Explore everything Redber can do — appointment booking, lead capture, voice calling, WhatsApp integration, multi-language support, and 24/7 customer engagement.",
  alternates: { canonical: "https://redber.in/capabilities" },
  openGraph: {
    title: "Redber Capabilities — Full AI Receptionist Feature Set",
    description: "Appointment booking, lead capture, voice calling, WhatsApp, multi-language — see the full power of Redber's AI receptionists.",
    url: "https://redber.in/capabilities",
    images: [{ url: "/android-chrome-512x512.png", width: 512, height: 512, alt: "Redber Capabilities" }],
  },
};

export default function CapabilitiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
