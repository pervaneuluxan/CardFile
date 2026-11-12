"use client";

import { useState } from "react";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import type { Board, Column, JobApplication } from "@/lib/models/models.types";
import { useBoard } from "@/lib/hooks/useBoard";
import {
  countJobs,
  describeDropTarget,
  getDropDestination,
  jobLabel,
  sortByOrder,
} from "@/lib/board-utils";
import { stageFor } from "@/lib/stages";
import CreateJobApplicationDialog from "./create-job-dialog";
import JobApplicationCard from "./job-application-card";

interface KanbanBoardProps {
  board: Board;
}

interface CardActions {
  onMove: (jobId: string, columnId: string) => void;
  onUpdated: (job: JobApplication) => void;
  onDeleted: (jobId: string) => void;
  onError: (message: string) => void;
}

function DroppableColumn({
  column,
  boardId,
  columns,
  actions,
  onCreated,
}: {
  column: Column;
  boardId: string;
  columns: Column[];
  actions: CardActions;
  onCreated: (job: JobApplication) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column._id,
    data: { type: "column", columnId: column._id },
  });
  const stage = stageFor(column.name);
  const jobs = sortByOrder(column.jobApplications);
  const headingId = `column-${column._id}`;

  return (
    <section
      aria-labelledby={headingId}
      className="board-column flex w-[18.5rem] shrink-0 snap-start flex-col"
      data-testid="board-column"
    >
      {/* The station for this column: its stretch of the line, then its name. */}
      <header
        className="board-stop flex items-baseline gap-2 px-3 pb-3"
        style={{ "--stage": stage.colorVar } as React.CSSProperties}
      >
        <h2 id={headingId} className="font-heading text-xl font-bold leading-tight text-ink">
          {column.name}
        </h2>
        <span className="ml-auto text-sm font-medium tabular-nums text-graphite" aria-label={`${jobs.length} applications`}>
          {jobs.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={`flex min-h-56 flex-1 flex-col gap-2.5 rounded-lg p-1.5 transition-colors ${
          isOver ? "bg-desk outline-2 outline-dashed outline-[var(--stage-applied)]/50" : ""
        }`}
      >
        <SortableContext items={jobs.map((job) => job._id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <SortableJobCard
              key={job._id}
              job={{ ...job, columnId: job.columnId || column._id }}
              columns={columns}
              stageColor={stage.colorVar}
              actions={actions}
            />
          ))}
        </SortableContext>

        {jobs.length === 0 && (
          <p className="rounded-lg bg-desk px-3 py-5 text-sm leading-relaxed text-graphite">
            {stage.hint ? `${stage.hint}. ` : ""}Drag a card here or add one.
          </p>
        )}

        <div className="mt-auto pt-1">
          <CreateJobApplicationDialog
            columnId={column._id}
            columnName={column.name}
            boardId={boardId}
            onCreated={onCreated}
          />
        </div>
      </div>
    </section>
  );
}

function SortableJobCard({
  job,
  columns,
  stageColor,
  actions,
}: {
  job: JobApplication;
  columns: Column[];
  stageColor: string;
  actions: CardActions;
}) {
  const { attributes, listeners, transform, transition, isDragging, setNodeRef } = useSortable({
    id: job._id,
    data: { type: "job", job },
  });
  // Keep the card an <article>: dnd-kit's role="button" would nest the menu button inside a button.
  // The card stays focusable, and Space/Enter starts a keyboard drag.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { role, ...dragAttributes } = attributes;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
    >
      <JobApplicationCard
        job={job}
        columns={columns}
        stageColor={stageColor}
        dragHandleProps={{ ...dragAttributes, "aria-roledescription": "draggable card", ...listeners }}
        onMove={(columnId) => actions.onMove(job._id, columnId)}
        onUpdated={actions.onUpdated}
        onDeleted={actions.onDeleted}
        onError={actions.onError}
      />
    </div>
  );
}

export default function KanbanBoard({ board }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { columns, moveJob, addJob, replaceJob, removeJob, error, setError, clearError } =
    useBoard(board);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const actions: CardActions = {
    onMove: (jobId, columnId) => {
      const target = columns.find((c) => c._id === columnId);
      moveJob(jobId, columnId, target?.jobApplications.length ?? 0);
    },
    onUpdated: replaceJob,
    onDeleted: removeJob,
    onError: setError,
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const destination = getDropDestination(columns, active.id as string, over.id as string);
    if (destination) await moveJob(active.id as string, destination.columnId, destination.order);
  }

  // Spoken by screen readers during a drag; dnd-kit's defaults would read database ids.
  const accessibility = {
    screenReaderInstructions: {
      draggable:
        "To pick up a card, press Space. While holding it, use the arrow keys to move it between columns, press Space to drop it, or Escape to cancel.",
    },
    announcements: {
      onDragStart: ({ active }: { active: { id: string | number } }) =>
        `Picked up ${jobLabel(columns, String(active.id))}.`,
      onDragOver: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) => {
        const label = jobLabel(columns, String(active.id));
        if (!over) return `${label} is not over a column.`;
        if (over.id === active.id) {
          const home = columns.find((c) => c.jobApplications.some((j) => j._id === active.id));
          return `${label} is in its starting place${home ? ` in ${home.name}` : ""}.`;
        }
        return `${label} is over ${describeDropTarget(columns, String(over.id))}.`;
      },
      onDragEnd: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
        over
          ? `${jobLabel(columns, String(active.id))} dropped in ${describeDropTarget(columns, String(over.id))}.`
          : `${jobLabel(columns, String(active.id))} was put back.`,
      onDragCancel: ({ active }: { active: { id: string | number } }) =>
        `Move cancelled. ${jobLabel(columns, String(active.id))} is back where it started.`,
    },
  };

  const activeJob = columns.flatMap((col) => col.jobApplications).find((job) => job._id === activeId);
  const activeColumn = columns.find((col) => col.jobApplications.some((j) => j._id === activeId));
  const total = countJobs(columns);
  const interviewing = columns
    .filter((c) => stageFor(c.name).key === "interviewing")
    .reduce((n, c) => n + c.jobApplications.length, 0);

  return (
    <>
      <p className="mb-7 text-graphite" data-testid="board-summary">
        {total === 0
          ? "No applications yet. Add the first role you're considering to Wish List."
          : `${total} ${total === 1 ? "application" : "applications"}, ${interviewing} in interviews.`}
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-card px-4 py-3 text-sm text-destructive"
        >
          <p className="flex-1">{error}</p>
          <button type="button" onClick={clearError} aria-label="Dismiss message" className="rounded-sm">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <DndContext
        // A stable id keeps dnd-kit's aria-describedby ids identical on server and client.
        id={`board-${board._id}`}
        sensors={sensors}
        accessibility={accessibility}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-6 pt-1 sm:-mx-6 sm:px-6">
          {columns.map((col) => (
            <DroppableColumn
              key={col._id}
              column={col}
              boardId={board._id}
              columns={columns}
              actions={actions}
              onCreated={addJob}
            />
          ))}
        </div>

        <DragOverlay>
          {activeJob ? (
            <div className="rotate-2 rounded-[10px] shadow-(--lift-shadow)">
              <JobApplicationCard
                job={activeJob}
                columns={columns}
                stageColor={activeColumn ? stageFor(activeColumn.name).colorVar : undefined}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
