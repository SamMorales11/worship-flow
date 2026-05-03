import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Worship Flow",
  description: "Worship Flow application",
};

import { ClientLayout } from "@/components/ClientLayout";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex font-heading bg-background">
        <ClientLayout>{children}</ClientLayout>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
