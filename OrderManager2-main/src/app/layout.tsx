import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "注文管理システム",
  description: "注文管理システム",
  applicationName: "注文管理システム",
  keywords: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
  creator: "Hamaryo226, sakurai-lab-07",
  authors: [
    { name: "Hamaryo226", url: "https://github.com/Hamaryo226" },
    { name: "sakurai-lab-07", url: "https://github.com/sakurai-lab-07" },
  ],
  publisher: "Render",
  generator: "Next.js",
  appleWebApp: {
    capable: true,
    title: "注文管理システム",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: false, // noindexの設定
    googleBot: {
      index: false, // Google のクローラーをブロック
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-white text-black min-h-screen">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
