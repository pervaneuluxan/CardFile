import type { Board, Column, JobApplication } from "@/lib/models/models.types";

export function makeJob(id: string, columnId: string, order: number, extra: Partial<JobApplication> = {}): JobApplication {
  return {
    _id: id,
    company: `Company ${id}`,
    position: `Role ${id}`,
    status: "applied",
    boardId: "board-1",
    columnId,
    order,
    ...extra,
  };
}

export function makeColumn(id: string, name: string, order: number, jobs: JobApplication[] = []): Column {
  return { _id: id, name, order, columns: [], jobApplications: jobs };
}

/** Wish List: a, b, c   Applied: d   Interviewing: (empty) */
export function makeBoard(): Board {
  return {
    _id: "board-1",
    name: "Job Hunt",
    columns: [
      makeColumn("wish", "Wish List", 0, [
        makeJob("a", "wish", 0),
        makeJob("b", "wish", 100),
        makeJob("c", "wish", 200),
      ]),
      makeColumn("applied", "Applied", 1, [makeJob("d", "applied", 0)]),
      makeColumn("interviewing", "Interviewing", 2, []),
    ],
  };
}

export const ids = (col: Column) => col.jobApplications.map((j) => j._id);
