import { describe, expect, it, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  createJobApplication,
  deleteJobApplication,
  updateJobApplication,
} from "@/lib/actions/job-application";
import { initilazeUserBoard } from "@/lib/init-user-board";
import { Column, JobApplication } from "@/lib/models";
import { signInAs } from "./session";

const ALICE = "alice-user-id";
const BOB = "bob-user-id";

type Ctx = { boardId: string; col: Record<string, string> };

async function boardFor(userId: string): Promise<Ctx> {
  const board = await initilazeUserBoard(userId);
  const columns = await Column.find({ boardId: board._id }).lean<{ _id: unknown; name: string }[]>();
  return {
    boardId: String(board._id),
    col: Object.fromEntries(columns.map((c) => [c.name, String(c._id)])),
  };
}

async function add(ctx: Ctx, column: string, company: string) {
  const res = await createJobApplication({
    company,
    position: "Engineer",
    columnId: ctx.col[column],
    boardId: ctx.boardId,
  });
  if (!res.data) throw new Error(res.error);
  return res.data._id as string;
}

/** Job ids in a column, ordered by the stored `order` field. */
async function orderIn(columnId: string) {
  const jobs = await JobApplication.find({ columnId }).sort({ order: 1 }).lean<{ company: string }[]>();
  return jobs.map((j) => j.company);
}

async function columnRefs(columnId: string) {
  const col = await Column.findById(columnId).lean<{ jobApplications: unknown[] }>();
  return (col?.jobApplications ?? []).map(String);
}

describe("initilazeUserBoard", () => {
  it("creates one board with the five default columns, once", async () => {
    const first = await initilazeUserBoard(ALICE);
    const second = await initilazeUserBoard(ALICE);
    expect(String(second._id)).toBe(String(first._id));

    const columns = await Column.find({ boardId: first._id }).sort({ order: 1 }).lean<{ name: string }[]>();
    expect(columns.map((c) => c.name)).toEqual(["Wish List", "Applied", "Interviewing", "Offer", "Rejected"]);
  });
});

describe("createJobApplication", () => {
  let alice: Ctx;
  beforeEach(async () => {
    alice = await boardFor(ALICE);
  });

  it("rejects anonymous callers", async () => {
    const res = await createJobApplication({ company: "X", position: "Y", columnId: alice.col.Applied, boardId: alice.boardId });
    expect(res).toEqual({ error: "Unauthorized" });
    expect(await JobApplication.countDocuments()).toBe(0);
  });

  it("creates the job, links it to its column and appends to the end", async () => {
    signInAs(ALICE);
    const res = await createJobApplication({
      company: "Wise",
      position: "Designer",
      location: "London",
      tags: ["Figma"],
      columnId: alice.col["Wish List"],
      boardId: alice.boardId,
    });

    expect(res.data).toMatchObject({ company: "Wise", position: "Designer", userId: ALICE, tags: ["Figma"], order: 0 });
    expect(await columnRefs(alice.col["Wish List"])).toEqual([res.data._id]);
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");

    const second = await createJobApplication({ company: "Stripe", position: "Eng", columnId: alice.col["Wish List"], boardId: alice.boardId });
    expect(second.data.order).toBeGreaterThan(res.data.order);
  });

  it("requires company and position (whitespace does not count)", async () => {
    signInAs(ALICE);
    const res = await createJobApplication({ company: "   ", position: "Eng", columnId: alice.col.Applied, boardId: alice.boardId });
    expect(res).toEqual({ error: "Missing required fields" });
  });

  it("validates on the server too: bad links and over-long text are refused", async () => {
    signInAs(ALICE);
    const base = { position: "Eng", columnId: alice.col.Applied, boardId: alice.boardId };

    const badLink = await createJobApplication({ ...base, company: "X", jobUrl: "javascript:alert(1)" });
    expect(badLink.error).toBe("Enter a full link that starts with https://");
    expect(badLink).toHaveProperty("fieldErrors.jobUrl");

    const tooLong = await createJobApplication({ ...base, company: "c".repeat(101) });
    expect(tooLong).toHaveProperty("fieldErrors.company", "Use 100 characters or fewer.");

    expect(await JobApplication.countDocuments()).toBe(0);
  });

  it("refuses to write to someone else's board", async () => {
    const bob = await boardFor(BOB);
    signInAs(ALICE);
    const res = await createJobApplication({ company: "X", position: "Y", columnId: bob.col.Applied, boardId: bob.boardId });
    expect(res).toEqual({ error: "Board not found" });
  });

  it("refuses a column from a different board", async () => {
    const bob = await boardFor(BOB);
    signInAs(ALICE);
    const res = await createJobApplication({ company: "X", position: "Y", columnId: bob.col.Applied, boardId: alice.boardId });
    expect(res).toEqual({ error: "Column not found" });
  });
});

