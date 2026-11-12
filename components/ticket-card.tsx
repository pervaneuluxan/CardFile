"use client";

// Client component: the posting link stops pointer/key events so it doesn't start a drag.
import React from "react";
import { ArrowUpRight, MapPin, NotebookPen } from "lucide-react";
import { companyInitials, displayHost, safeExternalUrl, timeInStage } from "@/lib/board-utils";
import { MAIN_LINE_STOPS, stageFor } from "@/lib/stages";

export type TicketPart = "header" | "description" | "meta" | "tags" | "stub" | "extras";

export interface TicketCardProps {
  position: string;
  company: string;
  description?: string;
  location?: string;
  salary?: string;
  tags?: string[];
  jobUrl?: string;
  notes?: string;
  stageName: string;
  stageColor: string;
  /** When the card entered its column. */
  since?: string;
  /** Fixed text instead of computing from `since` (static pages). */
  stageAgeOverride?: string;
  /** Slot for the actions menu. */
  menu?: React.ReactNode;
  /** Lettered callouts, used by the homepage's "anatomy" diagram. */
  markers?: Partial<Record<TicketPart, string>>;
  className?: string;
  style?: React.CSSProperties;
  articleProps?: React.HTMLAttributes<HTMLElement>;
}

export function Marker({ k, className = "" }: { k: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute -left-9 grid size-6 place-items-center rounded-full bg-ink text-xs font-semibold text-paper ${className}`}
    >
      {k}
    </span>
  );
}

/**
 * How far along the main line this card is: one small stop per stage from
 * Wish List to Offer, filled up to the current one. Rejected is off the main
 * line, so it shows as a terminus bar. Decorative: the text beside it says the same.
 */
function StageTrack({ step, off }: { step: number | null; off: boolean }) {
  if (step === null) {
    return (
      <span aria-hidden="true" className="flex shrink-0 items-center">
        <span className="h-0.5 w-3" style={{ background: off ? "var(--stage)" : "var(--rule)" }} />
        <span className="h-3 w-1 rounded-[1px]" style={{ background: "var(--stage)" }} />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center">
      {Array.from({ length: MAIN_LINE_STOPS }).map((_, i) => {
        const reached = i <= step;
        return (
          <span key={i} className="flex items-center">
            {i > 0 && (
              <span className="h-0.5 w-2" style={{ background: reached ? "var(--stage)" : "var(--rule)" }} />
            )}
            <span
              className={i === step ? "size-2.5 rounded-full border-2" : "size-1.5 rounded-full"}
              style={
                i === step
                  ? { borderColor: "var(--stage)", background: "var(--card)" }
                  : { background: reached ? "var(--stage)" : "var(--rule)" }
              }
            />
          </span>
        );
      })}
    </span>
  );
}

/**
 * The job application card: a ticket with the company's initials in a round
 * line bullet, the role, the practical details, and a perforated stub that
 * shows where the card is on the line and how long it has been there.
 */
export default function TicketCard({
  position,
  company,
  description,
  location,
  salary,
  tags,
  jobUrl,
  notes,
  stageName,
  stageColor,
  since,
  stageAgeOverride,
  menu,
  markers,
  className = "",
  style,
  articleProps,
}: TicketCardProps) {
  const href = safeExternalUrl(jobUrl);
  const host = displayHost(jobUrl);
  const age = stageAgeOverride ?? timeInStage(since);
  const hasNotes = Boolean(notes?.trim());
  const stage = stageFor(stageName);
  const m = (part: TicketPart, extra?: string) =>
    markers?.[part] ? <Marker k={markers[part]!} className={extra} /> : null;

  return (
    <article
      aria-label={`${position} at ${company}`}
      className={`ticket ${className}`}
      style={{ "--stage": stageColor, "--on-stage": stage.onColorVar, ...style } as React.CSSProperties}
      {...articleProps}
    >
      <div className="relative flex items-start gap-3 px-3.5 pb-2.5 pt-3.5">
        {m("header", "top-[1.15rem]")}
        <span aria-hidden="true" className="ticket__monogram">
          {companyInitials(company)}
        </span>
        <div className="relative min-w-0 flex-1 pt-px">
          <h3 className="font-heading text-[1.0625rem] font-semibold leading-tight text-ink">{position}</h3>
          <p className="truncate text-sm leading-5 text-graphite">{company}</p>
        </div>
        {menu}
      </div>

      {(description || location || salary || (tags && tags.length > 0)) && (
        <div className="space-y-2 px-3.5 pb-3 text-sm leading-5">
          {description && (
            // The marker sits on a wrapper: line-clamp hides overflow and would clip it.
            <div className="relative">
              {m("description")}
              <p className="line-clamp-2 text-ink/80">{description}</p>
            </div>
          )}
          {(location || salary) && (
            <p className="relative flex flex-wrap items-center gap-x-3 gap-y-0.5 text-graphite">
              {m("meta")}
              {location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {location}
                </span>
              )}
              {salary && <span className="font-semibold text-ink/85">{salary}</span>}
            </p>
          )}
          {tags && tags.length > 0 && (
            <div className="relative">
              {m("tags")}
              <ul className="flex flex-wrap gap-1" aria-label="Tags">
                {tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-desk px-2 text-xs leading-5 text-ink/75">
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="ticket__stub flex items-center gap-2.5 px-3.5 py-2 text-[0.8125rem] text-graphite">
        {m("stub")}
        <StageTrack step={stage.step} off={stage.key === "rejected"} />
        <span className="min-w-0 flex-1 truncate" suppressHydrationWarning data-testid="stage-age">
          {age === "today" || age === null ? (
            <>New in {stageName}</>
          ) : (
            <>
              <span className="font-semibold text-ink/85">{age}</span> in {stageName}
            </>
          )}
        </span>
        <span className="relative flex items-center gap-0.5">
          {m("extras", "left-auto -right-[2.9rem]")}
          {hasNotes && (
            <span className="grid size-6 place-items-center" title={notes}>
              <NotebookPen className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Has notes</span>
            </span>
          )}
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open job posting on ${host} (new tab)`}
              title={host ?? undefined}
              className="grid size-6 place-items-center rounded-md text-[var(--stage-applied)] hover:bg-desk"
              onPointerDown={(e) => e.stopPropagation()}
              // Enter/Space on the link must open it, not start a keyboard drag of the card.
              onKeyDown={(e) => e.stopPropagation()}
            >
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          )}
        </span>
      </div>
    </article>
  );
}
