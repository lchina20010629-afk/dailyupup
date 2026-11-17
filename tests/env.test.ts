import { describe, expect, it } from "vitest";
import { missingEnv, REQUIRED_ENV } from "../src/lib/env";

describe("required env", () => {
  it("names every missing key and ignores present ones", () => {
    expect(REQUIRED_ENV).toEqual([
      "APP_PASSWORD",
      "SESSION_SECRET",
      "DATABASE_URL",
      "DEEPSEEK_API_KEY",
      "CRON_SECRET",
      "R2_ACCOUNT_ID",
      "R2_BUCKET",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_ENDPOINT",
    ]);
    const source = Object.fromEntries(REQUIRED_ENV.map((key) => [key, "x"]));
    delete source.DEEPSEEK_API_KEY;
    delete source.R2_BUCKET;
    expect(missingEnv(source)).toEqual(["DEEPSEEK_API_KEY", "R2_BUCKET"]);
  });
});
