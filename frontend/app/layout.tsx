import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { BrandColorProvider } from "../contexts/BrandColorContext";
import Navbar from "../components/layout/Navbar";
import { ReactNode } from 'react';
import { Roboto } from 'next/font/google';
import Sidebar from "../components/Sidebar";
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
// Import the ClientApiStatus wrapper component
// import ClientApiStatus from '../components/ClientApiStatus'; // Removed to hide status message

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: "Nova - AI Chat",
  description: "Next generation AI chat interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} font-sans h-full`} suppressHydrationWarning>
      <head>
        <title>Nova AI</title>
        <meta name="description" content="Nova AI - Intelligent Chat Assistant" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <BrandColorProvider>
              <div className="flex h-screen">
                <Sidebar />
                <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Navbar />
                    <div className="page-enter">
                      {children}
                    </div>
                  </div>
                </main>
              </div>
              <Toaster position="bottom-right" />
            </BrandColorProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
  //comment
