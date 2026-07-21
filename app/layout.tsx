import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/components/ui/ToastContainer";
import PublicHeader from "@/components/ui/PublicHeader";
import Breadcrumb from "@/components/ui/Breadcrumb";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sonsery - Learn anything, anywhere",
  description: "Explore our curated collection of courses designed to help you grow. Learn from experts and join thousands of students worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider>
          <AuthProvider>
            <PublicHeader />
            <Breadcrumb />
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
