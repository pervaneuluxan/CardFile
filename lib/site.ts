import type { Metadata } from "next";
import { BRAND } from "./brand";

/** Public address of the site. Set NEXT_PUBLIC_SITE_URL in the environment (see .env.example). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

export const HOME_TITLE = `${BRAND.name} | Job application tracker`;

// A page that sets its own Open Graph fields replaces the inherited ones, image
// included, so every page names the share image itself. Keep this text in step
// with app/opengraph-image.alt.txt.
const SHARE_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: `${BRAND.name}: a job hunt drawn as a transit line with five stops, from Wish List to Offer, beside the words "Every application, on one board."`,
};

interface PageMeta {
  /** Page name; the layout appends "| Cardfile". */
  title: string;
  description: string;
  /** Path from the site root, e.g. "/guide". */
  path: string;
  /** Private or utility pages are kept out of search results. */
  index?: boolean;
}

/**
 * Metadata for one page: title, description, canonical link, and matching
 * Open Graph and Twitter fields. The share image comes from
 * app/opengraph-image.png and applies to every page.
 */
export function pageMetadata({ title, description, path, index = true }: PageMeta): Metadata {
  const fullTitle = `${title} | ${BRAND.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: index ? undefined : { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      locale: "en",
      url: path,
      title: fullTitle,
      description,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [SHARE_IMAGE] },
  };
}

/** The home page keeps the site-wide title and adds its own canonical link. */
export const homeMetadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    locale: "en",
    url: "/",
    title: HOME_TITLE,
    description: BRAND.description,
    images: [SHARE_IMAGE],
  },
};
