import { describe, expect, it } from "vitest";
import {
  companyInitials,
  countJobs,
  timeInStage,
  describeDropTarget,
  jobLabel,
  displayHost,
  getDropDestination,
  moveJobInColumns,
  parseTags,
  safeExternalUrl,
  sortByOrder,
} from "@/lib/board-utils";
import { ids, makeBoard } from "../fixtures";

describe("parseTags", () => {
  it("splits, trims and drops empty entries", () => {
    expect(parseTags(" React, ,Next.js ,  ")).toEqual(["React", "Next.js"]);
  });

  it("removes case-insensitive duplicates, keeping the first spelling", () => {
    expect(parseTags("React, react, REACT, Vue")).toEqual(["React", "Vue"]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseTags("")).toEqual([]);
  });
});

describe("sortByOrder", () => {
  it("sorts ascending without mutating the input", () => {
    const input = [{ order: 3 }, { order: 1 }, { order: 2 }];
    const out = sortByOrder(input);
    expect(out.map((x) => x.order)).toEqual([1, 2, 3]);
    expect(input.map((x) => x.order)).toEqual([3, 1, 2]);
  });

  it("treats undefined as empty", () => {
    expect(sortByOrder(undefined)).toEqual([]);
  });
});

describe("countJobs", () => {
  it("counts jobs across all columns", () => {
    expect(countJobs(makeBoard().columns)).toBe(4);
  });
});

describe("moveJobInColumns", () => {
  it("moves a job to another column at the given index and renumbers orders", () => {
    const columns = makeBoard().columns;
    const next = moveJobInColumns(columns, "b", "applied", 0);

    expect(ids(next[0])).toEqual(["a", "c"]);
    expect(ids(next[1])).toEqual(["b", "d"]);
    expect(next[1].jobApplications.map((j) => j.order)).toEqual([0, 100]);
    expect(next[1].jobApplications[0].columnId).toBe("applied");
  });

  it("stamps stageChangedAt when the column changes, not on a reorder", () => {
    const moved = moveJobInColumns(makeBoard().columns, "a", "applied", 0);
    expect(moved[1].jobApplications[0].stageChangedAt).toEqual(expect.any(String));
    const reordered = moveJobInColumns(makeBoard().columns, "a", "wish", 2);
    expect(reordered[0].jobApplications[2].stageChangedAt).toBeUndefined();
  });

  it("appends when the index is past the end", () => {
    const next = moveJobInColumns(makeBoard().columns, "a", "applied", 99);
    expect(ids(next[1])).toEqual(["d", "a"]);
  });

  it("reorders within the same column", () => {
    const next = moveJobInColumns(makeBoard().columns, "a", "wish", 2);
    expect(ids(next[0])).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the original columns", () => {
    const columns = makeBoard().columns;
    moveJobInColumns(columns, "a", "applied", 0);
    expect(ids(columns[0])).toEqual(["a", "b", "c"]);
    expect(ids(columns[1])).toEqual(["d"]);
  });

  it("returns the input unchanged for an unknown job or column", () => {
    const columns = makeBoard().columns;
    expect(moveJobInColumns(columns, "nope", "applied", 0)).toBe(columns);
    expect(moveJobInColumns(columns, "a", "nope", 0)).toBe(columns);
  });
});

describe("getDropDestination", () => {
  const columns = makeBoard().columns;

  it("drops onto an empty column at index 0", () => {
    expect(getDropDestination(columns, "a", "interviewing")).toEqual({ columnId: "interviewing", order: 0 });
  });

  it("drops onto a column (not a card) at the end", () => {
    expect(getDropDestination(columns, "a", "applied")).toEqual({ columnId: "applied", order: 1 });
  });

  it("drops onto a card in another column, taking its place", () => {
    expect(getDropDestination(columns, "a", "d")).toEqual({ columnId: "applied", order: 0 });
  });

  it("moving down within a column lands after the target card", () => {
    expect(getDropDestination(columns, "a", "c")).toEqual({ columnId: "wish", order: 2 });
  });

  it("moving up within a column lands before the target card", () => {
    expect(getDropDestination(columns, "c", "a")).toEqual({ columnId: "wish", order: 0 });
  });

  it("returns null when dropped on itself", () => {
    expect(getDropDestination(columns, "b", "b")).toBeNull();
  });

  it("returns null for unknown ids", () => {
    expect(getDropDestination(columns, "zzz", "applied")).toBeNull();
    expect(getDropDestination(columns, "a", "zzz")).toBeNull();
  });
});

describe("safeExternalUrl / displayHost", () => {
  it("accepts http and https links", () => {
    expect(safeExternalUrl("https://jobs.example.com/1")).toBe("https://jobs.example.com/1");
    expect(displayHost("https://www.example.com/jobs/1")).toBe("example.com");
  });

  it("rejects javascript: and malformed links", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("not a url")).toBeNull();
    expect(safeExternalUrl(undefined)).toBeNull();
    expect(displayHost("ftp://example.com")).toBeNull();
  });
});

describe("drag announcements", () => {
  const columns = makeBoard().columns;
  it("names jobs and targets in words, never ids", () => {
    expect(jobLabel(columns, "a")).toBe("Role a at Company a");
    expect(jobLabel(columns, "nope")).toBe("The card");
    expect(describeDropTarget(columns, "applied")).toBe("Applied");
    expect(describeDropTarget(columns, "d")).toBe("Applied, next to Role d at Company d");
    expect(describeDropTarget(columns, "nope")).toBe("no column");
  });
});

describe("companyInitials", () => {
  it.each([
    ["WorkLab", "WL"],
    ["Stripe", "S"],
    ["TOG London", "TL"],
    ["I Networks", "IN"],
    ["  mus logistics ", "ML"],
    ["Café Ölz", "CÖ"],
    ["", "?"],
  ])("%j -> %s", (name, initials) => {
    expect(companyInitials(name)).toBe(initials);
  });
});

describe("timeInStage", () => {
  const now = Date.UTC(2026, 10, 12, 12);
  const ago = (days: number) => new Date(now - days * 86_400_000).toISOString();
  it.each([
    [0, "today"],
    [1, "1 day"],
    [13, "13 days"],
    [14, "2 weeks"],
    [59, "8 weeks"],
    [60, "2 months"],
    [400, "13 months"],
  ])("%i days ago -> %s", (days, text) => {
    expect(timeInStage(ago(days), now)).toBe(text);
  });
  it("handles missing, invalid and future dates", () => {
    expect(timeInStage(undefined, now)).toBeNull();
    expect(timeInStage("not a date", now)).toBeNull();
    expect(timeInStage(ago(-2), now)).toBe("today");
  });
});
