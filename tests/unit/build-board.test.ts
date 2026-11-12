import { describe, expect, it } from "vitest";
import { buildBoard } from "@/lib/build-board";

const boardDoc = {
  _id: "b1",
  name: "Job Hunt",
  columns: [
    { _id: "c2", name: "Applied", order: 1, jobApplications: [] },
    // Stale ref: "j1" is still listed here although it now lives in Applied.
    { _id: "c1", name: "Wish List", order: 0, jobApplications: ["j1"] },
  ],
};

describe("buildBoard", () => {
  it("groups jobs by their own columnId and sorts columns and jobs", () => {
    const board = buildBoard(boardDoc, [
      { _id: "j2", columnId: "c2", order: 100, company: "B" },
      { _id: "j1", columnId: "c2", order: 0, company: "A" },
    ]);
    expect(board.columns.map((c) => c.name)).toEqual(["Wish List", "Applied"]);
    expect(board.columns[0].jobApplications).toEqual([]);
    expect(board.columns[1].jobApplications.map((j) => j._id)).toEqual(["j1", "j2"]);
  });

  it("drops jobs whose column no longer exists", () => {
    const board = buildBoard(boardDoc, [{ _id: "j9", columnId: "gone", order: 0 }]);
    expect(board.columns.flatMap((c) => c.jobApplications)).toEqual([]);
  });
});
