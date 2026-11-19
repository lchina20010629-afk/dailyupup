import { describe, expect, it } from "vitest";
import { GET, POST } from "../src/app/api/cron/nightly/route";
import { cronAuthorized } from "../src/lib/cronAuth";

describe("cron authorization", () => {
  it("accepts only the exact bearer secret", () => {
    expect(cronAuthorized("Bearer night-key", "night-key")).toBe(true);
    expect(cronAuthorized("Bearer night-key ", "night-key")).toBe(false);
    expect(cronAuthorized(null, "night-key")).toBe(false);
    expect(cronAuthorized("Bearer other", "night-key")).toBe(false);
    expect(GET).toBe(POST);
  });
});
