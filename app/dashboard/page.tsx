import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/auth";
import connectDB from "@/lib/db";
import { Board, JobApplication } from "@/lib/models";
import { initilazeUserBoard } from "@/lib/init-user-board";
import { buildBoard } from "@/lib/build-board";
import KanbanBoard from "@/components/kanban-board";
import { pageMetadata } from "@/lib/site";
import type { Board as BoardType } from "@/lib/models/models.types";

export const metadata = pageMetadata({
  title: "Your board",
  description: "Your private board of job applications, from Wish List to Offer.",
  path: "/dashboard",
  index: false,
});

async function getBoard(userId: string): Promise<BoardType> {
  await connectDB();
  let boardDoc = await Board.findOne({ userId, name: "Job Hunt" }).populate("columns");
  if (!boardDoc) {
    // Accounts created before boards were provisioned on sign-up.
    await initilazeUserBoard(userId);
    boardDoc = await Board.findOne({ userId, name: "Job Hunt" }).populate("columns");
  }
  return buildBoard(boardDoc, await JobApplication.find({ boardId: boardDoc._id, userId }).lean());
}

async function DashboardContent() {
  const session = await getSession();
  if (!session?.user) redirect("/signin");

  const board = await getBoard(session.user.id);
  const firstName = session.user.name?.split(" ")[0];

  return (
    <>
      <h1 className="font-heading text-4xl font-extrabold leading-none text-ink sm:text-5xl">
        {firstName ? `${firstName}'s job hunt` : board.name}
      </h1>
      <div className="mt-2">
        <KanbanBoard board={board} />
      </div>
    </>
  );
}

function BoardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your board">
      <div className="h-9 w-64 rounded-md bg-desk" />
      <div className="mt-3 h-5 w-48 rounded-md bg-desk" />
      <div className="mt-8 flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-[18.5rem] shrink-0">
            <div className="h-1.5 bg-desk" />
            <div className="mt-6 h-28 rounded-[10px] bg-desk" />
            <div className="mt-2.5 h-20 rounded-[10px] bg-desk" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Suspense fallback={<BoardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
