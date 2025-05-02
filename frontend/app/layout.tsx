import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { BrandColorProvider } from "../contexts/BrandColorContext";
import Navbar from "../components/layout/Navbar";
import ApiStatus from "../components/ApiStatus";

export const metadata: Metadata = {
  title: "Nova - Your AI Assistant",
  description: "Turn your documents into an AI assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text">
        <AuthProvider>
          <BrandColorProvider>
            <Navbar />
            <main className="responsive-container py-6">
              <div className="page-enter">
                {children}
              </div>
            </main>
            <ApiStatus />
          </BrandColorProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
  //comment
