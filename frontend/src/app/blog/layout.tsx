import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog & Insights",
  description: "Read the latest articles, deep-dives, and updates on AI customer service, lead capture, and business automation from the Redber team.",
  alternates: { canonical: "https://redber.in/blog" },
  openGraph: {
    title: "Redber Blog — AI Customer Service Insights",
    description: "Read the latest articles on AI receptionists, lead capture, and business automation from the Redber team.",
    url: "https://redber.in/blog",
    images: [{ url: "/android-chrome-512x512.png", width: 512, height: 512, alt: "Redber Blog" }],
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
