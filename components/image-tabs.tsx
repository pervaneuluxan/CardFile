"use client";

import Image from "next/image";
import { useState } from "react";

// Screenshots of the board. Not currently placed on a page; kept ready to use.
// Sources are WebP at 1600px wide (see scripts/generate-icons.mjs); next/image
// serves smaller sizes from them as the layout needs.
const TABS = [
  {
    id: "empty",
    label: "Start with five columns",
    src: "/hero-images/hero1.webp",
    width: 1600,
    height: 820,
    alt: "A new board with five empty columns: Wish List, Applied, Interviewing, Offer and Rejected, each with an Add Job button.",
  },
  {
    id: "filled",
    label: "Fill it as you apply",
    src: "/hero-images/hero2.webp",
    width: 1600,
    height: 826,
    alt: "The same board in use. Each column holds cards showing a job title, company, a short description and tags such as React and Docker.",
  },
  {
    id: "add",
    label: "Add an application",
    src: "/hero-images/hero3.webp",
    width: 1600,
    height: 821,
    alt: "The Add Job Application dialog over the board, with fields for company, position, location, salary, job URL, tags, description and notes.",
  },
] as const;

export default function ImageTabs() {
  const [activeId, setActiveId] = useState<(typeof TABS)[number]["id"]>(TABS[0].id);
  const active = TABS.find((tab) => tab.id === activeId) ?? TABS[0];

  return (
    <section aria-label="Screenshots of the board" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div role="tablist" aria-label="Screenshots" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`shot-tab-${tab.id}`}
            aria-selected={tab.id === active.id}
            aria-controls="shot-panel"
            onClick={() => setActiveId(tab.id)}
            className={`rounded-lg px-4 py-2 text-[0.9375rem] font-medium transition-colors ${
              tab.id === active.id
                ? "bg-primary text-primary-foreground"
                : "bg-desk text-ink hover:bg-accent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="shot-panel"
        aria-labelledby={`shot-tab-${active.id}`}
        className="overflow-hidden rounded-[10px] border border-rule"
      >
        <Image
          key={active.id}
          src={active.src}
          alt={active.alt}
          width={active.width}
          height={active.height}
          // Below the fold: load lazily, and only as wide as the column it sits in.
          sizes="(min-width: 72rem) 68rem, 100vw"
          className="h-auto w-full"
        />
      </div>
    </section>
  );
}
