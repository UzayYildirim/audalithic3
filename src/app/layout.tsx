import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import "./globals.css";

const montserrat = Montserrat({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-montserrat'
});

export const metadata: Metadata = {
  title: "Audalithic - Multilingual Real-Time AI Radio.",
  description: "A multilingual real-time AI radio experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-sans`}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              borderRadius: '8px',
            },
          }}
        />
      </body>
    </html>
  );
}
