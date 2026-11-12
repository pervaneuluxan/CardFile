import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LogoMark } from "./logo";

const LINKS = [
  { href: "/guide", label: "Guide" },
  { href: "/privacy", label: "Privacy" },
  { href: "/dashboard", label: "Your board" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-8 text-sm text-graphite sm:px-6">
        <p className="flex items-center gap-2">
          <LogoMark size={20} />
          {BRAND.name}, a job search board
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="rounded-sm hover:text-ink hover:underline hover:underline-offset-2">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
