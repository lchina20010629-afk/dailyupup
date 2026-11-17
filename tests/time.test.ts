import { describe, expect, it } from "vitest";
import { addShanghaiDays, shanghaiClock, shanghaiDate } from "../src/lib/time";

describe("shanghai day boundary", () => {
  it("keeps 23:59 and the 23:00 cron instant on the same Shanghai day", () => {
    expect(shanghaiDate(new Date("2026-11-17T15:59:59.000Z"))).toBe("2026-11-17");
    expect(shanghaiClock(new Date("2026-11-17T15:59:59.000Z"))).toBe("23:59");
    expect(shanghaiDate(new Date("2026-11-18T15:00:00.000Z"))).toBe("2026-11-18");
    expect(shanghaiDate(new Date("2026-11-17T16:00:00.000Z"))).toBe("2026-11-18");
    expect(shanghaiClock(new Date("2026-11-17T16:00:00.000Z"))).toBe("00:00");
  });

  it("rolls the calendar across a month end", () => {
    expect(addShanghaiDays("2026-11-30", 1)).toBe("2026-12-01");
  });
});
