import type React from "react"
import type { Metadata, Viewport } from "next"
import "@fontsource/inter/400.css"
import "@fontsource/inter/500.css"
import "@fontsource/inter/600.css"
import "@fontsource/inter/700.css"
import "./globals.css"
import { Providers } from "@/components/providers"
import AppLayout from "@/components/layout/app-layout"

export const metadata: Metadata = {
  title: {
    default: "KK Sports Operations",
    template: "%s | KK Sports Operations",
  },
  description: "KK Sports inventory, quotation, and team operations portal",
  keywords: "KK Sports, inventory, quotations, products, operations",
  authors: [{ name: "KK Sports" }],
  creator: "KK Sports",
  publisher: "KK Sports",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  applicationName: "KK Sports Operations",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48 32x32 16x16", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "KK Sports",
    statusBarStyle: "default",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030201",
}

function PoweredByFooter() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 flex min-h-5 items-center justify-center border-t border-black/10 bg-white/90 px-3 py-0.5 text-[10px] font-medium leading-none text-muted-foreground shadow-[0_-3px_12px_rgba(15,23,42,0.06)] backdrop-blur-md">
      <span>
        Powered by{" "}
        <a
          href="https://www.xoltech.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold uppercase tracking-[0.08em] text-[hsl(var(--kk-gold-hover))] transition-colors hover:text-[hsl(var(--kk-gold))] hover:underline hover:underline-offset-4"
        >
          XOLTECH
        </a>
      </span>
    </footer>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KK Sports" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#030201" />
        <meta name="theme-color" content="#030201" />
      </head>
      <body>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
        <PoweredByFooter />
      </body>
    </html>
  )
}
