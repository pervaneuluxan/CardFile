import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Semi_Condensed } from "next/font/google";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/site-footer";
import CookieNotice from "@/components/cookie-notice";
import { BRAND } from "@/lib/brand";
import { HOME_TITLE, SITE_URL } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

// Barlow is drawn from road and transit signage; the semi-condensed cut sets the headings.
const display = Barlow_Semi_Condensed({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Barlow({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Defaults for every page. Each page adds its own title, description and canonical link.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: HOME_TITLE, template: `%s | ${BRAND.name}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    locale: "en",
    title: HOME_TITLE,
    description: BRAND.description,
  },
  twitter: { card: "summary_large_image", title: HOME_TITLE, description: BRAND.description },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1220" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The head script sets the theme class before React hydrates.
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Inline and blocking on purpose: sets the theme class before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#content"
          className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="content" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
        <CookieNotice />
      </body>
    </html>
  );
}
