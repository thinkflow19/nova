import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { BrandColorProvider } from "../contexts/BrandColorContext";
import { ReactNode } from 'react';
import { Roboto } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import ClientLayout from "../components/layout/ClientLayout";

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: "Nova - AI-Powered Workspace",
  description: "Build, automate, and chat with AI inside one fluid workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${roboto.variable} font-sans h-full`} suppressHydrationWarning>
      <body className="h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <BrandColorProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
              <Toaster position="bottom-right" />
            </BrandColorProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
  //comment