describe("updateJobApplication", () => {
  let alice: Ctx;
  beforeEach(async () => {
    alice = await boardFor(ALICE);
    signInAs(ALICE);
  });

  it("updates details", async () => {
    const id = await add(alice, "Applied", "Wise");
    const res = await updateJobApplication(id, { notes: "Recruiter: Sam", tags: ["Remote"] });
    expect(res.data).toMatchObject({ notes: "Recruiter: Sam", tags: ["Remote"] });
  });

  it("refuses an invalid link on edit and leaves the card unchanged", async () => {
    const id = await add(alice, "Applied", "Wise");
    const res = await updateJobApplication(id, { jobUrl: "example.com" });
    expect(res).toHaveProperty("fieldErrors.jobUrl");
    expect((await JobApplication.findById(id))?.jobUrl).toBeUndefined();
  });

  it("rejects blanking out the company", async () => {
    const id = await add(alice, "Applied", "Wise");
    expect(await updateJobApplication(id, { company: "  " })).toEqual({ error: "Company is required" });
  });

  it("moves a job to another column at a position and keeps column refs in sync", async () => {
    const a = await add(alice, "Wish List", "A");
    await add(alice, "Applied", "B");
    await add(alice, "Applied", "C");

    const res = await updateJobApplication(a, { columnId: alice.col.Applied, order: 1 });

    expect(res.data.columnId).toBe(alice.col.Applied);
    expect(await orderIn(alice.col.Applied)).toEqual(["B", "A", "C"]);
    expect(await columnRefs(alice.col["Wish List"])).toEqual([]);
    expect(await columnRefs(alice.col.Applied)).toContain(a);
  });

  it("records when a job enters a column, and only resets it on a column change", async () => {
    const a = await add(alice, "Wish List", "A");
    const created = (await JobApplication.findById(a).lean<{ stageChangedAt: Date }>())!.stageChangedAt;
    expect(created).toBeInstanceOf(Date);

    await new Promise((r) => setTimeout(r, 15));
    await updateJobApplication(a, { notes: "edited" });
    const afterEdit = (await JobApplication.findById(a).lean<{ stageChangedAt: Date }>())!.stageChangedAt;
    expect(afterEdit.getTime()).toBe(created.getTime());

    await updateJobApplication(a, { columnId: alice.col.Applied });
    const afterMove = (await JobApplication.findById(a).lean<{ stageChangedAt: Date }>())!.stageChangedAt;
    expect(afterMove.getTime()).toBeGreaterThan(created.getTime());
  });

  it("appends when moving without an order", async () => {
    const a = await add(alice, "Wish List", "A");
    await add(alice, "Offer", "B");
    await updateJobApplication(a, { columnId: alice.col.Offer });
    expect(await orderIn(alice.col.Offer)).toEqual(["B", "A"]);
  });

  it("reorders within a column", async () => {
    // Use the board's own 100-step ordering so the reorder maths applies.
    const ids = [];
    for (const name of ["A", "B", "C"]) ids.push(await add(alice, "Applied", name));
    for (let i = 0; i < ids.length; i++) await JobApplication.findByIdAndUpdate(ids[i], { order: i * 100 });

    await updateJobApplication(ids[2], { order: 0 });
    expect(await orderIn(alice.col.Applied)).toEqual(["C", "A", "B"]);

    await updateJobApplication(ids[2], { order: 2 });
    expect(await orderIn(alice.col.Applied)).toEqual(["A", "B", "C"]);
  });

  it("refuses to move a job into another user's column", async () => {
    const bob = await boardFor(BOB);
    const a = await add(alice, "Applied", "A");
    const res = await updateJobApplication(a, { columnId: bob.col.Applied });
    expect(res).toEqual({ error: "Column not found" });
    expect(await columnRefs(bob.col.Applied)).toEqual([]);
    expect(await columnRefs(alice.col.Applied)).toEqual([a]);
  });

  it("refuses to edit another user's job", async () => {
    const a = await add(alice, "Applied", "A");
    signInAs(BOB);
    expect(await updateJobApplication(a, { company: "Hacked" })).toEqual({ error: "Unauthorized" });
  });

  it("reports a missing job", async () => {
    expect(await updateJobApplication("6650f0f0f0f0f0f0f0f0f0f0", { company: "X" })).toEqual({
      error: "Job application not found",
    });
  });
});

describe("deleteJobApplication", () => {
  it("deletes the job and unlinks it from its column", async () => {
    const alice = await boardFor(ALICE);
    signInAs(ALICE);
    const a = await add(alice, "Applied", "A");

    expect(await deleteJobApplication(a)).toEqual({ success: true });
    expect(await JobApplication.findById(a)).toBeNull();
    expect(await columnRefs(alice.col.Applied)).toEqual([]);
  });

  it("refuses to delete another user's job", async () => {
    const alice = await boardFor(ALICE);
    signInAs(ALICE);
    const a = await add(alice, "Applied", "A");
    signInAs(BOB);
    expect(await deleteJobApplication(a)).toEqual({ error: "Unauthorized" });
    expect(await JobApplication.findById(a)).not.toBeNull();
  });

  it("rejects anonymous callers", async () => {
    expect(await deleteJobApplication("6650f0f0f0f0f0f0f0f0f0f0")).toEqual({ error: "Unauthorized" });
  });
});
