import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata = {
  title: 'Nova AI - Next-generation AI Chat Interface',
  description: 'A modern, neural dopamine AI chat interface with advanced features',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" data-theme="dark">
      <body className="h-full bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        {/* Enhanced Neural Background */}
        <div className="neural-mesh" />
        <div className="floating-orb" />
        <div className="floating-orb" />
        <div className="floating-orb" />
        
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <div id="root" className="h-full relative z-10">
                {children}
              </div>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 