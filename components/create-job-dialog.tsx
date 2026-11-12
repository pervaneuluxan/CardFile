"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import JobForm from "./job-form";
import { createJobApplication } from "@/lib/actions/job-application";
import type { JobApplication } from "@/lib/models/models.types";

interface CreateJobApplicationDialogProps {
  columnId: string;
  boardId: string;
  columnName: string;
  onCreated?: (job: JobApplication) => void;
}

export default function CreateJobApplicationDialog({
  columnId,
  boardId,
  columnName,
  onCreated,
}: CreateJobApplicationDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-input px-3 py-2.5 text-sm font-medium text-graphite transition-colors hover:border-ink hover:bg-desk hover:text-ink"
        aria-label={`Add application to ${columnName}`}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add application
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add application</DialogTitle>
          <DialogDescription>It goes into {columnName}. You can move it later.</DialogDescription>
        </DialogHeader>
        {/* Remount the form each time so it starts empty. */}
        {open && (
          <JobForm
            idPrefix={`new-${columnId}`}
            submitLabel="Add application"
            pendingLabel="Adding…"
            onCancel={() => setOpen(false)}
            onSubmit={async (payload) => {
              const result = await createJobApplication({ ...payload, columnId, boardId });
              if (result?.error) return { error: result.error, fieldErrors: "fieldErrors" in result ? result.fieldErrors : undefined };
              if (result?.data) onCreated?.(result.data);
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
