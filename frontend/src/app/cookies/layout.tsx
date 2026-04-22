import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Information about how Redber uses cookies to improve your browsing experience.",
  alternates: { canonical: "https://redber.in/cookies" },
  robots: { index: false, follow: false },
};

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
