import type { Board } from "./models/models.types";
import { sortByOrder } from "./board-utils";

/**
 * Turns a board document (with populated columns) and its jobs into the plain
 * shape the client uses. Jobs are grouped by their own `columnId`, which is the
 * source of truth: a column's `jobApplications` array can drift if a move is
 * interrupted, but a job's `columnId` is always set by a single write.
 */
export function buildBoard(boardDoc: unknown, jobDocs: unknown[]): Board {
  const board = JSON.parse(JSON.stringify(boardDoc)) as Board;
  const jobs = JSON.parse(JSON.stringify(jobDocs)) as Board["columns"][number]["jobApplications"];

  const byColumn = new Map<string, typeof jobs>();
  for (const job of jobs) {
    const key = String(job.columnId);
    byColumn.set(key, [...(byColumn.get(key) ?? []), job]);
  }

  board.columns = sortByOrder(board.columns).map((col) => ({
    ...col,
    jobApplications: sortByOrder(byColumn.get(col._id) ?? []),
  }));
  return board;
}
