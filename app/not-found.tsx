import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page doesn't exist. Go back to your board or the home page.",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="platform w-full max-w-md" style={{ "--stage": "var(--stage-rejected)" } as React.CSSProperties}>
        <div className="px-6 pb-7 pt-7 sm:px-8">
          <p className="text-sm font-medium text-graphite">Error 404</p>
          <h1 className="mt-1 font-heading text-4xl font-extrabold leading-none text-ink">
            This page isn&apos;t on the map
          </h1>
          <p className="mt-3 leading-relaxed text-graphite">
            The link may be old or mistyped. Your board and everything on it are where you left them.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/dashboard" className={buttonVariants({ className: "h-10 px-4" })}>
              Go to your board
            </Link>
            <Link href="/" className={buttonVariants({ variant: "ghost", className: "h-10 px-4" })}>
              Home page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
