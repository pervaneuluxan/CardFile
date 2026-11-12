"use client";

import React, { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { Column, JobApplication } from "@/lib/models/models.types";
import {
  deleteJobApplication,
  updateJobApplication,
} from "@/lib/actions/job-application";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import JobForm, { type JobFormValues } from "./job-form";
import TicketCard from "./ticket-card";
import { stageFor } from "@/lib/stages";

interface JobApplicationCardProps {
  job: JobApplication;
  columns: Column[];
  /** CSS colour for the card's stage rule. */
  stageColor?: string;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  onMove?: (columnId: string) => void;
  onUpdated?: (job: JobApplication) => void;
  onDeleted?: (jobId: string) => void;
  onError?: (message: string) => void;
}

function toFormValues(job: JobApplication): JobFormValues {
  return {
    company: job.company,
    position: job.position,
    location: job.location ?? "",
    salary: job.salary ?? "",
    jobUrl: job.jobUrl ?? "",
    tags: job.tags?.join(", ") ?? "",
    description: job.description ?? "",
    notes: job.notes ?? "",
  };
}

export default function JobApplicationCard({
  job,
  columns,
  stageColor,
  dragHandleProps,
  onMove,
  onUpdated,
  onDeleted,
  onError,
}: JobApplicationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const label = `${job.position} at ${job.company}`;
  const otherColumns = columns.filter((c) => c._id !== job.columnId);
  const columnName = columns.find((c) => c._id === job.columnId)?.name ?? "";

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deleteJobApplication(job._id);
      if (result?.error) {
        onError?.(result.error);
      } else {
        onDeleted?.(job._id);
        setIsConfirmingDelete(false);
      }
    } catch {
      onError?.("The application couldn't be deleted. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <TicketCard
        position={job.position}
        company={job.company}
        stageName={columnName}
        stageColor={stageColor ?? stageFor(columnName).colorVar}
        description={job.description}
        location={job.location}
        salary={job.salary}
        tags={job.tags}
        jobUrl={job.jobUrl}
        notes={job.notes}
        since={job.stageChangedAt ?? job.createdAt}
        articleProps={dragHandleProps}
        menu={
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Actions for ${label}`}
                  className="-mr-1.5 -mt-1 grid size-7 shrink-0 place-items-center rounded-md text-graphite hover:bg-desk hover:text-ink focus-visible:outline-2 focus-visible:outline-ring data-[popup-open]:bg-desk"
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    Edit details
                  </DropdownMenuItem>
                  {otherColumns.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Move to</DropdownMenuLabel>
                        {otherColumns.map((column) => (
                          <DropdownMenuItem
                            key={column._id}
                            onClick={() => onMove?.(column._id)}
                          >
                            {column.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setIsConfirmingDelete(true)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
        }
      />

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit application</DialogTitle>
            <DialogDescription>{label}</DialogDescription>
          </DialogHeader>
          {isEditing && (
            <JobForm
              idPrefix={`edit-${job._id}`}
              initialValues={toFormValues(job)}
              submitLabel="Save changes"
              pendingLabel="Saving…"
              onCancel={() => setIsEditing(false)}
              onSubmit={async (payload) => {
                const result = await updateJobApplication(job._id, payload);
                if (result?.error) return { error: result.error, fieldErrors: "fieldErrors" in result ? result.fieldErrors : undefined };
                onUpdated?.({ ...job, ...payload, ...(result?.data ?? {}) });
                setIsEditing(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Delete this application?
            </DialogTitle>
            <DialogDescription>
              {label} and its notes will be removed from your board. This
              can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmingDelete(false)}
            >
              Keep it
            </Button>
            <Button
              className="bg-destructive text-primary-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
