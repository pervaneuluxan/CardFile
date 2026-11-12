import { act, render, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ids, makeBoard, makeJob } from "../fixtures";

const createJobApplication = vi.fn();
const updateJobApplication = vi.fn();
const deleteJobApplication = vi.fn();
vi.mock("@/lib/actions/job-application", () => ({
  createJobApplication: (...a: unknown[]) => createJobApplication(...a),
  updateJobApplication: (...a: unknown[]) => updateJobApplication(...a),
  deleteJobApplication: (...a: unknown[]) => deleteJobApplication(...a),
}));

import KanbanBoard from "@/components/kanban-board";
import { useBoard } from "@/lib/hooks/useBoard";

beforeEach(() => {
  updateJobApplication.mockResolvedValue({ data: {} });
});

// The board must be created once: a new object each render would re-trigger the sync effect.
function renderBoardHook() {
  const board = makeBoard();
  return renderHook(() => useBoard(board));
}

describe("useBoard", () => {
  it("moves a job optimistically and keeps it when the server agrees", async () => {
    const { result } = renderBoardHook();
    await act(() => result.current.moveJob("a", "applied", 0));

    expect(updateJobApplication).toHaveBeenCalledWith("a", { columnId: "applied", order: 0 });
    expect(ids(result.current.columns[1])).toEqual(["a", "d"]);
    expect(result.current.error).toBeNull();
  });

  it("rolls back and exposes the error when the server refuses", async () => {
    updateJobApplication.mockResolvedValue({ error: "Unauthorized" });
    const { result } = renderBoardHook();
    await act(() => result.current.moveJob("a", "applied", 0));

    expect(ids(result.current.columns[0])).toEqual(["a", "b", "c"]);
    expect(result.current.error).toBe("Unauthorized");
  });

  it("rolls back when the request throws", async () => {
    updateJobApplication.mockRejectedValue(new Error("offline"));
    const { result } = renderBoardHook();
    await act(() => result.current.moveJob("a", "applied", 0));
    expect(ids(result.current.columns[1])).toEqual(["d"]);
    expect(result.current.error).toMatch(/couldn't be moved/);
  });

  it("adds, replaces and removes jobs locally", () => {
    const { result } = renderBoardHook();
    act(() => result.current.addJob(makeJob("e", "interviewing", 0)));
    expect(ids(result.current.columns[2])).toEqual(["e"]);

    act(() => result.current.replaceJob({ ...makeJob("e", "interviewing", 0), company: "Renamed" }));
    expect(result.current.columns[2].jobApplications[0].company).toBe("Renamed");

    act(() => result.current.removeJob("e"));
    expect(result.current.columns[2].jobApplications).toEqual([]);
  });

  it("does not add the same job twice", () => {
    const { result } = renderBoardHook();
    act(() => result.current.addJob(makeJob("d", "applied", 0)));
    expect(ids(result.current.columns[1])).toEqual(["d"]);
  });
});

describe("KanbanBoard", () => {
  it("renders columns in order with counts and a summary", () => {
    const board = makeBoard();
    board.columns.reverse(); // order must come from `order`, not array position
    render(<KanbanBoard board={board} />);

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(["Wish List", "Applied", "Interviewing"]);
    expect(screen.getByLabelText("3 applications")).toBeInTheDocument();
    expect(screen.getByTestId("board-summary")).toHaveTextContent("4 applications, 0 in interviews.");
  });

  it("shows an empty-column prompt", () => {
    render(<KanbanBoard board={makeBoard()} />);
    const column = screen.getByRole("region", { name: "Interviewing" });
    expect(column).toHaveTextContent(/drag a card here or add one/i);
  });

  it("shows a first-run message on an empty board", () => {
    const board = makeBoard();
    board.columns.forEach((c) => (c.jobApplications = []));
    render(<KanbanBoard board={board} />);
    expect(screen.getByTestId("board-summary")).toHaveTextContent(/no applications yet/i);
  });

  it("adds an application to the column it was created from", async () => {
    createJobApplication.mockResolvedValue({
      data: makeJob("new", "interviewing", 0, { company: "Stripe", position: "Engineer" }),
    });
    const user = userEvent.setup();
    render(<KanbanBoard board={makeBoard()} />);

    await user.click(screen.getByRole("button", { name: "Add application to Interviewing" }));
    const dialog = await screen.findByRole("dialog", { name: "Add application" });
    await user.type(within(dialog).getByLabelText(/company/i), "Stripe");
    await user.type(within(dialog).getByLabelText(/position/i), "Engineer");
    await user.click(within(dialog).getByRole("button", { name: "Add application" }));

    expect(createJobApplication).toHaveBeenCalledWith(
      expect.objectContaining({ company: "Stripe", position: "Engineer", columnId: "interviewing", boardId: "board-1" })
    );
    const column = screen.getByRole("region", { name: "Interviewing" });
    expect(await within(column).findByRole("article", { name: "Engineer at Stripe" })).toBeInTheDocument();
  });

  it("moves a card through its menu and shows an error banner on failure", async () => {
    updateJobApplication.mockResolvedValue({ error: "Column not found" });
    const user = userEvent.setup();
    render(<KanbanBoard board={makeBoard()} />);

    await user.click(screen.getByRole("button", { name: "Actions for Role a at Company a" }));
    await user.click(await screen.findByRole("menuitem", { name: "Applied" }));

    expect(updateJobApplication).toHaveBeenCalledWith("a", { columnId: "applied", order: 1 });
    expect(await screen.findByRole("alert")).toHaveTextContent("Column not found");
    // Rolled back into Wish List.
    expect(within(screen.getByRole("region", { name: "Wish List" })).getByRole("article", { name: "Role a at Company a" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss message" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
