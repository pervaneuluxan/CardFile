"use client";

import { useState } from "react";
import { Board, Column, JobApplication } from "../models/models.types";
import { updateJobApplication } from "../actions/job-application";
import { moveJobInColumns, sortByOrder } from "../board-utils";

export function useBoard(initialBoard?: Board | null) {
  const [board, setBoard] = useState<Board | null>(initialBoard || null);
  const [columns, setColumns] = useState<Column[]>(sortByOrder(initialBoard?.columns));
  const [error, setError] = useState<string | null>(null);

  // When the server sends a fresh board (after revalidation), adopt it.
  // Adjusting state during render avoids an extra effect-driven render.
  const [syncedFrom, setSyncedFrom] = useState(initialBoard);
  if (initialBoard && initialBoard !== syncedFrom) {
    setSyncedFrom(initialBoard);
    setBoard(initialBoard);
    setColumns(sortByOrder(initialBoard.columns));
  }

  async function moveJob(jobApplicationId: string, newColumnId: string, newOrder: number) {
    const previous = columns;
    setColumns((prev) => moveJobInColumns(prev, jobApplicationId, newColumnId, newOrder));
    setError(null);

    try {
      const result = await updateJobApplication(jobApplicationId, {
        columnId: newColumnId,
        order: newOrder,
      });
      if (result?.error) {
        setColumns(previous);
        setError(result.error);
      }
    } catch {
      setColumns(previous);
      setError("The card couldn't be moved. Check your connection and try again.");
    }
  }

  function addJob(job: JobApplication) {
    setColumns((prev) =>
      prev.map((col) =>
        col._id === job.columnId && !col.jobApplications.some((j) => j._id === job._id)
          ? { ...col, jobApplications: [...col.jobApplications, job] }
          : col
      )
    );
  }

  function replaceJob(job: JobApplication) {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        jobApplications: col.jobApplications.map((j) => (j._id === job._id ? { ...j, ...job } : j)),
      }))
    );
  }

  function removeJob(jobId: string) {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        jobApplications: col.jobApplications.filter((j) => j._id !== jobId),
      }))
    );
  }

  return {
    board,
    columns,
    error,
    setError,
    moveJob,
    addJob,
    replaceJob,
    removeJob,
    clearError: () => setError(null),
  };
}
