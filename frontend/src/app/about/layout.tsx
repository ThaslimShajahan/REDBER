import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn how Redber is building the future of AI-powered receptionists — enabling businesses to run 24/7 without missing a single customer.",
  alternates: { canonical: "https://redber.in/about" },
  openGraph: {
    title: "About Redber — AI Receptionists Built for Business",
    description: "Learn how Redber is building the future of AI-powered receptionists — enabling businesses to run 24/7 without missing a single customer.",
    url: "https://redber.in/about",
    images: [{ url: "/android-chrome-512x512.png", width: 512, height: 512, alt: "About Redber" }],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
