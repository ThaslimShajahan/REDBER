import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the Redber team. We're hiring builders passionate about AI, automation, and redefining how businesses interact with their customers.",
  alternates: { canonical: "https://redber.in/careers" },
  openGraph: {
    title: "Careers at Redber — Build the Future of AI Receptionists",
    description: "Join the Redber team. We're hiring builders passionate about AI, automation, and redefining how businesses interact with their customers.",
    url: "https://redber.in/careers",
    images: [{ url: "/android-chrome-512x512.png", width: 512, height: 512, alt: "Careers at Redber" }],
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
