import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Redber — AI-Powered Expert Employees",
  description: "Deploy hyper-realistic AI employees that handle reservations, book test drives, and engage leads around the clock.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#0a0a0a] overflow-x-hidden">{children}</body>
    </html>
  );
}
