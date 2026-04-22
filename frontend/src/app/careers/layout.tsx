import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the Redber team. We're looking for talented builders to help us define the future of conversational AI.",
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
