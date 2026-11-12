import type { Column, JobApplication } from "./models/models.types";

/** Splits a comma-separated tag string into trimmed, non-empty, de-duplicated tags. */
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of input.split(",")) {
    const tag = raw.trim();
    if (tag.length === 0) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

/** Returns a new array sorted by `order`, leaving the input untouched. */
export function sortByOrder<T extends { order: number }>(items: T[] = []): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function countJobs(columns: Column[]): number {
  return columns.reduce((sum, col) => sum + (col.jobApplications?.length ?? 0), 0);
}

/**
 * Optimistically moves a job to `newColumnId` at index `newOrder`.
 * Returns new column objects; the input is not mutated.
 * Orders in the target column are renumbered in steps of 100.
 */
export function moveJobInColumns(
  columns: Column[],
  jobId: string,
  newColumnId: string,
  newOrder: number
): Column[] {
  const next = columns.map((col) => ({
    ...col,
    jobApplications: sortByOrder(col.jobApplications),
  }));

  let job: JobApplication | undefined;
  for (const col of next) {
    const idx = col.jobApplications.findIndex((j) => j._id === jobId);
    if (idx !== -1) {
      job = col.jobApplications[idx];
      col.jobApplications = col.jobApplications.filter((j) => j._id !== jobId);
      break;
    }
  }

  const target = next.find((col) => col._id === newColumnId);
  if (!job || !target) return columns;

  const index = Math.max(0, Math.min(newOrder, target.jobApplications.length));
  const jobs = [...target.jobApplications];
  const changedColumn = job.columnId !== newColumnId;
  jobs.splice(index, 0, {
    ...job,
    columnId: newColumnId,
    ...(changedColumn ? { stageChangedAt: new Date().toISOString() } : {}),
  });
  target.jobApplications = jobs.map((j, i) => ({ ...j, order: i * 100 }));

  return next;
}

export interface DropDestination {
  columnId: string;
  order: number;
}

/**
 * Works out where a dragged job should land, given the id it was dropped on
 * (either a column id or another job's id). Returns null for a no-op drop.
 */
export function getDropDestination(
  columns: Column[],
  activeId: string,
  overId: string
): DropDestination | null {
  if (activeId === overId) return null;

  let sourceColumn: Column | undefined;
  let sourceIndex = -1;
  for (const col of columns) {
    const idx = sortByOrder(col.jobApplications).findIndex((j) => j._id === activeId);
    if (idx !== -1) {
      sourceColumn = col;
      sourceIndex = idx;
      break;
    }
  }
  if (!sourceColumn) return null;

  const overColumn = columns.find((col) => col._id === overId);
  if (overColumn) {
    const others = overColumn.jobApplications.filter((j) => j._id !== activeId);
    return { columnId: overColumn._id, order: others.length };
  }

  const targetColumn = columns.find((col) =>
    col.jobApplications.some((j) => j._id === overId)
  );
  if (!targetColumn) return null;

  const original = sortByOrder(targetColumn.jobApplications);
  const filtered = original.filter((j) => j._id !== activeId);
  const indexInOriginal = original.findIndex((j) => j._id === overId);
  const indexInFiltered = filtered.findIndex((j) => j._id === overId);

  if (indexInFiltered === -1) {
    return { columnId: targetColumn._id, order: filtered.length };
  }

  const sameColumn = sourceColumn._id === targetColumn._id;
  const order =
    sameColumn && sourceIndex < indexInOriginal ? indexInFiltered + 1 : indexInFiltered;

  if (sameColumn && order === sourceIndex) return null;
  return { columnId: targetColumn._id, order };
}

/** Returns a safe http(s) URL for linking, or null. */
export function safeExternalUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

/** Host name without "www." for compact display. */
export function displayHost(url?: string): string | null {
  const safe = safeExternalUrl(url);
  return safe ? new URL(safe).hostname.replace(/^www\./, "") : null;
}

/** "Designer at Wise", for screen-reader announcements. */
export function jobLabel(columns: Column[], jobId: string): string {
  const job = columns.flatMap((c) => c.jobApplications).find((j) => j._id === jobId);
  return job ? `${job.position} at ${job.company}` : "The card";
}

/** Names a drop target, which is either a column or a card inside one. */
export function describeDropTarget(columns: Column[], overId: string): string {
  const column = columns.find((c) => c._id === overId);
  if (column) return column.name;
  const owner = columns.find((c) => c.jobApplications.some((j) => j._id === overId));
  return owner ? `${owner.name}, next to ${jobLabel(columns, overId)}` : "no column";
}

/** One or two letters for a company monogram: "WorkLab" -> "WL", "TOG London" -> "TL", "Stripe" -> "S". */
export function companyInitials(company: string): string {
  const words = company.trim().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const word = words[0];
  const innerCapital = [...word.slice(1)].find((ch) => ch !== ch.toLowerCase());
  return (word[0] + (innerCapital ?? "")).toUpperCase();
}

const DAY = 24 * 60 * 60 * 1000;

/** "today", "1 day", "5 days", "2 weeks", "3 months": how long a card has sat in its column. */
export function timeInStage(since: string | Date | undefined, now: number = Date.now()): string | null {
  if (!since) return null;
  const t = new Date(since).getTime();
  if (Number.isNaN(t)) return null;
  const days = Math.max(0, Math.floor((now - t) / DAY));
  if (days === 0) return "today";
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"}`;
  if (days < 60) return `${Math.floor(days / 7)} weeks`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? "month" : "months"}`;
}
