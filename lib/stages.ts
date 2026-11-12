export type StageKey =
  "wish" | "applied" | "interviewing" | "offer" | "rejected" | "other";

export interface Stage {
  key: StageKey;
  /** CSS custom property holding this stage's colour. */
  colorVar: string;
  /** CSS custom property for text placed on that colour. */
  onColorVar: string;
  /** Position along the main line (0 = Wish List ... 3 = Offer); null when off the main line. */
  step: number | null;
  hint: string;
}

const STAGES: Record<StageKey, Stage> = {
  wish: {
    key: "wish",
    colorVar: "var(--stage-wish)",
    onColorVar: "var(--on-stage-wish)",
    step: 0,
    hint: "Roles you want to apply for",
  },
  applied: {
    key: "applied",
    colorVar: "var(--stage-applied)",
    onColorVar: "var(--on-stage-applied)",
    step: 1,
    hint: "Sent, waiting to hear back",
  },
  interviewing: {
    key: "interviewing",
    colorVar: "var(--stage-interviewing)",
    onColorVar: "var(--on-stage-interviewing)",
    step: 2,
    hint: "Calls, tasks and on-sites",
  },
  offer: {
    key: "offer",
    colorVar: "var(--stage-offer)",
    onColorVar: "var(--on-stage-offer)",
    step: 3,
    hint: "Offers to weigh up",
  },
  rejected: {
    key: "rejected",
    colorVar: "var(--stage-rejected)",
    onColorVar: "var(--on-stage-rejected)",
    step: null,
    hint: "Closed, kept for reference",
  },
  other: {
    key: "other",
    colorVar: "var(--stage-wish)",
    onColorVar: "var(--on-stage-wish)",
    step: null,
    hint: "",
  },
};

/** Maps a column name to its stage styling, by name rather than by position. */
export function stageFor(columnName: string): Stage {
  const name = columnName.trim().toLowerCase();
  if (name.startsWith("wish")) return STAGES.wish;
  if (name.startsWith("applied")) return STAGES.applied;
  if (name.startsWith("interview")) return STAGES.interviewing;
  if (name.startsWith("offer")) return STAGES.offer;
  if (name.startsWith("reject")) return STAGES.rejected;
  return STAGES.other;
}

/** Number of stops on the main line, Wish List to Offer. */
export const MAIN_LINE_STOPS = 4;
