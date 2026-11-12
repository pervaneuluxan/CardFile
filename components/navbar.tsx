"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth/auth-client";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Logo } from "./logo";
import ThemeToggle from "./theme-toggle";
import { BRAND } from "@/lib/brand";

export function initialFor(user?: { name?: string | null; email?: string | null } | null) {
  return (user?.name?.trim()?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();
}

const Navbar = () => {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  async function handleSignOut() {
    const result = await signOut();
    if (result?.error) {
      window.alert("Sign-out failed. Refresh the page and try again.");
      return;
    }
    router.push("/signin");
    router.refresh();
  }

  return (
    <header className="border-b-2 border-ink bg-paper">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"
      >
        <Link href="/" className="rounded-md" aria-label={`${BRAND.name} home`}>
          <Logo />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/guide"
            className={buttonVariants({ variant: "ghost", className: "max-sm:hidden" })}
          >
            Guide
          </Link>
          <ThemeToggle />
          {isPending ? null : session?.user ? (
            <>
              <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
                Board
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Account menu"
                  className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[popup-open]:ring-2 data-[popup-open]:ring-ring"
                >
                  <Avatar className="size-9 cursor-pointer">
                    <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                      {initialFor(session.user)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-1.5">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2 py-2 font-normal">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {session.user.name}
                      </span>
                      <span className="block truncate text-xs text-graphite">
                        {session.user.email}
                      </span>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="px-2 py-2">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/signin" className={buttonVariants({ variant: "ghost" })}>
                Sign in
              </Link>
              <Link href="/signup" className={buttonVariants({ className: "max-sm:hidden" })}>
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
