import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ToastProvider } from "@/components/Toast";
import { FloatingTools } from "@/components/FloatingTools";
import { ExpenseModalProvider } from "@/components/ExpenseModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your personal and home expenses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-gray-100 dark:bg-gray-950">
        <ToastProvider>
          <ExpenseModalProvider>
            <KeyboardShortcuts />
            <Navigation />
            <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
            <FloatingTools />
          </ExpenseModalProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
