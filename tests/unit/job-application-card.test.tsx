import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeBoard, makeJob } from "../fixtures";

const deleteJobApplication = vi.fn();
const updateJobApplication = vi.fn();
vi.mock("@/lib/actions/job-application", () => ({
  deleteJobApplication: (...a: unknown[]) => deleteJobApplication(...a),
  updateJobApplication: (...a: unknown[]) => updateJobApplication(...a),
}));

import JobApplicationCard from "@/components/job-application-card";

const columns = makeBoard().columns;
const job = makeJob("a", "wish", 0, {
  company: "Wise",
  position: "Product Designer",
  location: "London",
  salary: "$90k",
  tags: ["Figma", "UX"],
  jobUrl: "https://www.wise.jobs/123",
  description: "Design money movement",
  notes: "Recruiter: Sam",
  stageChangedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
});

beforeEach(() => {
  deleteJobApplication.mockResolvedValue({ success: true });
  updateJobApplication.mockResolvedValue({ data: {} });
});

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Actions for Product Designer at Wise" }));
  return screen.findByRole("menu");
}

describe("JobApplicationCard", () => {
  it("shows the job's details", () => {
    render(<JobApplicationCard job={job} columns={columns} />);
    const card = screen.getByRole("article", { name: "Product Designer at Wise" });
    expect(within(card).getByRole("heading", { name: "Product Designer" })).toBeInTheDocument();
    expect(card).toHaveTextContent("London");
    expect(card).toHaveTextContent("$90k");
    expect(within(card).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Figma", "UX"]);
    const link = within(card).getByRole("link", { name: "Open job posting on wise.jobs (new tab)" });
    expect(link).toHaveAttribute("href", "https://www.wise.jobs/123");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows a monogram, time in stage and a notes marker", () => {
    render(<JobApplicationCard job={job} columns={columns} />);
    const card = screen.getByRole("article", { name: "Product Designer at Wise" });
    expect(card).toHaveTextContent("W");
    expect(within(card).getByTestId("stage-age")).toHaveTextContent("3 days in Wish List");
    expect(within(card).getByText("Has notes")).toBeInTheDocument();
  });

  it("says New for a card that entered its column today, and hides the notes marker without notes", () => {
    render(<JobApplicationCard job={{ ...job, notes: "", stageChangedAt: new Date().toISOString() }} columns={columns} />);
    expect(screen.getByTestId("stage-age")).toHaveTextContent("New in Wish List");
    expect(screen.queryByText("Has notes")).not.toBeInTheDocument();
  });

  it("does not render unsafe links", () => {
    render(<JobApplicationCard job={{ ...job, jobUrl: "javascript:alert(1)" }} columns={columns} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("offers every other column as a move target", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<JobApplicationCard job={job} columns={columns} onMove={onMove} />);
    const menu = await openMenu(user);
    const items = within(menu).getAllByRole("menuitem").map((i) => i.textContent);
    expect(items).toEqual(["Edit details", "Applied", "Interviewing", "Delete"]);

    await user.click(within(menu).getByRole("menuitem", { name: "Interviewing" }));
    expect(onMove).toHaveBeenCalledWith("interviewing");
  });

  it("asks before deleting, then deletes", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    render(<JobApplicationCard job={job} columns={columns} onDeleted={onDeleted} />);
    const menu = await openMenu(user);
    await user.click(within(menu).getByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog", { name: "Delete this application?" });
    expect(deleteJobApplication).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Delete application" }));

    expect(deleteJobApplication).toHaveBeenCalledWith("a");
    expect(onDeleted).toHaveBeenCalledWith("a");
  });

  it("keeps the card and reports when delete fails", async () => {
    deleteJobApplication.mockResolvedValue({ error: "Unauthorized" });
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    const onError = vi.fn();
    render(<JobApplicationCard job={job} columns={columns} onDeleted={onDeleted} onError={onError} />);
    const menu = await openMenu(user);
    await user.click(within(menu).getByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete application" }));

    expect(onError).toHaveBeenCalledWith("Unauthorized");
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("edits details and reports the updated job", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    render(<JobApplicationCard job={job} columns={columns} onUpdated={onUpdated} />);
    const menu = await openMenu(user);
    await user.click(within(menu).getByRole("menuitem", { name: "Edit details" }));

    const dialog = await screen.findByRole("dialog", { name: "Edit application" });
    const position = within(dialog).getByLabelText(/position/i);
    expect(position).toHaveValue("Product Designer");
    await user.clear(position);
    await user.type(position, "Senior Product Designer");
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

    expect(updateJobApplication).toHaveBeenCalledWith(
      "a",
      expect.objectContaining({ position: "Senior Product Designer", tags: ["Figma", "UX"] })
    );
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ _id: "a", position: "Senior Product Designer" }));
  });
});
