import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import JobForm, { EMPTY_JOB_FORM, toPayload } from "@/components/job-form";

function renderForm(props: Partial<React.ComponentProps<typeof JobForm>> = {}) {
  const onSubmit = props.onSubmit ?? vi.fn(async () => undefined);
  const onCancel = props.onCancel ?? vi.fn();
  render(
    <Dialog open>
      <DialogContent>
        <JobForm idPrefix="t" submitLabel="Add application" pendingLabel="Adding…" onSubmit={onSubmit} onCancel={onCancel} {...props} />
      </DialogContent>
    </Dialog>
  );
  return { onSubmit, onCancel };
}

describe("toPayload", () => {
  it("trims text fields and parses tags", () => {
    expect(
      toPayload({ ...EMPTY_JOB_FORM, company: "  Wise ", position: " Designer", tags: "Figma, , figma, UX" })
    ).toMatchObject({ company: "Wise", position: "Designer", tags: ["Figma", "UX"] });
  });
});

describe("JobForm", () => {
  it("labels every field so it can be found by name", () => {
    renderForm();
    for (const name of [/company/i, /position/i, /location/i, /salary/i, /job posting link/i, /tags/i, /description/i, /notes/i]) {
      expect(screen.getByLabelText(name)).toBeInTheDocument();
    }
  });

  it("only company and position are required", () => {
    renderForm();
    expect(screen.getByLabelText(/company/i)).toBeRequired();
    expect(screen.getByLabelText(/position/i)).toBeRequired();
    expect(screen.getByLabelText(/location/i)).not.toBeRequired();
    expect(screen.getByLabelText(/salary/i)).not.toBeRequired();
  });

  it("submits a cleaned payload", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();
    await user.type(screen.getByLabelText(/company/i), " Stripe ");
    await user.type(screen.getByLabelText(/position/i), "Front End Developer");
    await user.type(screen.getByLabelText(/tags/i), "React, TypeScript,");
    await user.click(screen.getByRole("button", { name: "Add application" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ company: "Stripe", position: "Front End Developer", tags: ["React", "TypeScript"] })
    );
  });

  it("shows the server's error and keeps the values", async () => {
    const user = userEvent.setup();
    renderForm({ onSubmit: vi.fn(async () => ({ error: "Board not found" })) });
    await user.type(screen.getByLabelText(/company/i), "Wise");
    await user.type(screen.getByLabelText(/position/i), "Designer");
    await user.click(screen.getByRole("button", { name: "Add application" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Board not found");
    expect(screen.getByLabelText(/company/i)).toHaveValue("Wise");
  });

  it("shows a connection error when submit throws", async () => {
    const user = userEvent.setup();
    renderForm({ onSubmit: vi.fn(async () => Promise.reject(new Error("offline"))) });
    await user.type(screen.getByLabelText(/company/i), "Wise");
    await user.type(screen.getByLabelText(/position/i), "Designer");
    await user.click(screen.getByRole("button", { name: "Add application" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/check your connection/i);
  });

  it("pre-fills initial values for editing", () => {
    renderForm({ initialValues: { ...EMPTY_JOB_FORM, company: "Nomura", tags: "iOS, Android" } });
    expect(screen.getByLabelText(/company/i)).toHaveValue("Nomura");
    expect(screen.getByLabelText(/tags/i)).toHaveValue("iOS, Android");
  });

  it("calls onCancel", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows inline messages, focuses the first problem and does not submit", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();
    await user.type(screen.getByLabelText(/job posting link/i), "example.com/jobs");
    await user.click(screen.getByRole("button", { name: "Add application" }));

    const company = screen.getByLabelText(/company/i);
    expect(company).toHaveAccessibleDescription("Enter the company name.");
    expect(company).toBeInvalid();
    expect(company).toHaveFocus();
    expect(screen.getByLabelText(/position/i)).toHaveAccessibleDescription("Enter the position.");
    expect(screen.getByLabelText(/job posting link/i)).toHaveAccessibleDescription(
      "Enter a full link that starts with https://"
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears a message as soon as the field is fixed", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();
    await user.click(screen.getByRole("button", { name: "Add application" }));
    const company = screen.getByLabelText(/company/i);
    await user.type(company, "Wise");
    expect(company).toBeValid();
    expect(company).not.toHaveAccessibleDescription();

    await user.type(screen.getByLabelText(/position/i), "Designer");
    await user.click(screen.getByRole("button", { name: "Add application" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows field messages sent back by the server", async () => {
    const user = userEvent.setup();
    renderForm({
      onSubmit: vi.fn(async () => ({ error: "x", fieldErrors: { salary: "Use 60 characters or fewer." } })),
    });
    await user.type(screen.getByLabelText(/company/i), "Wise");
    await user.type(screen.getByLabelText(/position/i), "Designer");
    await user.click(screen.getByRole("button", { name: "Add application" }));
    expect(await screen.findByText("Use 60 characters or fewer.")).toBeInTheDocument();
    expect(screen.getByLabelText(/salary/i)).toHaveFocus();
  });
});
