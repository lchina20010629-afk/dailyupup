import { describe, expect, it } from "vitest";
import { themeChoice } from "../src/lib/themes";

describe("themes", () => {
  it("keeps a known theme and falls back to paper", () => {
    expect(themeChoice("ink")).toBe("ink");
    expect(themeChoice("tide")).toBe("tide");
    expect(themeChoice("night")).toBe("night");
    expect(themeChoice("paper")).toBe("paper");
    expect(themeChoice(null)).toBe("paper");
    expect(themeChoice("nope")).toBe("paper");
  });
});
