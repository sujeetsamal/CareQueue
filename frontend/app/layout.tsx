import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareQueue — Hospital Patient Queue Management System",
  description:
    "College DSA project demonstrating Java Strings, Stacks, Queues, and Linked Lists in a full-stack hospital patient queue management system.",
  keywords: [
    "Hospital Queue Management",
    "Data Structures and Algorithms",
    "Java Queue",
    "Linked List",
    "Java Stack",
    "Spring Boot",
    "Next.js",
  ],
  authors: [{ name: "CareQueue Engineering Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
        {children}
      </body>
    </html>
  );
}
