import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog & Insights",
  description: "Read the latest news, updates, and deep-dives about AI customer service from the Redber team.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
