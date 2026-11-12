import { describe, expect, it, vi } from "vitest";
import { stageFor } from "@/lib/stages";

vi.mock("@/lib/auth/auth-client", () => ({ useSession: vi.fn(), signOut: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

describe("stageFor", () => {
  it.each([
    ["Wish List", "wish"],
    ["Applied", "applied"],
    ["Interviewing", "interviewing"],
    ["interview round 2", "interviewing"],
    ["Offer", "offer"],
    ["Rejected", "rejected"],
    ["  applied  ", "applied"],
    ["Backlog", "other"],
  ])("maps %j to %s", (name, key) => {
    expect(stageFor(name).key).toBe(key);
  });

  it("colours by name, not by column position", () => {
    expect(stageFor("Offer").colorVar).toBe("var(--stage-offer)");
  });
});

describe("initialFor", () => {
  it("prefers the name, then email, then U", async () => {
    const { initialFor } = await import("@/components/navbar");
    expect(initialFor({ name: "ada lovelace", email: "x@y.z" })).toBe("A");
    expect(initialFor({ name: "  ", email: "zed@example.com" })).toBe("Z");
    expect(initialFor({ name: null, email: "bob@example.com" })).toBe("B");
    expect(initialFor(null)).toBe("U");
  });
});
