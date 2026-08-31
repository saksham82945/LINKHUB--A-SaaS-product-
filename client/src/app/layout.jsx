import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/providers/AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "LinkPort — Your Entire Professional Identity. One Link.",
    template: "%s | LinkPort",
  },
  description:
    "Create your professional page. Connect LinkedIn, GitHub, LeetCode, CodeChef. Build your AI resume and cover letter. Share one link with recruiters.",
  keywords: ["developer portfolio", "link in bio", "professional profile", "AI resume builder", "cover letter generator"],
  openGraph: {
    type: "website",
    siteName: "LinkPort",
    title: "LinkPort — The Developer's Linktree",
    description: "Your LinkedIn, GitHub, LeetCode, and resume — all in one link.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkPort — The Developer's Linktree",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}>
        {/* Restore auth session on app load */}
        <AuthProvider>
          {children}
        </AuthProvider>

        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e2e',
              color: '#cdd6f4',
              border: '1px solid #313244',
            },
          }}
        />
      </body>
    </html>
  );
}
