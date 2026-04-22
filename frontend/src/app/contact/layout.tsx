import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Redber team. Book a demo, ask about pricing, or learn how AI receptionists can transform your business operations.",
  alternates: { canonical: "https://redber.in/contact" },
  openGraph: {
    title: "Contact Redber — Book a Demo",
    description: "Book a demo or reach out to the Redber team. See AI receptionists in action for your business.",
    url: "https://redber.in/contact",
    images: [{ url: "/android-chrome-512x512.png", width: 512, height: 512, alt: "Contact Redber" }],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
