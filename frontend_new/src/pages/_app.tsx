import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import type { AppProps } from 'next/app';
import Head from 'next/head';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Nova AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Nova AI - Your intelligent assistant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AuthProvider>
        <ThemeProvider>
          <main className={`${inter.variable} font-sans`}>
            <Component {...pageProps} />
          </main>
        </ThemeProvider>
      </AuthProvider>
    </>
  );
} 