import { describe, expect, it } from "vitest";
import { pageGate, passwordsMatch, sessionCookie, signSession, verifySession } from "../src/lib/auth";

describe("session gate", () => {
  it("accepts the password, rejects a different one, and sets an HttpOnly cookie", () => {
    expect(passwordsMatch("correct horse", "correct horse")).toBe(true);
    expect(passwordsMatch("nope", "correct horse")).toBe(false);
    expect(passwordsMatch("correct horse!", "correct horse")).toBe(false);
    const cookie = sessionCookie("token", true);
    expect(cookie).toMatchObject({
      name: "dr_session",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      maxAge: 2592000,
    });
  });

  it("rejects a tampered or expired token", () => {
    const token = signSession("secret", 2_000);
    expect(verifySession("secret", token, 1_000)).toBe(true);
    expect(verifySession("secret", token, 2_000)).toBe(false);
    expect(verifySession("other", token, 1_000)).toBe(false);
    expect(verifySession("secret", `${token}x`, 1_000)).toBe(false);
  });

  it("sends private pages to login and logged-in visitors away from login", () => {
    expect(pageGate("/today", false)).toBe("to-login");
    expect(pageGate("/diary/2026-11-18", false)).toBe("to-login");
    expect(pageGate("/study", false)).toBe("to-login");
    expect(pageGate("/login", false)).toBe("allow");
    expect(pageGate("/login", true)).toBe("to-today");
    expect(pageGate("/today", true)).toBe("allow");
    expect(pageGate("/api/cron/nightly", false)).toBe("allow");
    expect(pageGate("/api/login", false)).toBe("allow");
  });
});
