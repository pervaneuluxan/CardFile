import { describe, expect, it } from "vitest";
import { firstError, hasErrors, LIMITS, validateAuth, validateJob } from "@/lib/validation";

describe("validateAuth", () => {
  const ok = { name: "Ada Lovelace", email: "ada@example.com", password: "correct-horse" };

  it("accepts valid sign-up and sign-in details", () => {
    expect(validateAuth("signup", ok)).toEqual({});
    expect(validateAuth("signin", { email: ok.email, password: "short" })).toEqual({});
  });

  it("asks for each missing field by name", () => {
    expect(validateAuth("signup", { name: " ", email: "", password: "" })).toEqual({
      name: "Enter your name.",
      email: "Enter your email address.",
      password: "Enter your password.",
    });
  });

  it("does not ask for a name when signing in", () => {
    expect(validateAuth("signin", { email: "", password: "" })).not.toHaveProperty("name");
  });

  it.each(["ada", "ada@", "ada@example", "a da@example.com", "@example.com"])("rejects the email %j", (email) => {
    expect(validateAuth("signin", { email, password: "x" }).email).toMatch(/name@example\.com/);
  });

  it("trims the email before checking it", () => {
    expect(validateAuth("signin", { email: "  ada@example.com ", password: "x" })).toEqual({});
  });

  it("requires 8 to 128 characters for a new password only", () => {
    expect(validateAuth("signup", { ...ok, password: "1234567" }).password).toBe("Use at least 8 characters.");
    expect(validateAuth("signup", { ...ok, password: "x".repeat(129) }).password).toBe("Use 128 characters or fewer.");
    expect(validateAuth("signin", { email: ok.email, password: "1234567" })).toEqual({});
  });

  it("limits the name length", () => {
    expect(validateAuth("signup", { ...ok, name: "x".repeat(LIMITS.name + 1) }).name).toBe("Use 80 characters or fewer.");
  });
});

describe("validateJob", () => {
  const ok = { company: "Wise", position: "Designer" };

  it("accepts the two required fields alone", () => {
    expect(validateJob(ok)).toEqual({});
  });

  it("requires company and position (spaces don't count)", () => {
    expect(validateJob({ company: "  ", position: "" })).toEqual({
      company: "Enter the company name.",
      position: "Enter the position.",
    });
  });

  it.each(["https://jobs.example.com/1", "http://example.com", "  https://example.com/a?b=1  "])(
    "accepts the link %j",
    (jobUrl) => expect(validateJob({ ...ok, jobUrl })).toEqual({})
  );

  it.each(["example.com/jobs", "javascript:alert(1)", "ftp://example.com", "https://localhost", "not a link"])(
    "rejects the link %j",
    (jobUrl) => expect(validateJob({ ...ok, jobUrl }).jobUrl).toBe("Enter a full link that starts with https://")
  );

  it("treats an empty link as fine", () => {
    expect(validateJob({ ...ok, jobUrl: "" })).toEqual({});
  });

  it("enforces length limits", () => {
    const errors = validateJob({
      company: "c".repeat(LIMITS.company + 1),
      position: "p".repeat(LIMITS.position + 1),
      location: "l".repeat(LIMITS.location + 1),
      salary: "s".repeat(LIMITS.salary + 1),
      description: "d".repeat(LIMITS.description + 1),
      notes: "n".repeat(LIMITS.notes + 1),
    });
    expect(Object.keys(errors).sort()).toEqual(["company", "description", "location", "notes", "position", "salary"]);
  });

  it("limits the number and length of tags", () => {
    expect(validateJob({ ...ok, tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }).tags).toBe("Use 10 tags or fewer.");
    expect(validateJob({ ...ok, tags: ["x".repeat(31)] }).tags).toBe("Keep each tag to 30 characters or fewer.");
    expect(validateJob({ ...ok, tags: ["React", "Remote"] })).toEqual({});
  });

  it("in partial mode only checks the fields that were sent", () => {
    expect(validateJob({ notes: "call back" }, { partial: true })).toEqual({});
    expect(validateJob({ company: "" }, { partial: true })).toEqual({ company: "Enter the company name." });
  });
});

describe("helpers", () => {
  it("hasErrors and firstError", () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ a: "x" })).toBe(true);
    expect(firstError({ a: "first", b: "second" })).toBe("first");
    expect(firstError({})).toBeUndefined();
  });
});
